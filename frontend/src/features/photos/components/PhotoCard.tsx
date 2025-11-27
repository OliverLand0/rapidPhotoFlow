import { useState } from "react";
import { Check, X, RefreshCw } from "lucide-react";
import { Card } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Checkbox } from "../../../components/ui/checkbox";
import { useToast } from "../../../components/ui/toast";
import { StatusBadge } from "../../../components/shared/StatusBadge";
import { TagEditor } from "../../../components/shared/TagEditor";
import { photoClient } from "../../../lib/api/client";
import { cn } from "../../../lib/utils";
import type { Photo } from "../../../lib/api/types";

interface PhotoCardProps {
  photo: Photo;
  onAction?: (photo: Photo) => void;
  onClick?: (photo: Photo) => void;
  selectable?: boolean;
  selected?: boolean;
  onSelectionChange?: (id: string) => void;
  highlighted?: boolean;
  focused?: boolean;
}

const actionMessages: Record<string, { success: string; error: string }> = {
  approve: { success: "Photo approved", error: "Failed to approve photo" },
  reject: { success: "Photo rejected", error: "Failed to reject photo" },
  retry: { success: "Retry requested", error: "Failed to retry processing" },
};

export function PhotoCard({
  photo,
  onAction,
  onClick,
  selectable = false,
  selected = false,
  onSelectionChange,
  highlighted = false,
  focused = false,
}: PhotoCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const canApprove = photo.status === "PROCESSED" || photo.status === "REJECTED";
  const canReject = photo.status === "PROCESSED" || photo.status === "FAILED" || photo.status === "APPROVED";
  const canRetry = photo.status === "FAILED";

  const handleAction = async (action: "approve" | "reject" | "retry") => {
    setIsLoading(true);
    try {
      const updated = await photoClient.performAction(photo.id, action);
      onAction?.(updated);
      toast({
        type: "success",
        title: actionMessages[action].success,
      });
    } catch (error) {
      console.error(`Failed to ${action}:`, error);
      toast({
        type: "error",
        title: actionMessages[action].error,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCardClick = () => {
    onClick?.(photo);
  };

  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all",
        highlighted && "ring-2 ring-primary ring-offset-2 animate-highlight-pulse",
        focused && !highlighted && "ring-2 ring-blue-500 ring-offset-2",
        onClick && "cursor-pointer"
      )}
      data-photo-id={photo.id}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
    >
      <div className="aspect-square bg-muted relative">
        <img
          src={photoClient.getPhotoContentUrl(photo.id)}
          alt={photo.filename}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback for demo placeholder images
            (e.target as HTMLImageElement).src =
              "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Crect fill='%23f1f5f9' width='200' height='200'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%2394a3b8' font-family='system-ui' font-size='14'%3EPhoto%3C/text%3E%3C/svg%3E";
          }}
        />

        {/* Selection checkbox */}
        {selectable && (
          <div
            className={`absolute top-2 left-2 transition-opacity ${
              selected || isHovered ? "opacity-100" : "opacity-0"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <Checkbox
              checked={selected}
              onCheckedChange={() => onSelectionChange?.(photo.id)}
            />
          </div>
        )}

        {/* Status badge overlay */}
        <div className="absolute top-2 right-2">
          <StatusBadge status={photo.status} />
        </div>

        {/* Actions overlay */}
        {(canApprove || canReject || canRetry) && (
          <div
            className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4 transition-opacity ${
              isHovered ? "opacity-100" : "opacity-0"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex gap-2 justify-center">
              {canApprove && (
                <Button
                  size="sm"
                  onClick={() => handleAction("approve")}
                  disabled={isLoading}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Approve
                </Button>
              )}
              {canReject && (
                <Button
                  size="sm"
                  onClick={() => handleAction("reject")}
                  disabled={isLoading}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <X className="h-4 w-4 mr-1" />
                  Reject
                </Button>
              )}
              {canRetry && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-white hover:bg-white/20"
                  onClick={() => handleAction("retry")}
                  disabled={isLoading}
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Retry
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="p-3">
        <p className="text-sm font-medium truncate">{photo.filename}</p>
        {photo.failureReason && (
          <p className="text-xs text-destructive mt-1 truncate">
            {photo.failureReason}
          </p>
        )}
        {photo.tags && photo.tags.length > 0 && (
          <div className="mt-2">
            <TagEditor photo={photo} compact />
          </div>
        )}
      </div>
    </Card>
  );
}
