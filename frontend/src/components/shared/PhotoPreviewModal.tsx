import { useState, useEffect, useCallback } from "react";
import { X, Check, XCircle, RefreshCw, Trash2, ChevronLeft, ChevronRight, Sparkles, Keyboard, Share2 } from "lucide-react";
import { Button } from "../ui/button";
import { StatusBadge } from "./StatusBadge";
import { TagEditor } from "./TagEditor";
import { useToast } from "../ui/toast";
import { photoClient, aiClient } from "../../lib/api/client";
import { formatFileSize, formatRelativeTime } from "../../lib/utils";
import type { Photo } from "../../lib/api/types";
import { CreateShareModal } from "../shares/CreateShareModal";

interface PhotoPreviewModalProps {
  photo: Photo;
  photos?: Photo[];
  onClose: () => void;
  onPhotoUpdate?: (photo: Photo) => void;
  onPhotoDelete?: (photoId: string) => void;
  onNavigate?: (photo: Photo) => void;
}

export function PhotoPreviewModal({
  photo,
  photos,
  onClose,
  onPhotoUpdate,
  onPhotoDelete,
  onNavigate,
}: PhotoPreviewModalProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAutoTagging, setIsAutoTagging] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const { toast } = useToast();

  const canApprove = photo.status === "PROCESSED" || photo.status === "REJECTED";
  const canReject = photo.status === "PROCESSED" || photo.status === "FAILED" || photo.status === "APPROVED";
  const canRetry = photo.status === "FAILED";

  // Lock body scroll when modal is open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;

    // Get scrollbar width to prevent layout shift
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";
    document.body.style.paddingRight = `${scrollbarWidth}px`;
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
      document.documentElement.style.overflow = "";
    };
  }, []);

  // Navigation
  const currentIndex = photos?.findIndex((p) => p.id === photo.id) ?? -1;
  const hasPrev = currentIndex > 0;
  const hasNext = photos && currentIndex < photos.length - 1;

  const handlePrev = () => {
    if (hasPrev && photos && onNavigate) {
      onNavigate(photos[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    if (hasNext && photos && onNavigate) {
      onNavigate(photos[currentIndex + 1]);
    }
  };

  const handleAction = async (action: "approve" | "reject" | "retry") => {
    setIsLoading(action);
    try {
      const updated = await photoClient.performAction(photo.id, action);
      onPhotoUpdate?.(updated);
      toast({
        type: "success",
        title: action === "approve" ? "Photo approved" : action === "reject" ? "Photo rejected" : "Retry requested",
      });
    } catch (error) {
      console.error(`Failed to ${action}:`, error);
      toast({
        type: "error",
        title: `Failed to ${action} photo`,
      });
    } finally {
      setIsLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this photo? This action cannot be undone.")) {
      return;
    }

    setIsDeleting(true);
    try {
      await photoClient.deletePhoto(photo.id);
      onPhotoDelete?.(photo.id);
      toast({
        type: "success",
        title: "Photo deleted",
      });
      onClose();
    } catch (error) {
      console.error("Failed to delete:", error);
      toast({
        type: "error",
        title: "Failed to delete photo",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAutoTag = async () => {
    setIsAutoTagging(true);
    try {
      const response = await aiClient.autoTag(photo.id);
      if (response.success && response.tags.length > 0) {
        // Refresh photo data to get updated tags
        const updatedPhoto = await photoClient.getPhotoById(photo.id);
        onPhotoUpdate?.(updatedPhoto);
        toast({
          type: "success",
          title: `Added ${response.tags.length} tag${response.tags.length !== 1 ? "s" : ""}`,
          description: response.tags.join(", "),
        });
      } else if (response.success && response.tags.length === 0) {
        toast({
          type: "info",
          title: "No tags generated",
          description: "The AI couldn't identify any tags for this image",
        });
      } else {
        throw new Error(response.error || "Failed to generate tags");
      }
    } catch (error) {
      console.error("Auto-tag failed:", error);
      toast({
        type: "error",
        title: "Auto-tag failed",
        description: error instanceof Error ? error.message : "Make sure the AI service is running",
      });
    } finally {
      setIsAutoTagging(false);
    }
  };

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const key = e.key.toLowerCase();

      switch (key) {
        case "escape":
          onClose();
          break;
        case "arrowleft":
          handlePrev();
          break;
        case "arrowright":
          handleNext();
          break;
        case "a":
          // Approve
          if (canApprove && isLoading === null) {
            e.preventDefault();
            handleAction("approve");
          }
          break;
        case "r":
          // Reject
          if (canReject && isLoading === null) {
            e.preventDefault();
            handleAction("reject");
          }
          break;
        case "t":
          // Retry
          if (canRetry && isLoading === null) {
            e.preventDefault();
            handleAction("retry");
          }
          break;
        case "d":
          // Delete
          if (!isDeleting) {
            e.preventDefault();
            handleDelete();
          }
          break;
        case "i":
          // AI Auto-tag
          if (!isAutoTagging) {
            e.preventDefault();
            handleAutoTag();
          }
          break;
        case "s":
          // Share
          e.preventDefault();
          setShowShareModal(true);
          break;
        case "?":
          // Toggle shortcuts help
          e.preventDefault();
          setShowShortcuts((prev) => !prev);
          break;
      }
    },
    [onClose, handlePrev, handleNext, canApprove, canReject, canRetry, isLoading, isDeleting, isAutoTagging]
  );

  // Global keyboard event listener
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 flex h-[100dvh] w-screen md:h-auto md:max-h-[90vh] md:max-w-[90vw] md:w-auto flex-col bg-background md:border md:border-border md:rounded-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-3 md:px-4 py-2 md:py-3 border-b border-border bg-muted/50">
          <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
            <h2 className="text-xs md:text-sm font-medium truncate">{photo.filename}</h2>
            <StatusBadge status={photo.status} />
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowShortcuts(true)}
              title="Keyboard shortcuts (?)"
              className="hidden md:flex"
            >
              <Keyboard className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose} title="Close (Esc)">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          {/* Image */}
          <div className="relative flex-1 flex items-center justify-center bg-black min-h-[200px] md:min-h-[400px] md:min-w-[500px]">
            {/* Navigation arrows */}
            {hasPrev && (
              <button
                onClick={handlePrev}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
            )}
            {hasNext && (
              <button
                onClick={handleNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            )}

            <img
              src={photoClient.getPhotoContentUrl(photo.id)}
              alt={photo.filename}
              className="max-h-[40vh] md:max-h-[70vh] max-w-full object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect fill='%231e293b' width='400' height='300'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%2364748b' font-family='system-ui' font-size='16'%3EImage not available%3C/text%3E%3C/svg%3E";
              }}
            />

            {/* Photo counter */}
            {photos && photos.length > 1 && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/50 text-white text-sm">
                {currentIndex + 1} / {photos.length}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="w-full md:w-64 border-t md:border-t-0 md:border-l border-border bg-background flex flex-col overflow-y-auto max-h-[50vh] md:max-h-none">
            {/* Photo details */}
            <div className="p-3 md:p-4 space-y-2 md:space-y-3 flex-1">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Filename</p>
                <p className="text-sm break-all">{photo.filename}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Size</p>
                <p className="text-sm">{formatFileSize(photo.sizeBytes)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Uploaded</p>
                <p className="text-sm">{formatRelativeTime(photo.uploadedAt)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Last Updated</p>
                <p className="text-sm">{formatRelativeTime(photo.updatedAt)}</p>
              </div>
              {photo.failureReason && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Error</p>
                  <p className="text-sm text-destructive">{photo.failureReason}</p>
                </div>
              )}
              <div className="pt-2 border-t border-border">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Tags</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={handleAutoTag}
                    disabled={isAutoTagging}
                  >
                    {isAutoTagging ? (
                      <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                    ) : (
                      <Sparkles className="h-3 w-3 mr-1" />
                    )}
                    Auto-tag
                  </Button>
                </div>
                <TagEditor photo={photo} onPhotoUpdate={onPhotoUpdate} />
              </div>
            </div>

            {/* Actions */}
            <div className="p-3 md:p-4 border-t border-border space-y-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Actions</p>

              {canApprove && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-between text-green-600 dark:text-green-500 hover:text-green-700 dark:hover:text-green-400 hover:bg-green-500/10"
                  onClick={() => handleAction("approve")}
                  disabled={isLoading !== null}
                >
                  <span className="flex items-center">
                    {isLoading === "approve" ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4 mr-2" />
                    )}
                    Approve
                  </span>
                  <kbd className="hidden md:inline px-1.5 py-0.5 text-[10px] font-mono bg-muted rounded">A</kbd>
                </Button>
              )}

              {canReject && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-between text-red-600 dark:text-red-500 hover:text-red-700 dark:hover:text-red-400 hover:bg-red-500/10"
                  onClick={() => handleAction("reject")}
                  disabled={isLoading !== null}
                >
                  <span className="flex items-center">
                    {isLoading === "reject" ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <XCircle className="h-4 w-4 mr-2" />
                    )}
                    Reject
                  </span>
                  <kbd className="hidden md:inline px-1.5 py-0.5 text-[10px] font-mono bg-muted rounded">R</kbd>
                </Button>
              )}

              {canRetry && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-between"
                  onClick={() => handleAction("retry")}
                  disabled={isLoading !== null}
                >
                  <span className="flex items-center">
                    {isLoading === "retry" ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Retry
                  </span>
                  <kbd className="hidden md:inline px-1.5 py-0.5 text-[10px] font-mono bg-muted rounded">T</kbd>
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                className="w-full justify-between"
                onClick={() => setShowShareModal(true)}
              >
                <span className="flex items-center">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </span>
                <kbd className="hidden md:inline px-1.5 py-0.5 text-[10px] font-mono bg-muted rounded">S</kbd>
              </Button>

              <div className="pt-2 border-t border-border mt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-between text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  <span className="flex items-center">
                    {isDeleting ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 mr-2" />
                    )}
                    Delete
                  </span>
                  <kbd className="hidden md:inline px-1.5 py-0.5 text-[10px] font-mono bg-muted rounded">D</kbd>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Keyboard Shortcuts Overlay */}
      {showShortcuts && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60"
          onClick={() => setShowShortcuts(false)}
        >
          <div
            className="bg-background border border-border rounded-lg shadow-2xl p-6 max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Keyboard className="h-5 w-5" />
                Keyboard Shortcuts
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setShowShortcuts(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Navigate photos</span>
                <div className="flex gap-1">
                  <kbd className="px-2 py-1 text-xs font-mono bg-muted rounded">{"\u2190"}</kbd>
                  <kbd className="px-2 py-1 text-xs font-mono bg-muted rounded">{"\u2192"}</kbd>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Approve photo</span>
                <kbd className="px-2 py-1 text-xs font-mono bg-muted rounded">A</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Reject photo</span>
                <kbd className="px-2 py-1 text-xs font-mono bg-muted rounded">R</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Retry processing</span>
                <kbd className="px-2 py-1 text-xs font-mono bg-muted rounded">T</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">AI auto-tag</span>
                <kbd className="px-2 py-1 text-xs font-mono bg-muted rounded">I</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Share photo</span>
                <kbd className="px-2 py-1 text-xs font-mono bg-muted rounded">S</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Delete photo</span>
                <kbd className="px-2 py-1 text-xs font-mono bg-muted rounded">D</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Close modal</span>
                <kbd className="px-2 py-1 text-xs font-mono bg-muted rounded">Esc</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Show shortcuts</span>
                <kbd className="px-2 py-1 text-xs font-mono bg-muted rounded">?</kbd>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      <CreateShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        photo={photo}
      />
    </div>
  );
}
