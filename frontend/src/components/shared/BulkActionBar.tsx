import { useState } from "react";
import { CheckCircle, XCircle, RefreshCw, X, Trash2 } from "lucide-react";
import { Button } from "../ui/button";
import { useToast } from "../ui/toast";
import { photoClient } from "../../lib/api/client";
import type { ActionType, BulkActionResponse, Photo } from "../../lib/api/types";

interface BulkActionBarProps {
  selectedIds: Set<string>;
  selectedPhotos: Photo[];
  onClearSelection: () => void;
  onActionComplete: (response: BulkActionResponse) => void;
}

type BulkAction = ActionType | "delete";

const actionLabels: Record<BulkAction, string> = {
  approve: "approved",
  reject: "rejected",
  retry: "retried",
  delete: "deleted",
};

export function BulkActionBar({
  selectedIds,
  selectedPhotos,
  onClearSelection,
  onActionComplete,
}: BulkActionBarProps) {
  const [isLoading, setIsLoading] = useState<BulkAction | null>(null);
  const { toast } = useToast();
  const count = selectedIds.size;

  // Check if any selected photos are failed (retry only makes sense for failed photos)
  const hasFailedPhotos = selectedPhotos.some((photo) => photo.status === "FAILED");

  if (count === 0) return null;

  const handleAction = async (action: BulkAction) => {
    setIsLoading(action);
    try {
      const ids = Array.from(selectedIds);
      const response = action === "delete"
        ? await photoClient.bulkDelete(ids)
        : await photoClient.performBulkAction(ids, action);
      onActionComplete(response);
      onClearSelection();

      const successCount = response.success.length;
      const failCount = response.errors.length;

      if (successCount > 0 && failCount === 0) {
        toast({
          type: "success",
          title: `${successCount} photo${successCount !== 1 ? "s" : ""} ${actionLabels[action]}`,
        });
      } else if (successCount > 0 && failCount > 0) {
        toast({
          type: "warning",
          title: `${successCount} ${actionLabels[action]}, ${failCount} failed`,
          description: "Some photos could not be processed",
        });
      } else if (failCount > 0) {
        toast({
          type: "error",
          title: `Failed to ${action} photos`,
          description: `${failCount} photo${failCount !== 1 ? "s" : ""} could not be processed`,
        });
      }
    } catch (error) {
      console.error(`Bulk ${action} failed:`, error);
      toast({
        type: "error",
        title: `Bulk ${action} failed`,
        description: "An unexpected error occurred",
      });
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className="bg-zinc-900 border border-zinc-700 rounded-lg shadow-lg px-4 py-3 flex items-center gap-4">
        <span className="text-sm font-medium">
          {count} photo{count !== 1 ? "s" : ""} selected
        </span>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => handleAction("approve")}
            disabled={isLoading !== null}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {isLoading === "approve" ? (
              <RefreshCw className="w-4 h-4 mr-1.5 animate-spin" />
            ) : (
              <CheckCircle className="w-4 h-4 mr-1.5" />
            )}
            Approve All
          </Button>

          <Button
            size="sm"
            onClick={() => handleAction("reject")}
            disabled={isLoading !== null}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isLoading === "reject" ? (
              <RefreshCw className="w-4 h-4 mr-1.5 animate-spin" />
            ) : (
              <XCircle className="w-4 h-4 mr-1.5" />
            )}
            Reject All
          </Button>

          {hasFailedPhotos && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleAction("retry")}
              disabled={isLoading !== null}
            >
              {isLoading === "retry" ? (
                <RefreshCw className="w-4 h-4 mr-1.5 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-1.5" />
              )}
              Retry All
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={() => handleAction("delete")}
            disabled={isLoading !== null}
            className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
          >
            {isLoading === "delete" ? (
              <RefreshCw className="w-4 h-4 mr-1.5 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4 mr-1.5" />
            )}
            Delete All
          </Button>
        </div>

        <Button
          size="sm"
          variant="ghost"
          onClick={onClearSelection}
          disabled={isLoading !== null}
          className="ml-2"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
