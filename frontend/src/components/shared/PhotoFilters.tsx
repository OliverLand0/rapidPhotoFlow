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
    <div className="flex items-center gap-3 mb-4">
      <SearchAutocomplete
        value={search}
        onChange={onSearchChange}
        selectedTags={selectedTags}
        onTagsChange={onTagsChange}
        filenames={filenames}
        tags={tags}
        placeholder="Search by filename or tag..."
        className="flex-1 max-w-md"
      />
      <div className="w-40">
        <Select
          options={sortOptions}
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value as SortOption)}
        />
      </div>
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={onClear}>
          <X className="h-4 w-4 mr-1" />
          Clear
        </Button>
      )}
      <span className="text-sm text-muted-foreground ml-auto">
        {resultCount} {resultCount === 1 ? "photo" : "photos"}
      </span>
    </div>
  );
}
