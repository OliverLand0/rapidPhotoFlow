import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { ImageOff, Search, X, Copy, Loader2, Keyboard } from "lucide-react";
import { usePhotos } from "../lib/PhotosContext";
import { usePhotoFilters, type StatusFilter } from "../features/photos/hooks/usePhotoFilters";
import { usePhotoSelection } from "../features/photos/hooks/usePhotoSelection";
import { usePhotoActions } from "../features/photos/hooks/usePhotoActions";
import { useKeyboardShortcuts } from "../features/photos/hooks/useKeyboardShortcuts";
import { useSavedViews } from "../features/photos/hooks/useSavedViews";
import { PhotoCard } from "../features/photos/components/PhotoCard";
import { EventLogPanel } from "../features/events/components/EventLogPanel";
import { EmptyState } from "../components/shared/EmptyState";
import { PhotoCardSkeleton } from "../components/shared/LoadingSkeleton";
import { PhotoFilters } from "../components/shared/PhotoFilters";
import { Pagination } from "../components/shared/Pagination";
import { BulkActionBar } from "../components/shared/BulkActionBar";
import { PhotoPreviewModal } from "../components/shared/PhotoPreviewModal";
import { KeyboardShortcutsModal } from "../components/shared/KeyboardShortcutsModal";
import { SavedViewsDropdown } from "../components/shared/SavedViewsDropdown";
import { Checkbox } from "../components/ui/checkbox";
import { Button } from "../components/ui/button";
import { useToast } from "../components/ui/toast";
import { cn } from "../lib/utils";
import { photoClient } from "../lib/api/client";
import type { Photo, BulkActionResponse, ActionType, SavedView } from "../lib/api/types";

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

  // Get initial status from URL or default to PROCESSED
  const urlStatus = searchParams.get("status") as ReviewFilter | null;
  const validStatuses: ReviewFilter[] = ["PROCESSED", "FAILED", "APPROVED", "REJECTED", "ALL"];
  const initialStatus = urlStatus && validStatuses.includes(urlStatus) ? urlStatus : "PROCESSED";

  const [statusFilter, setStatusFilter] = useState<ReviewFilter>(initialStatus);
  const [previewPhoto, setPreviewPhoto] = useState<Photo | null>(null);
  const [isRemovingDuplicates, setIsRemovingDuplicates] = useState(false);
  const [focusedPhotoId, setFocusedPhotoId] = useState<string | null>(null);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const highlightedPhotoId = searchParams.get("photoId");
  const { toast } = useToast();
  const photoGridRef = useRef<HTMLDivElement>(null);

  // Sync URL status param with state when URL changes
  useEffect(() => {
    const newStatus = searchParams.get("status") as ReviewFilter | null;
    if (newStatus && validStatuses.includes(newStatus) && newStatus !== statusFilter) {
      setStatusFilter(newStatus);
    }
  }, [searchParams]);

  const { photos, isLoading, setPhotos } = usePhotos();
  const { approve, reject, retry } = usePhotoActions();
  const { views, presetViews, userViews, createView, deleteView } = useSavedViews();

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

  // Extract unique filenames and tags for autocomplete
  const allFilenames = useMemo(
    () => reviewEligiblePhotos.map((p) => p.filename),
    [reviewEligiblePhotos]
  );

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    reviewEligiblePhotos.forEach((p) => {
      p.tags?.forEach((tag) => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [reviewEligiblePhotos]);

  const {
    search,
    setSearch,
    selectedTags,
    setSelectedTags,
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

  // Saved views handlers
  const handleSelectView = useCallback(
    (view: SavedView) => {
      setStatusFilter(view.filters.status as ReviewFilter);
      setSearch(view.filters.search);
      setSortBy(view.filters.sort);
      setCurrentPage(1);
      toast({
        type: "info",
        title: `Applied view: ${view.name}`,
      });
    },
    [setSearch, setSortBy, setCurrentPage, toast]
  );

  const handleCreateView = useCallback(
    (name: string) => {
      createView(name, {
        search,
        status: statusFilter as StatusFilter,
        sort: sortBy,
      });
      toast({
        type: "success",
        title: `Saved view: ${name}`,
      });
    },
    [createView, search, statusFilter, sortBy, toast]
  );

  const handleDeleteView = useCallback(
    (id: string) => {
      deleteView(id);
      toast({
        type: "info",
        title: "View deleted",
      });
    },
    [deleteView, toast]
  );

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
        // Switch to ALL tab to ensure photo is visible
        setStatusFilter("ALL");
        // Clear any search filters that might hide the photo
        setSearch("");
        // Set focus for keyboard navigation
        setFocusedPhotoId(photoId);
        // Set URL param for highlight styling (triggers scroll in useEffect)
        setSearchParams({ photoId });
        // Open the preview modal
        setPreviewPhoto(photo);
        // Clear highlight after 3 seconds
        setTimeout(() => {
          setSearchParams({});
        }, 3000);
      }
    },
    [photos, setSearchParams, setSearch]
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

  // Keyboard shortcut action handler (single photo)
  const handleKeyboardAction = useCallback(
    async (photoId: string, action: ActionType) => {
      const actionFn = action === "approve" ? approve : action === "reject" ? reject : retry;
      try {
        const updated = await actionFn(photoId);
        if (updated) {
          handlePhotoAction(updated);
          toast({
            type: "success",
            title: `Photo ${action}${action === "retry" ? " requested" : action === "approve" ? "d" : "ed"}`,
          });
        }
      } catch (error) {
        toast({
          type: "error",
          title: `Failed to ${action} photo`,
        });
      }
    },
    [approve, reject, retry, handlePhotoAction, toast]
  );

  // Keyboard shortcut bulk action handler
  const handleKeyboardBulkAction = useCallback(
    async (photoIds: string[], action: ActionType) => {
      try {
        const response = await photoClient.performBulkAction(photoIds, action);
        // Update photos with the new states from successful actions
        setPhotos((prev) =>
          prev.map((p) => {
            const updated = response.success.find((s) => s.id === p.id);
            return updated || p;
          })
        );
        clearSelection();

        const actionVerb = action === "retry" ? "retried" : action === "approve" ? "approved" : "rejected";
        if (response.errorCount > 0) {
          toast({
            type: "warning",
            title: `${response.successCount} ${actionVerb}, ${response.errorCount} failed`,
          });
        } else {
          toast({
            type: "success",
            title: `${response.successCount} photo${response.successCount !== 1 ? "s" : ""} ${actionVerb}`,
          });
        }
      } catch (error) {
        toast({
          type: "error",
          title: `Failed to ${action} photos`,
        });
      }
    },
    [setPhotos, clearSelection, toast]
  );

  // Keyboard shortcuts hook
  useKeyboardShortcuts({
    photos: filteredPhotos,
    focusedPhotoId,
    setFocusedPhotoId,
    selectedIds,
    toggleSelection: toggle,
    selectAll,
    clearSelection,
    onAction: handleKeyboardAction,
    onBulkAction: handleKeyboardBulkAction,
    onPreview: handlePhotoClick,
    onClosePreview: () => setPreviewPhoto(null),
    isPreviewOpen: previewPhoto !== null,
    showHelp: () => setShowShortcutsModal(true),
  });

  // Scroll focused or highlighted photo into view
  useEffect(() => {
    const targetId = focusedPhotoId || highlightedPhotoId;
    if (targetId && photoGridRef.current) {
      // Delay to ensure the photo is rendered after filter changes
      const timeoutId = setTimeout(() => {
        const photoElement = photoGridRef.current?.querySelector(
          `[data-photo-id="${targetId}"]`
        );
        if (photoElement) {
          photoElement.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 200);
      return () => clearTimeout(timeoutId);
    }
  }, [focusedPhotoId, highlightedPhotoId, filteredPhotos]);

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
            selectedTags={selectedTags}
            onTagsChange={setSelectedTags}
            sortBy={sortBy}
            onSortChange={setSortBy}
            hasActiveFilters={hasActiveFilters}
            onClear={clearFilters}
            resultCount={totalFilteredCount}
            filenames={allFilenames}
            tags={allTags}
          />
        </div>
        <SavedViewsDropdown
          views={views}
          presetViews={presetViews}
          userViews={userViews}
          currentFilters={{
            search,
            status: statusFilter as StatusFilter,
            sort: sortBy,
          }}
          onSelectView={handleSelectView}
          onCreateView={handleCreateView}
          onDeleteView={handleDeleteView}
        />
        <button
          onClick={() => setShowShortcutsModal(true)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <Keyboard className="w-4 h-4" />
          <span className="hidden sm:inline">Shortcuts</span>
          <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">?</kbd>
        </button>
      </div>

      {/* Two-column layout */}
      <div className="flex gap-6 h-[calc(100vh-280px)]">
        {/* Photo Grid */}
        <div className="flex-1 overflow-y-auto" ref={photoGridRef}>
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
                    focused={photo.id === focusedPhotoId}
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

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal
        isOpen={showShortcutsModal}
        onClose={() => setShowShortcutsModal(false)}
      />
    </div>
  );
}
