import { useState, useCallback, useMemo } from "react";
import type { Photo } from "@/lib/api/types";

interface UsePhotoSelectionReturn {
  selectedIds: Set<string>;
  isSelected: (id: string) => boolean;
  toggle: (id: string) => void;
  selectAll: (photos: Photo[]) => void;
  clearSelection: () => void;
  selectedCount: number;
  isAllSelected: (photos: Photo[]) => boolean;
  isSomeSelected: (photos: Photo[]) => boolean;
}

export function usePhotoSelection(): UsePhotoSelectionReturn {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const isSelected = useCallback(
    (id: string) => selectedIds.has(id),
    [selectedIds]
  );

  const toggle = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback((photos: Photo[]) => {
    setSelectedIds(new Set(photos.map((p) => p.id)));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const selectedCount = selectedIds.size;

  const isAllSelected = useCallback(
    (photos: Photo[]) => photos.length > 0 && photos.every((p) => selectedIds.has(p.id)),
    [selectedIds]
  );

  const isSomeSelected = useCallback(
    (photos: Photo[]) => photos.some((p) => selectedIds.has(p.id)) && !isAllSelected(photos),
    [selectedIds, isAllSelected]
  );

  return useMemo(
    () => ({
      selectedIds,
      isSelected,
      toggle,
      selectAll,
      clearSelection,
      selectedCount,
      isAllSelected,
      isSomeSelected,
    }),
    [selectedIds, isSelected, toggle, selectAll, clearSelection, selectedCount, isAllSelected, isSomeSelected]
  );
}
