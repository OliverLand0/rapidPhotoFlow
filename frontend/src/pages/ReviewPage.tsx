import { useState, useCallback, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { ImageOff, Search, X, Copy, Loader2 } from "lucide-react";
import { usePhotos } from "../lib/PhotosContext";
import { usePhotoFilters, type StatusFilter } from "../features/photos/hooks/usePhotoFilters";
import { usePhotoSelection } from "../features/photos/hooks/usePhotoSelection";
import { PhotoCard } from "../features/photos/components/PhotoCard";
import { EventLogPanel } from "../features/events/components/EventLogPanel";
import { EmptyState } from "../components/shared/EmptyState";
import { PhotoCardSkeleton } from "../components/shared/LoadingSkeleton";
import { PhotoFilters } from "../components/shared/PhotoFilters";
import { Pagination } from "../components/shared/Pagination";
import { BulkActionBar } from "../components/shared/BulkActionBar";
import { PhotoPreviewModal } from "../components/shared/PhotoPreviewModal";
import { Checkbox } from "../components/ui/checkbox";
import { Button } from "../components/ui/button";
import { useToast } from "../components/ui/toast";
import { cn } from "../lib/utils";
import { photoClient } from "../lib/api/client";
import type { Photo, BulkActionResponse } from "../lib/api/types";

type ReviewFilter = "PROCESSED" | "FAILED" | "APPROVED" | "REJECTED" | "ALL";

const tabs: { value: ReviewFilter; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "PROCESSED", label: "Ready to Review" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
  { value: "FAILED", label: "Failed" },
];

export function ReviewPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [statusFilter, setStatusFilter] = useState<ReviewFilter>("PROCESSED");
  const [previewPhoto, setPreviewPhoto] = useState<Photo | null>(null);
  const [isRemovingDuplicates, setIsRemovingDuplicates] = useState(false);
  const highlightedPhotoId = searchParams.get("photoId");
  const { toast } = useToast();

  const { photos, isLoading, setPhotos } = usePhotos();

  // Selection state
  const {
    selectedIds,
    isSelected,
    toggle,
    selectAll,
    clearSelection,
    isAllSelected,
  } = usePhotoSelection();

  // When a photoId is in the URL, switch to "All" tab to find it
  useEffect(() => {
    if (highlightedPhotoId) {
      setStatusFilter("ALL");
    }
  }, [highlightedPhotoId]);

  const clearHighlight = useCallback(() => {
    setSearchParams({});
  }, [setSearchParams]);

  // Pre-filter to only review-eligible photos before applying search/sort
  const reviewEligiblePhotos = photos.filter((p) =>
    ["PROCESSED", "FAILED", "APPROVED", "REJECTED"].includes(p.status)
  );

  const {
    search,
    setSearch,
    sortBy,
    setSortBy,
    filteredPhotos,
    totalFilteredCount,
    clearFilters,
    hasActiveFilters,
    currentPage,
    setCurrentPage,
    pageSize,
  } = usePhotoFilters(reviewEligiblePhotos, statusFilter as StatusFilter);

  const handlePhotoAction = useCallback(
    (updatedPhoto: Photo) => {
      setPhotos((prev) =>
        prev.map((p) => (p.id === updatedPhoto.id ? updatedPhoto : p))
      );
      // Also update preview if open
      if (previewPhoto?.id === updatedPhoto.id) {
        setPreviewPhoto(updatedPhoto);
      }
    },
    [setPhotos, previewPhoto]
  );

  const handlePhotoDelete = useCallback(
    (photoId: string) => {
      setPhotos((prev) => prev.filter((p) => p.id !== photoId));
    },
    [setPhotos]
  );

  const handleBulkActionComplete = useCallback(
    (response: BulkActionResponse) => {
      // Update photos with the new states from successful actions
      setPhotos((prev) =>
        prev.map((p) => {
          const updated = response.success.find((s) => s.id === p.id);
          return updated || p;
        })
      );
    },
    [setPhotos]
  );

  const handleSelectionChange = useCallback(
    (id: string) => {
      toggle(id);
    },
    [toggle]
  );

  const handleSelectAll = useCallback(() => {
    if (isAllSelected(filteredPhotos)) {
      clearSelection();
    } else {
      selectAll(filteredPhotos);
    }
  }, [filteredPhotos, isAllSelected, clearSelection, selectAll]);

  const handlePhotoClick = useCallback((photo: Photo) => {
    setPreviewPhoto(photo);
  }, []);

  const handleEventPhotoClick = useCallback(
    (photoId: string) => {
      const photo = photos.find((p) => p.id === photoId);
      if (photo) {
        setPreviewPhoto(photo);
      }
    },
    [photos]
  );

  const handlePreviewNavigate = useCallback((photo: Photo) => {
    setPreviewPhoto(photo);
  }, []);

  const handleRemoveDuplicates = useCallback(async () => {
    setIsRemovingDuplicates(true);
    try {
      const response = await photoClient.removeDuplicates();
      const removedCount = response.items.length;

      if (removedCount > 0) {
        // Remove the deleted photos from local state
        const removedIds = new Set(response.items.map((p) => p.id));
        setPhotos((prev) => prev.filter((p) => !removedIds.has(p.id)));

        toast({
          type: "success",
          title: `${removedCount} duplicate${removedCount !== 1 ? "s" : ""} removed`,
          description: "Duplicate photos have been cleaned up",
        });
      } else {
        toast({
          type: "info",
          title: "No duplicates found",
          description: "All photos are unique",
        });
      }
    } catch (error) {
      console.error("Failed to remove duplicates:", error);
      toast({
        type: "error",
        title: "Failed to remove duplicates",
        description: "An unexpected error occurred",
      });
    } finally {
      setIsRemovingDuplicates(false);
    }
  }, [setPhotos, toast]);

  return (
    <div className="h-full">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-2">Review Gallery</h1>
          <p className="text-muted-foreground">
            Review and approve processed photos
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleRemoveDuplicates}
          disabled={isRemovingDuplicates}
        >
          {isRemovingDuplicates ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Copy className="w-4 h-4 mr-2" />
          )}
          Remove Duplicates
        </Button>
      </div>

      {/* Highlighted Photo Banner */}
      {highlightedPhotoId && (
        <div className="mb-4 flex items-center justify-between bg-primary/10 border border-primary/20 rounded-lg px-4 py-2">
          <span className="text-sm">
            Viewing photo from event log
          </span>
          <Button size="sm" variant="ghost" onClick={clearHighlight}>
            <X className="w-4 h-4 mr-1" />
            Clear
          </Button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="border-b mb-4">
        <div className="flex gap-4 -mb-px">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={cn(
                "pb-3 px-1 text-sm font-medium border-b-2 transition-colors",
                statusFilter === tab.value
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search and Sort Filters */}
      <div className="flex items-center gap-4 mb-4">
        {filteredPhotos.length > 0 && (
          <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
            <Checkbox
              checked={isAllSelected(filteredPhotos)}
              onCheckedChange={handleSelectAll}
            />
            Select all
          </label>
        )}
        <div className="flex-1">
          <PhotoFilters
            search={search}
            onSearchChange={setSearch}
            sortBy={sortBy}
            onSortChange={setSortBy}
            hasActiveFilters={hasActiveFilters}
            onClear={clearFilters}
            resultCount={totalFilteredCount}
          />
        </div>
      </div>

      {/* Two-column layout */}
      <div className="flex gap-6 h-[calc(100vh-280px)]">
        {/* Photo Grid */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <PhotoCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredPhotos.length === 0 ? (
            <EmptyState
              icon={hasActiveFilters ? Search : ImageOff}
              title={hasActiveFilters ? "No matches found" : "No photos to review"}
              description={
                hasActiveFilters
                  ? "Try adjusting your search or filters"
                  : statusFilter === "PROCESSED"
                  ? "Photos will appear here once processing is complete"
                  : `No ${statusFilter.toLowerCase()} photos yet`
              }
            />
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPhotos.map((photo) => (
                  <PhotoCard
                    key={photo.id}
                    photo={photo}
                    onAction={handlePhotoAction}
                    onClick={handlePhotoClick}
                    selectable
                    selected={isSelected(photo.id)}
                    onSelectionChange={handleSelectionChange}
                    highlighted={photo.id === highlightedPhotoId}
                  />
                ))}
              </div>
              <Pagination
                currentPage={currentPage}
                totalItems={totalFilteredCount}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
              />
            </>
          )}
        </div>

        {/* Event Log Panel */}
        <div className="w-80 border-l bg-muted/30 hidden lg:block overflow-hidden">
          <EventLogPanel onPhotoClick={handleEventPhotoClick} />
        </div>
      </div>

      {/* Bulk Action Bar */}
      <BulkActionBar
        selectedIds={selectedIds}
        selectedPhotos={filteredPhotos.filter((p) => selectedIds.has(p.id))}
        onClearSelection={clearSelection}
        onActionComplete={handleBulkActionComplete}
      />

      {/* Photo Preview Modal */}
      {previewPhoto && (
        <PhotoPreviewModal
          photo={previewPhoto}
          photos={filteredPhotos}
          onClose={() => setPreviewPhoto(null)}
          onPhotoUpdate={handlePhotoAction}
          onPhotoDelete={handlePhotoDelete}
          onNavigate={handlePreviewNavigate}
        />
      )}
    </div>
  );
}
