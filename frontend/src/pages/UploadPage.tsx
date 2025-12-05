import { useCallback, useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowRight, CheckCircle, HardDrive, Image, Inbox, Upload, Sparkles, AlertTriangle, RefreshCw, Info, HelpCircle, ShieldAlert, WifiOff } from "lucide-react";
import { UploadDropzone } from "../features/photos/components/UploadDropzone";
import { StatusBadge } from "../components/shared/StatusBadge";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Progress } from "../components/ui/progress";
import { Switch } from "../components/ui/switch";
import { Dialog, DialogHeader, DialogContent } from "../components/ui/dialog";
import { EmptyState } from "../components/shared/EmptyState";
import { Tooltip } from "../components/ui/tooltip";
import { photoClient, API_BASE } from "../lib/api/client";
import { usePhotos } from "../lib/PhotosContext";
import { useAISettings } from "../hooks/useAISettings";
import { useAuth } from "../contexts/AuthContext";
import { useAIService } from "../contexts/AIServiceContext";
import { formatRelativeTime, formatFileSize } from "../lib/utils";

const BULK_UPLOAD_WARNING_THRESHOLD = 100;

interface UploadingFile {
  name: string;
  size: number;
  preview?: string;
  photoId?: string;
}

export function UploadPage() {
  const navigate = useNavigate();
  const { photos, refresh, setPhotos, setUploadingCount } = usePhotos();
  const { autoTagOnUpload, setAutoTagOnUpload } = useAISettings();
  const { aiTaggingEnabled: userAiTaggingEnabled } = useAuth();
  const { isAvailable: isAiServiceAvailable, isChecking: isAiServiceChecking, queuePhotosForTagging, hasBeenTagged } = useAIService();

  // Check if AI tagging is disabled by admin
  const isAiTaggingDisabledByAdmin = !userAiTaggingEnabled;

  // Check if AI service is unavailable
  const isAiServiceUnavailable = !isAiServiceAvailable && !isAiServiceChecking;

  // Upload state for preview
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  // Image conversion toggle (for AI compatibility)
  const [convertToCompatible, setConvertToCompatible] = useState(true);

  // Bulk upload warning state
  const [showBulkWarning, setShowBulkWarning] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const pendingProgressCallback = useRef<((progress: number, speed: number) => void) | null>(null);

  // Track photos pending AI tagging (for this upload session)
  const pendingAutoTagRef = useRef<Set<string>>(new Set());

  // Show recently completed photos (processed or failed)
  const completedPhotos = photos.filter((p) =>
    ["PROCESSED", "FAILED", "APPROVED", "REJECTED"].includes(p.status)
  );

  // Count stats
  const processedCount = photos.filter(p => p.status === "PROCESSED").length;
  const failedCount = photos.filter(p => p.status === "FAILED").length;
  const approvedCount = photos.filter(p => p.status === "APPROVED").length;

  // Calculate total storage used
  const totalStorageBytes = photos.reduce((acc, p) => acc + p.sizeBytes, 0);

  // Auto-tag photos when they finish processing (if enabled and not admin-disabled)
  // Uses the global AIServiceContext for tagging which persists across navigation
  useEffect(() => {
    if (!autoTagOnUpload || isAiTaggingDisabledByAdmin || isAiServiceUnavailable) return;

    // Find photos that need tagging:
    // - PROCESSED status with no tags
    // - Not already tagged this session (tracked by context)
    // - In pendingAutoTagRef (uploaded this session with auto-tag enabled)
    const photosToTag = photos.filter(
      (p) =>
        p.status === "PROCESSED" &&
        p.tags.length === 0 &&
        !hasBeenTagged(p.id) &&
        pendingAutoTagRef.current.has(p.id)
    );

    if (photosToTag.length === 0) return;

    // Queue for tagging via context (handles debouncing, batching, progress UI)
    const photoIds = photosToTag.map(p => p.id);
    console.log(`[UploadPage] Queueing ${photoIds.length} photos for auto-tagging`);
    queuePhotosForTagging(photoIds);

    // Clean up from pending ref
    photoIds.forEach(id => pendingAutoTagRef.current.delete(id));
  }, [photos, autoTagOnUpload, isAiTaggingDisabledByAdmin, isAiServiceUnavailable, queuePhotosForTagging, hasBeenTagged]);

  // Poll for any remaining untagged photos (catches race conditions)
  useEffect(() => {
    if (!autoTagOnUpload || isAiTaggingDisabledByAdmin || isAiServiceUnavailable) return;
    if (pendingAutoTagRef.current.size === 0) return;

    // Set up an interval to check for late-arriving photos
    const pollInterval = setInterval(() => {
      const photosToTag = photos.filter(
        (p) =>
          p.status === "PROCESSED" &&
          p.tags.length === 0 &&
          !hasBeenTagged(p.id) &&
          pendingAutoTagRef.current.has(p.id)
      );

      if (photosToTag.length > 0) {
        const photoIds = photosToTag.map(p => p.id);
        console.log(`[UploadPage] Poll found ${photoIds.length} untagged photos`);
        queuePhotosForTagging(photoIds);
        photoIds.forEach(id => pendingAutoTagRef.current.delete(id));
      }

      // Stop polling if no more pending photos
      if (pendingAutoTagRef.current.size === 0) {
        clearInterval(pollInterval);
      }
    }, 1000); // Check every second

    return () => clearInterval(pollInterval);
  }, [photos, autoTagOnUpload, isAiTaggingDisabledByAdmin, isAiServiceUnavailable, queuePhotosForTagging, hasBeenTagged]);

  // Perform the actual upload (separated so it can be called after warning dialog)
  const performUpload = useCallback(
    async (files: File[], onProgress: (progress: number, speed: number) => void, enableAutoTag: boolean, enableConversion: boolean = true) => {
      // Create previews for the files being uploaded
      const uploading: UploadingFile[] = files.map((file) => ({
        name: file.name,
        size: file.size,
        preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
      }));

      setUploadingFiles((prev) => [...prev, ...uploading]);
      setIsUploading(true);
      setUploadProgress(0);
      setUploadingCount(files.length); // Track in global context for status bar

      // Track the visual progress separately from actual upload
      let visualProgress = 0;
      let actualProgress = 0;
      let currentSpeed = 0;
      let uploadComplete = false;

      // Smoothly animate visual progress to catch up with actual progress
      const progressInterval = setInterval(() => {
        if (visualProgress < actualProgress) {
          visualProgress = Math.min(visualProgress + 2, actualProgress);
          setUploadProgress(visualProgress);
        }
        // Always pass the current speed when we have progress
        if (!uploadComplete) {
          onProgress(visualProgress, currentSpeed);
        }
        if (uploadComplete && visualProgress >= 100) {
          clearInterval(progressInterval);
        }
      }, 50);

      try {
        // Upload in batches of 30 files
        const BATCH_SIZE = 30;
        const totalBatches = Math.ceil(files.length / BATCH_SIZE);
        const uploadedPhotoIds: string[] = [];
        const filenameToPhotoId: Record<string, string> = {};

        for (let i = 0; i < files.length; i += BATCH_SIZE) {
          const batch = files.slice(i, i + BATCH_SIZE);
          const batchNum = Math.floor(i / BATCH_SIZE) + 1;

          const { promise } = photoClient.uploadPhotos(batch, (batchProgress, speed) => {
            // Calculate overall progress across all batches
            const completedBatches = batchNum - 1;
            actualProgress = Math.round(
              ((completedBatches * 100 + batchProgress) / totalBatches)
            );
            currentSpeed = speed;
            // Also update speed immediately for responsiveness
            onProgress(visualProgress, speed);
          }, { convertToCompatible: enableConversion });

          const response = await promise;
          // Track uploaded photo IDs for auto-tagging and linking
          // Map both the final filename AND original filename to the photo ID
          // (conversion may change the filename extension, e.g., photo.cr2 -> photo.jpg)
          response.items.forEach((photo, idx) => {
            uploadedPhotoIds.push(photo.id);
            filenameToPhotoId[photo.filename] = photo.id;
            // Also map the original filename from the batch
            const originalFile = batch[idx];
            if (originalFile && originalFile.name !== photo.filename) {
              filenameToPhotoId[originalFile.name] = photo.id;
            }
          });
          // Immediately merge uploaded photos into state so thumbnails can display
          setPhotos((prev) => {
            const existingIds = new Set(prev.map(p => p.id));
            const newPhotos = response.items.filter(p => !existingIds.has(p.id));
            return [...newPhotos, ...prev];
          });
        }

        // Update uploadingFiles with their photo IDs for navigation
        setUploadingFiles((prev) =>
          prev.map((file) => ({
            ...file,
            photoId: filenameToPhotoId[file.name] || file.photoId,
          }))
        );

        // If auto-tagging is enabled for this upload, add uploaded photos to pending queue
        if (enableAutoTag) {
          uploadedPhotoIds.forEach((id) => pendingAutoTagRef.current.add(id));
          console.log(`Queued ${uploadedPhotoIds.length} photos for auto-tagging`);
        }

        uploadComplete = true;
        actualProgress = 100;

        // Wait for visual progress to reach 100
        await new Promise<void>((resolve) => {
          const checkComplete = setInterval(() => {
            if (visualProgress >= 100) {
              clearInterval(checkComplete);
              resolve();
            }
          }, 50);
        });

        // Refresh from server to get the new photos
        await refresh();
        setIsUploading(false);
        setUploadProgress(100);
        setUploadingCount(0); // Clear uploading count
      } catch (error) {
        clearInterval(progressInterval);
        console.error("Upload failed:", error);
        setIsUploading(false);
        setUploadingCount(0); // Clear uploading count on error too
      }
    },
    [refresh, setUploadingCount]
  );

  const handleUpload = useCallback(
    async (files: File[], onProgress: (progress: number, speed: number) => void) => {
      // If admin disabled AI tagging, don't show bulk warning and don't enable auto-tag
      const effectiveAutoTag = autoTagOnUpload && !isAiTaggingDisabledByAdmin;

      // Check if we need to show bulk upload warning
      if (effectiveAutoTag && files.length > BULK_UPLOAD_WARNING_THRESHOLD) {
        // Store pending files and callback for after user confirms
        setPendingFiles(files);
        pendingProgressCallback.current = onProgress;
        setShowBulkWarning(true);
        return;
      }

      // No warning needed, proceed with upload
      await performUpload(files, onProgress, effectiveAutoTag, convertToCompatible);
    },
    [autoTagOnUpload, isAiTaggingDisabledByAdmin, convertToCompatible, performUpload]
  );

  // Handle bulk warning dialog actions
  const handleBulkWarningProceed = useCallback(async () => {
    setShowBulkWarning(false);
    if (pendingFiles.length > 0 && pendingProgressCallback.current) {
      await performUpload(pendingFiles, pendingProgressCallback.current, true, convertToCompatible);
    }
    setPendingFiles([]);
    pendingProgressCallback.current = null;
  }, [pendingFiles, performUpload, convertToCompatible]);

  const handleBulkWarningDisableAI = useCallback(async () => {
    setShowBulkWarning(false);
    setAutoTagOnUpload(false);
    if (pendingFiles.length > 0 && pendingProgressCallback.current) {
      await performUpload(pendingFiles, pendingProgressCallback.current, false, convertToCompatible);
    }
    setPendingFiles([]);
    pendingProgressCallback.current = null;
  }, [pendingFiles, performUpload, setAutoTagOnUpload, convertToCompatible]);

  const handleBulkWarningCancel = useCallback(() => {
    setShowBulkWarning(false);
    setPendingFiles([]);
    pendingProgressCallback.current = null;
  }, []);


  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6 md:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold mb-1">Upload Photos</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Drop photos to start the processing workflow
          </p>
        </div>
        <Button onClick={() => navigate("/review")} variant="outline" size="sm" className="self-start sm:self-auto">
          Go to Review
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>

      {/* Main Upload Section */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
        {/* Upload Area - Left side */}
        <div className="lg:col-span-3">
          {/* Upload Dropzone or Upload Preview */}
          {uploadingFiles.length > 0 ? (
            <Card className="p-6 h-full min-h-[340px]">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {isUploading ? (
                    <Upload className="h-6 w-6 text-primary animate-pulse" />
                  ) : (
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  )}
                  <div>
                    <h3 className="font-semibold">
                      {isUploading
                        ? `Uploading ${uploadingFiles.length} photos...`
                        : `${uploadingFiles.length} photos uploaded`}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {isUploading
                        ? "Please wait while your photos are being uploaded"
                        : "All photos have been uploaded and are being processed"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <Progress value={uploadProgress} className="mb-4 h-2" />
              <p className="text-sm text-muted-foreground text-center mb-4">
                {uploadProgress}% complete
              </p>

              {/* Photo Grid Preview */}
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-[200px] overflow-y-auto">
                {uploadingFiles.map((file, index) => {
                  // Check if server has a preview available for this photo
                  const serverPhoto = file.photoId ? photos.find(p => p.id === file.photoId) : null;

                  // Determine the best URL to display
                  // Check both local file extension AND server mimeType (for converted files)
                  const browserDisplayableMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/bmp'];
                  const localIsBrowserDisplayable = /\.(jpe?g|png|gif|webp|svg|bmp|ico)$/i.test(file.name);
                  const serverIsBrowserDisplayable = serverPhoto?.mimeType && browserDisplayableMimeTypes.includes(serverPhoto.mimeType);

                  let displayUrl: string | undefined;
                  if (serverPhoto?.hasPreview) {
                    // Server has a generated preview (for RAW files uploaded without conversion)
                    displayUrl = `${API_BASE}/photos/${serverPhoto.id}/preview`;
                  } else if (serverPhoto?.id && serverIsBrowserDisplayable) {
                    // Server file is browser-displayable (either originally or after conversion)
                    displayUrl = `${API_BASE}/photos/${serverPhoto.id}/content`;
                  } else if (localIsBrowserDisplayable && file.preview) {
                    // Fall back to local blob only for browser-displayable files
                    displayUrl = file.preview;
                  }
                  // For RAW files without server preview yet, displayUrl stays undefined -> shows placeholder

                  return (
                    <div
                      key={`${index}-${serverPhoto?.hasPreview || false}`}
                      className={`w-full pb-[100%] relative rounded-lg overflow-hidden bg-muted group ${
                        file.photoId && !isUploading ? "cursor-pointer" : ""
                      }`}
                      onClick={() => {
                        if (file.photoId && !isUploading) {
                          navigate(`/review?photoId=${file.photoId}`);
                        }
                      }}
                    >
                      <div className="absolute inset-0">
                        {displayUrl ? (
                          <img
                            src={displayUrl}
                            alt={file.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // If image fails to load, hide it and show fallback
                              (e.target as HTMLImageElement).style.display = "none";
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Image className="h-8 w-8 text-muted-foreground animate-pulse" />
                          </div>
                        )}
                        {/* Overlay with file info on hover */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2">
                          <p className="text-white text-xs text-center truncate w-full">
                            {file.name}
                          </p>
                          <p className="text-white/70 text-xs">
                            {formatFileSize(file.size)}
                          </p>
                          {file.photoId && !isUploading && (
                            <p className="text-white/90 text-xs mt-1">Click to view</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Upload More Button */}
              {!isUploading && (
                <div className="mt-4 pt-4 border-t">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      uploadingFiles.forEach((f) => {
                        if (f.preview) URL.revokeObjectURL(f.preview);
                      });
                      setUploadingFiles([]);
                      setUploadProgress(0);
                    }}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload More Photos
                  </Button>
                </div>
              )}
            </Card>
          ) : (
            <Card className="h-full min-h-[340px] border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors">
              <UploadDropzone onUpload={handleUpload} />
            </Card>
          )}
        </div>

        {/* Quick Stats & Legend - Right side */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-4">
            <h3 className="text-sm font-medium mb-3">Quick Stats</h3>
            <div className="grid grid-cols-2 gap-3">
              <Link
                to="/review?status=PROCESSED"
                className="p-3 bg-muted/50 rounded-lg text-center hover:bg-muted transition-colors"
              >
                <p className="text-2xl font-bold text-amber-500">{processedCount}</p>
                <p className="text-xs text-muted-foreground">Ready</p>
              </Link>
              <Link
                to="/review?status=APPROVED"
                className="p-3 bg-muted/50 rounded-lg text-center hover:bg-muted transition-colors"
              >
                <p className="text-2xl font-bold text-emerald-500">{approvedCount}</p>
                <p className="text-xs text-muted-foreground">Approved</p>
              </Link>
              <Link
                to="/review?status=FAILED"
                className="p-3 bg-muted/50 rounded-lg text-center hover:bg-muted transition-colors"
              >
                <p className="text-2xl font-bold text-red-500">{failedCount}</p>
                <p className="text-xs text-muted-foreground">Failed</p>
              </Link>
              <Link
                to="/review?status=ALL"
                className="p-3 bg-muted/50 rounded-lg text-center hover:bg-muted transition-colors"
              >
                <p className="text-2xl font-bold">{photos.length}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </Link>
            </div>
          </Card>

          {/* Storage Tracker */}
          <Card className="p-4">
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
              <HardDrive className="h-4 w-4" />
              Storage Used
            </h3>
            <div className="text-center py-4">
              <p className="text-3xl font-bold">{formatFileSize(totalStorageBytes)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                across {photos.length} {photos.length === 1 ? "photo" : "photos"}
              </p>
            </div>
          </Card>

          {/* Image Conversion Toggle */}
          <Card className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 text-blue-500" />
                  Convert for AI Compatibility
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Convert TIFF, BMP to JPEG/PNG for AI tagging
                </p>
              </div>
              <Switch
                checked={convertToCompatible}
                onCheckedChange={setConvertToCompatible}
              />
            </div>
            {!convertToCompatible && (
              <div className="mt-3 p-2 bg-blue-500/10 border border-blue-500/20 rounded-md">
                <p className="text-xs text-blue-600 dark:text-blue-400 flex items-start gap-1.5">
                  <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  <span>Incompatible formats (TIFF, BMP, HEIC) will not be converted. AI tagging will be disabled for these photos.</span>
                </p>
              </div>
            )}
          </Card>

          {/* AI Auto-Tagging Toggle */}
          <Card className={`p-4 ${isAiTaggingDisabledByAdmin || isAiServiceUnavailable ? "opacity-60" : ""}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  {isAiServiceUnavailable ? (
                    <WifiOff className="h-4 w-4 text-slate-400" />
                  ) : isAiTaggingDisabledByAdmin ? (
                    <ShieldAlert className="h-4 w-4 text-slate-400" />
                  ) : (
                    <Sparkles className="h-4 w-4 text-amber-500" />
                  )}
                  AI Auto-Tagging
                  {!isAiTaggingDisabledByAdmin && !isAiServiceUnavailable && (
                    <Tooltip
                      content={
                        <div className="text-left space-y-1 min-w-[160px]">
                          <p className="font-semibold">Supported formats:</p>
                          <p>JPEG, PNG, WebP, GIF</p>
                          <p className="text-xs text-zinc-400 border-t border-zinc-600 pt-1.5 mt-1.5">TIFF, BMP auto-convert when enabled</p>
                        </div>
                      }
                    >
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground cursor-help" />
                    </Tooltip>
                  )}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {isAiServiceUnavailable
                    ? "AI service is not running"
                    : isAiTaggingDisabledByAdmin
                    ? "Disabled by administrator"
                    : "Automatically tag photos on upload using AI"}
                </p>
              </div>
              {isAiServiceUnavailable ? (
                <Tooltip content="AI service is not running. Start the service to enable auto-tagging.">
                  <span>
                    <Switch
                      checked={false}
                      onCheckedChange={() => {}}
                      disabled={true}
                    />
                  </span>
                </Tooltip>
              ) : isAiTaggingDisabledByAdmin ? (
                <Tooltip content="AI tagging has been disabled by an administrator">
                  <span>
                    <Switch
                      checked={false}
                      onCheckedChange={() => {}}
                      disabled={true}
                    />
                  </span>
                </Tooltip>
              ) : (
                <Switch
                  checked={autoTagOnUpload}
                  onCheckedChange={setAutoTagOnUpload}
                />
              )}
            </div>
            {isAiServiceUnavailable && (
              <div className="mt-3 p-2 bg-red-500/10 border border-red-500/20 rounded-md">
                <p className="text-xs text-red-600 dark:text-red-400 flex items-start gap-1.5">
                  <WifiOff className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  AI service is not running. Start the service to enable auto-tagging.
                </p>
              </div>
            )}
            {!isAiServiceUnavailable && isAiTaggingDisabledByAdmin && (
              <div className="mt-3 p-2 bg-slate-500/10 border border-slate-500/20 rounded-md">
                <p className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-1.5">
                  <ShieldAlert className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  AI tagging has been disabled by an administrator.
                </p>
              </div>
            )}
            {!isAiServiceUnavailable && !isAiTaggingDisabledByAdmin && autoTagOnUpload && (
              <div className="mt-3 p-2 bg-amber-500/10 border border-amber-500/20 rounded-md">
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Note: AI tagging uses OpenAI API and incurs additional costs per image analyzed.
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Recently Completed Section */}
      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b flex items-center justify-between bg-muted/30">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            Recently Completed
            <span className="text-muted-foreground font-normal">({completedPhotos.length})</span>
          </h2>
          {completedPhotos.length > 0 && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => navigate("/review")}
              className="text-xs h-7"
            >
              View All
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          )}
        </div>

        <div className="max-h-[300px] overflow-y-auto">
          {completedPhotos.length === 0 ? (
            <div className="py-12 flex items-center justify-center">
              <EmptyState
                icon={Inbox}
                title="No completed items"
                description="Processed photos will appear here"
                size="sm"
              />
            </div>
          ) : (
            <div className="divide-y">
              {completedPhotos.slice(0, 20).map((photo) => (
                <div
                  key={photo.id}
                  className="px-4 py-3 flex items-center justify-between hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => navigate(`/review?photoId=${photo.id}`)}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">
                      {photo.filename}
                    </p>
                    {photo.failureReason ? (
                      <p className="text-xs text-destructive truncate">
                        {photo.failureReason}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        {formatRelativeTime(photo.updatedAt)}
                      </p>
                    )}
                  </div>
                  <StatusBadge status={photo.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Status Legend */}
      <div className="mt-6 p-3 md:p-4 bg-muted/50 rounded-lg">
        <h3 className="text-sm font-medium mb-3">Status Legend</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:flex md:flex-wrap gap-x-6 gap-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
            <span className="text-muted-foreground">Pending</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
            <span className="text-muted-foreground">Processing</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span className="text-muted-foreground">Ready</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
            <span className="text-muted-foreground">Failed</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span className="text-muted-foreground">Approved</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
            <span className="text-muted-foreground">Rejected</span>
          </div>
        </div>
      </div>

      {/* Bulk Upload AI Tagging Warning Dialog */}
      <Dialog open={showBulkWarning} onClose={handleBulkWarningCancel}>
        <DialogHeader onClose={handleBulkWarningCancel}>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Large Upload with AI Tagging
          </div>
        </DialogHeader>
        <DialogContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              You're about to upload <span className="font-semibold text-foreground">{pendingFiles.length} photos</span> with
              AI auto-tagging enabled. This will make {pendingFiles.length} API calls to the AI service, which may:
            </p>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 ml-2">
              <li>Incur significant API costs</li>
              <li>Take a long time to process</li>
              <li>Potentially hit rate limits</li>
            </ul>
            <div className="flex flex-col gap-2 pt-4">
              <Button onClick={handleBulkWarningProceed} className="w-full">
                <Sparkles className="h-4 w-4 mr-2" />
                Continue with AI Tagging
              </Button>
              <Button onClick={handleBulkWarningDisableAI} variant="outline" className="w-full">
                Upload without AI Tagging
              </Button>
              <Button onClick={handleBulkWarningCancel} variant="ghost" className="w-full">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
