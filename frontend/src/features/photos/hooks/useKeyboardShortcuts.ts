import { useEffect, useCallback, useRef } from "react";
import type { Photo, ActionType } from "../../../lib/api/types";

interface KeyboardShortcutsConfig {
  photos: Photo[];
  focusedPhotoId: string | null;
  setFocusedPhotoId: (id: string | null) => void;
  selectedIds: Set<string>;
  toggleSelection: (id: string) => void;
  selectAll: (photos: Photo[]) => void;
  clearSelection: () => void;
  onAction: (photoId: string, action: ActionType) => void;
  onBulkAction: (photoIds: string[], action: ActionType) => void;
  onPreview: (photo: Photo) => void;
  onClosePreview: () => void;
  isPreviewOpen: boolean;
  showHelp: () => void;
  enabled?: boolean;
}

// Helper to check if an action can be performed on a photo
function canPerformAction(photo: Photo, action: ActionType): boolean {
  switch (action) {
    case "approve":
      // Can approve: PROCESSED, REJECTED, or even re-approve APPROVED
      return ["PROCESSED", "REJECTED", "APPROVED"].includes(photo.status);
    case "reject":
      // Can reject: PROCESSED, FAILED, APPROVED, or even re-reject REJECTED
      return ["PROCESSED", "FAILED", "APPROVED", "REJECTED"].includes(photo.status);
    case "retry":
      // Can only retry: FAILED
      return photo.status === "FAILED";
    default:
      return false;
  }
}

export function useKeyboardShortcuts({
  photos,
  focusedPhotoId,
  setFocusedPhotoId,
  selectedIds,
  toggleSelection,
  selectAll,
  clearSelection,
  onAction,
  onBulkAction,
  onPreview,
  onClosePreview,
  isPreviewOpen,
  showHelp,
  enabled = true,
}: KeyboardShortcutsConfig) {
  const shiftKeyRef = useRef(false);

  const getFocusedPhoto = useCallback(() => {
    if (!focusedPhotoId) return null;
    return photos.find((p) => p.id === focusedPhotoId) ?? null;
  }, [photos, focusedPhotoId]);

  const getFocusedIndex = useCallback(() => {
    if (!focusedPhotoId) return -1;
    return photos.findIndex((p) => p.id === focusedPhotoId);
  }, [photos, focusedPhotoId]);

  const moveFocus = useCallback(
    (direction: "up" | "down") => {
      if (photos.length === 0) return;

      const currentIndex = getFocusedIndex();
      let newIndex: number;

      if (currentIndex === -1) {
        // No focus yet, start from beginning or end
        newIndex = direction === "down" ? 0 : photos.length - 1;
      } else {
        // Move in direction
        newIndex =
          direction === "down"
            ? Math.min(currentIndex + 1, photos.length - 1)
            : Math.max(currentIndex - 1, 0);
      }

      const newPhoto = photos[newIndex];
      if (newPhoto) {
        setFocusedPhotoId(newPhoto.id);

        // If shift is held, extend selection
        if (shiftKeyRef.current) {
          toggleSelection(newPhoto.id);
        }
      }
    },
    [photos, getFocusedIndex, setFocusedPhotoId, toggleSelection]
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Track shift key
      if (event.key === "Shift") {
        shiftKeyRef.current = true;
      }

      // Don't trigger shortcuts if user is typing in an input
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      const focusedPhoto = getFocusedPhoto();

      switch (event.key) {
        case "?":
          event.preventDefault();
          showHelp();
          break;

        case "ArrowUp":
          event.preventDefault();
          if (!isPreviewOpen) {
            moveFocus("up");
          }
          break;

        case "ArrowDown":
          event.preventDefault();
          if (!isPreviewOpen) {
            moveFocus("down");
          }
          break;

        case "Enter":
          event.preventDefault();
          if (focusedPhoto && !isPreviewOpen) {
            onPreview(focusedPhoto);
          }
          break;

        case "Escape":
          event.preventDefault();
          if (isPreviewOpen) {
            onClosePreview();
          } else if (focusedPhotoId) {
            setFocusedPhotoId(null);
          } else if (selectedIds.size > 0) {
            clearSelection();
          }
          break;

        case " ": // Space
          event.preventDefault();
          if (focusedPhoto && !isPreviewOpen) {
            toggleSelection(focusedPhoto.id);
          }
          break;

        case "a":
        case "A":
          if ((event.metaKey || event.ctrlKey) && !isPreviewOpen) {
            // Cmd/Ctrl + A: Select all
            event.preventDefault();
            selectAll(photos);
          } else if (!event.metaKey && !event.ctrlKey && !isPreviewOpen) {
            // Just 'A': Approve photo(s)
            event.preventDefault();
            if (selectedIds.size > 0) {
              // Bulk approve selected photos
              const eligibleIds = photos
                .filter((p) => selectedIds.has(p.id) && canPerformAction(p, "approve"))
                .map((p) => p.id);
              if (eligibleIds.length > 0) {
                onBulkAction(eligibleIds, "approve");
              }
            } else if (focusedPhoto && canPerformAction(focusedPhoto, "approve")) {
              // Single photo approve
              onAction(focusedPhoto.id, "approve");
            }
          }
          break;

        case "r":
        case "R":
          if (!event.metaKey && !event.ctrlKey && !isPreviewOpen) {
            event.preventDefault();
            if (selectedIds.size > 0) {
              // Bulk reject selected photos
              const eligibleIds = photos
                .filter((p) => selectedIds.has(p.id) && canPerformAction(p, "reject"))
                .map((p) => p.id);
              if (eligibleIds.length > 0) {
                onBulkAction(eligibleIds, "reject");
              }
            } else if (focusedPhoto && canPerformAction(focusedPhoto, "reject")) {
              // Single photo reject
              onAction(focusedPhoto.id, "reject");
            }
          }
          break;

        case "t":
        case "T":
          if (!event.metaKey && !event.ctrlKey && !isPreviewOpen) {
            event.preventDefault();
            if (selectedIds.size > 0) {
              // Bulk retry selected photos
              const eligibleIds = photos
                .filter((p) => selectedIds.has(p.id) && canPerformAction(p, "retry"))
                .map((p) => p.id);
              if (eligibleIds.length > 0) {
                onBulkAction(eligibleIds, "retry");
              }
            } else if (focusedPhoto && canPerformAction(focusedPhoto, "retry")) {
              // Single photo retry
              onAction(focusedPhoto.id, "retry");
            }
          }
          break;
      }
    },
    [
      enabled,
      getFocusedPhoto,
      focusedPhotoId,
      isPreviewOpen,
      moveFocus,
      onPreview,
      onClosePreview,
      setFocusedPhotoId,
      selectedIds,
      clearSelection,
      toggleSelection,
      selectAll,
      photos,
      onAction,
      onBulkAction,
      showHelp,
    ]
  );

  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    if (event.key === "Shift") {
      shiftKeyRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [enabled, handleKeyDown, handleKeyUp]);

  return {
    focusedPhoto: getFocusedPhoto(),
  };
}
