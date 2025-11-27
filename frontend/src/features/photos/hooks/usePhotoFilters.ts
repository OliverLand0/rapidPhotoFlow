import { useState, useMemo, useCallback, useEffect } from "react";
import type { Photo, PhotoStatus } from "../../../lib/api/types";

export type SortOption = "newest" | "oldest" | "status";
export type StatusFilter = PhotoStatus | "ALL";

interface UsePhotoFiltersOptions {
  initialSort?: SortOption;
  pageSize?: number;
}

const statusOrder: Record<PhotoStatus, number> = {
  PENDING: 0,
  PROCESSING: 1,
  PROCESSED: 2,
  FAILED: 3,
  APPROVED: 4,
  REJECTED: 5,
};

export function usePhotoFilters(
  photos: Photo[],
  statusFilter: StatusFilter,
  options: UsePhotoFiltersOptions = {}
) {
  const { initialSort = "newest", pageSize = 12 } = options;

  const [search, setSearch] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>(initialSort);
  const [currentPage, setCurrentPage] = useState(0);

  const filteredAndSortedPhotos = useMemo(() => {
    let result = [...photos];

    // Apply status filter
    if (statusFilter !== "ALL") {
      result = result.filter((p) => p.status === statusFilter);
    }

    // Apply selected tags filter (photo must have ALL selected tags)
    if (selectedTags.length > 0) {
      result = result.filter((p) =>
        selectedTags.every((tag) => p.tags?.includes(tag))
      );
    }

    // Apply search filter (searches filename and tags)
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      result = result.filter((p) => {
        const matchesFilename = p.filename.toLowerCase().includes(searchLower);
        const matchesTags = p.tags?.some(tag => tag.toLowerCase().includes(searchLower));
        return matchesFilename || matchesTags;
      });
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
        case "oldest":
          return new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
        case "status":
          return statusOrder[a.status] - statusOrder[b.status];
        default:
          return 0;
      }
    });

    return result;
  }, [photos, statusFilter, selectedTags, search, sortBy]);

  // Paginate the filtered results
  const paginatedPhotos = useMemo(() => {
    const start = currentPage * pageSize;
    return filteredAndSortedPhotos.slice(start, start + pageSize);
  }, [filteredAndSortedPhotos, currentPage, pageSize]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(0);
  }, [search, selectedTags, sortBy, statusFilter]);

  const clearFilters = useCallback(() => {
    setSearch("");
    setSelectedTags([]);
    setSortBy("newest");
    setCurrentPage(0);
  }, []);

  const hasActiveFilters = search.trim() !== "" || selectedTags.length > 0 || sortBy !== "newest";

  return {
    search,
    setSearch,
    selectedTags,
    setSelectedTags,
    sortBy,
    setSortBy,
    filteredPhotos: paginatedPhotos,
    totalFilteredCount: filteredAndSortedPhotos.length,
    clearFilters,
    hasActiveFilters,
    currentPage,
    setCurrentPage,
    pageSize,
  };
}
