import { useState } from "react";
import { X, Check, XCircle, RefreshCw, Trash2, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { Button } from "../ui/button";
import { StatusBadge } from "./StatusBadge";
import { TagEditor } from "./TagEditor";
import { useToast } from "../ui/toast";
import { photoClient, aiClient } from "../../lib/api/client";
import { formatFileSize, formatRelativeTime } from "../../lib/utils";
import type { Photo } from "../../lib/api/types";

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
  const { toast } = useToast();

  const canApprove = photo.status === "PROCESSED" || photo.status === "REJECTED";
  const canReject = photo.status === "PROCESSED" || photo.status === "FAILED" || photo.status === "APPROVED";
  const canRetry = photo.status === "FAILED";

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

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    } else if (e.key === "ArrowLeft") {
      handlePrev();
    } else if (e.key === "ArrowRight") {
      handleNext();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 flex max-h-[90vh] max-w-[90vw] flex-col bg-background border border-border rounded-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/50">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-medium truncate max-w-[300px]">{photo.filename}</h2>
            <StatusBadge status={photo.status} />
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Image */}
          <div className="relative flex-1 flex items-center justify-center bg-black min-h-[400px] min-w-[500px]">
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
              className="max-h-[70vh] max-w-full object-contain"
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
          <div className="w-64 border-l border-border bg-background flex flex-col">
            {/* Photo details */}
            <div className="p-4 space-y-3 flex-1">
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
            <div className="p-4 border-t border-border space-y-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Actions</p>

              {canApprove && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-green-600 dark:text-green-500 hover:text-green-700 dark:hover:text-green-400 hover:bg-green-500/10"
                  onClick={() => handleAction("approve")}
                  disabled={isLoading !== null}
                >
                  {isLoading === "approve" ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4 mr-2" />
                  )}
                  Approve
                </Button>
              )}

              {canReject && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-red-600 dark:text-red-500 hover:text-red-700 dark:hover:text-red-400 hover:bg-red-500/10"
                  onClick={() => handleAction("reject")}
                  disabled={isLoading !== null}
                >
                  {isLoading === "reject" ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <XCircle className="h-4 w-4 mr-2" />
                  )}
                  Reject
                </Button>
              )}

              {canRetry && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => handleAction("retry")}
                  disabled={isLoading !== null}
                >
                  {isLoading === "retry" ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Retry Processing
                </Button>
              )}

              <div className="pt-2 border-t border-border mt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  Delete Photo
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
