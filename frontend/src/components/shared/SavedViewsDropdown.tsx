import { useState, useRef, useEffect } from "react";
import { Bookmark, ChevronDown, Plus, Trash2, Check } from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";
import type { SavedView } from "../../lib/api/types";
import type { StatusFilter, SortOption } from "../../features/photos/hooks/usePhotoFilters";

interface SavedViewsDropdownProps {
  views: SavedView[];
  presetViews: SavedView[];
  userViews: SavedView[];
  currentFilters: {
    search: string;
    status: StatusFilter;
    sort: SortOption;
    tag?: string | null;
  };
  onSelectView: (view: SavedView) => void;
  onCreateView: (name: string) => void;
  onDeleteView: (id: string) => void;
}

export function SavedViewsDropdown({
  views,
  presetViews,
  userViews,
  currentFilters,
  onSelectView,
  onCreateView,
  onDeleteView,
}: SavedViewsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newViewName, setNewViewName] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsCreating(false);
        setNewViewName("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus input when creating
  useEffect(() => {
    if (isCreating && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isCreating]);

  const handleCreateView = () => {
    if (newViewName.trim()) {
      onCreateView(newViewName.trim());
      setNewViewName("");
      setIsCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleCreateView();
    } else if (e.key === "Escape") {
      setIsCreating(false);
      setNewViewName("");
    }
  };

  // Check if current filters match a saved view
  const activeView = views.find(
    (v) =>
      v.filters.status === currentFilters.status &&
      v.filters.sort === currentFilters.sort &&
      v.filters.search === currentFilters.search
  );

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="gap-2"
      >
        <Bookmark className="w-4 h-4" />
        <span className="hidden sm:inline">
          {activeView ? activeView.name : "Views"}
        </span>
        <ChevronDown className={cn("w-4 h-4 transition-transform", isOpen && "rotate-180")} />
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-64 bg-background border rounded-lg shadow-lg z-50 overflow-hidden">
          {/* Preset Views */}
          {presetViews.length > 0 && (
            <div className="p-2 border-b">
              <p className="text-xs font-medium text-muted-foreground px-2 mb-1">
                Quick Views
              </p>
              {presetViews.map((view) => (
                <button
                  key={view.id}
                  onClick={() => {
                    onSelectView(view);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-2 py-1.5 text-sm rounded hover:bg-muted transition-colors text-left",
                    activeView?.id === view.id && "bg-muted"
                  )}
                >
                  <span>{view.name}</span>
                  {activeView?.id === view.id && (
                    <Check className="w-3.5 h-3.5 text-primary" />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* User Views */}
          {userViews.length > 0 && (
            <div className="p-2 border-b">
              <p className="text-xs font-medium text-muted-foreground px-2 mb-1">
                My Views
              </p>
              {userViews.map((view) => (
                <div
                  key={view.id}
                  className={cn(
                    "group flex items-center justify-between px-2 py-1.5 rounded hover:bg-muted transition-colors",
                    activeView?.id === view.id && "bg-muted"
                  )}
                >
                  <button
                    onClick={() => {
                      onSelectView(view);
                      setIsOpen(false);
                    }}
                    className="flex-1 text-sm text-left"
                  >
                    {view.name}
                  </button>
                  <div className="flex items-center gap-1">
                    {activeView?.id === view.id && (
                      <Check className="w-3.5 h-3.5 text-primary" />
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteView(view.id);
                      }}
                      className="p-1 opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Create New View */}
          <div className="p-2">
            {isCreating ? (
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={newViewName}
                  onChange={(e) => setNewViewName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="View name..."
                  className="flex-1 px-2 py-1 text-sm border rounded bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCreateView}
                  disabled={!newViewName.trim()}
                  className="h-7 w-7 p-0"
                >
                  <Check className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <button
                onClick={() => setIsCreating(true)}
                className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
              >
                <Plus className="w-4 h-4" />
                Save current view
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
