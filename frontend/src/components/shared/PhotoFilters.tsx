import { Search, X } from "lucide-react";
import { Input } from "../ui/input";
import { Select } from "../ui/select";
import { Button } from "../ui/button";
import type { SortOption } from "../../features/photos/hooks/usePhotoFilters";

interface PhotoFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  sortBy: SortOption;
  onSortChange: (value: SortOption) => void;
  hasActiveFilters: boolean;
  onClear: () => void;
  resultCount: number;
}

const sortOptions = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "status", label: "By status" },
];

export function PhotoFilters({
  search,
  onSearchChange,
  sortBy,
  onSortChange,
  hasActiveFilters,
  onClear,
  resultCount,
}: PhotoFiltersProps) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="relative flex-1 max-w-xs">
        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by filename..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-8"
        />
      </div>
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
