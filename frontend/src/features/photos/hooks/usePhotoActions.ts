import { useState, useCallback } from "react";
import { photoClient } from "../../../lib/api/client";
import type { Photo, ActionType } from "../../../lib/api/types";

export function usePhotoActions() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const performAction = useCallback(
    async (
      photoId: string,
      action: ActionType,
      onSuccess?: (photo: Photo) => void
    ) => {
      setIsLoading(true);
      setError(null);

      try {
        const photo = await photoClient.performAction(photoId, action);
        onSuccess?.(photo);
        return photo;
      } catch (err) {
        setError(err as Error);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const approve = useCallback(
    (photoId: string, onSuccess?: (photo: Photo) => void) =>
      performAction(photoId, "approve", onSuccess),
    [performAction]
  );

  const reject = useCallback(
    (photoId: string, onSuccess?: (photo: Photo) => void) =>
      performAction(photoId, "reject", onSuccess),
    [performAction]
  );

  const retry = useCallback(
    (photoId: string, onSuccess?: (photo: Photo) => void) =>
      performAction(photoId, "retry", onSuccess),
    [performAction]
  );

  return {
    approve,
    reject,
    retry,
    isLoading,
    error,
  };
}
