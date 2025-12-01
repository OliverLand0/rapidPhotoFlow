import { X } from "lucide-react";
import { SearchAutocomplete } from "./SearchAutocomplete";
import { Select } from "../ui/select";
import { Button } from "../ui/button";
import type { SortOption } from "../../features/photos/hooks/usePhotoFilters";

interface PhotoFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  sortBy: SortOption;
  onSortChange: (value: SortOption) => void;
  hasActiveFilters: boolean;
  onClear: () => void;
  resultCount: number;
  filenames?: string[];
  tags?: string[];
}

const sortOptions = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "status", label: "By status" },
];

export function PhotoFilters({
  search,
  onSearchChange,
  selectedTags,
  onTagsChange,
  sortBy,
  onSortChange,
  hasActiveFilters,
  onClear,
  resultCount,
  filenames = [],
  tags = [],
}: PhotoFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-4">
      <div className="flex items-center gap-2 flex-1">
        <SearchAutocomplete
          value={search}
          onChange={onSearchChange}
          selectedTags={selectedTags}
          onTagsChange={onTagsChange}
          filenames={filenames}
          tags={tags}
          placeholder="Search by filename or tag..."
          className="flex-1 sm:max-w-md"
        />
        <div className="w-28 sm:w-40 flex-shrink-0">
          <Select
            options={sortOptions}
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
          />
        </div>
      </div>
      <div className="flex items-center justify-between sm:justify-start gap-2">
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onClear}>
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
        <span className="text-sm text-muted-foreground">
          {resultCount} {resultCount === 1 ? "photo" : "photos"}
        </span>
      </div>
    </div>
  );
}
