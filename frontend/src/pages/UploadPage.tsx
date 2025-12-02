import { useCallback, useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowRight, CheckCircle, HardDrive, Image, Inbox, Upload, Sparkles, AlertTriangle, RefreshCw, Info } from "lucide-react";
import { UploadDropzone } from "../features/photos/components/UploadDropzone";
import { StatusBadge } from "../components/shared/StatusBadge";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Progress } from "../components/ui/progress";
import { Switch } from "../components/ui/switch";
import { Dialog, DialogHeader, DialogContent } from "../components/ui/dialog";
import { EmptyState } from "../components/shared/EmptyState";
import { photoClient, aiClient } from "../lib/api/client";
import { usePhotos } from "../lib/PhotosContext";
import { useAISettings } from "../hooks/useAISettings";
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
  const { photos, refresh, setUploadingCount } = usePhotos();
  const { autoTagOnUpload, setAutoTagOnUpload } = useAISettings();

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

  // Track photos pending AI tagging
  const pendingAutoTagRef = useRef<Set<string>>(new Set());
  const taggedPhotosRef = useRef<Set<string>>(new Set());

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

  // Auto-tag photos when they finish processing (if enabled)
  useEffect(() => {
    if (!autoTagOnUpload) return;

    // Find photos that are pending auto-tag and have finished processing
    const photosToTag = photos.filter(
      (p) =>
        pendingAutoTagRef.current.has(p.id) &&
        p.status === "PROCESSED" &&
        !taggedPhotosRef.current.has(p.id) &&
        p.tags.length === 0 // Only tag if no tags yet
    );

    // Trigger AI tagging for each
    photosToTag.forEach(async (photo) => {
      taggedPhotosRef.current.add(photo.id);
      pendingAutoTagRef.current.delete(photo.id);
      try {
        console.log(`Auto-tagging photo: ${photo.filename}`);
        await aiClient.autoTag(photo.id);
        refresh(); // Refresh to get updated tags
      } catch (error) {
        console.error(`Failed to auto-tag ${photo.filename}:`, error);
      }
    });
  }, [photos, autoTagOnUpload, refresh]);

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
          response.items.forEach((photo) => {
            uploadedPhotoIds.push(photo.id);
            filenameToPhotoId[photo.filename] = photo.id;
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
      // Check if we need to show bulk upload warning
      if (autoTagOnUpload && files.length > BULK_UPLOAD_WARNING_THRESHOLD) {
        // Store pending files and callback for after user confirms
        setPendingFiles(files);
        pendingProgressCallback.current = onProgress;
        setShowBulkWarning(true);
        return;
      }

      // No warning needed, proceed with upload
      await performUpload(files, onProgress, autoTagOnUpload, convertToCompatible);
    },
    [autoTagOnUpload, convertToCompatible, performUpload]
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
                {uploadingFiles.map((file, index) => (
                  <div
                    key={index}
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
                      {file.preview ? (
                        <img
                          src={file.preview}
                          alt={file.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Image className="h-8 w-8 text-muted-foreground" />
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
                ))}
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
          <Card className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  AI Auto-Tagging
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Automatically tag photos on upload using AI
                </p>
              </div>
              <Switch
                checked={autoTagOnUpload}
                onCheckedChange={setAutoTagOnUpload}
              />
            </div>
            {autoTagOnUpload && (
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
