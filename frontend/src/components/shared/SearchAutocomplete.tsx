import { useState, useRef, useEffect, useMemo } from "react";
import { Search, Tag, FileImage, X } from "lucide-react";
import { cn } from "../../lib/utils";

interface Suggestion {
  type: "filename" | "tag";
  value: string;
  display: string;
}

interface SearchAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  filenames: string[];
  tags: string[];
  placeholder?: string;
  className?: string;
}

export function SearchAutocomplete({
  value,
  onChange,
  selectedTags,
  onTagsChange,
  filenames,
  tags,
  placeholder = "Search by filename or tag...",
  className,
}: SearchAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate suggestions based on current input
  const suggestions = useMemo(() => {
    if (!value.trim()) return [];

    const searchLower = value.toLowerCase();
    const results: Suggestion[] = [];

    // Search tags first (usually fewer and more relevant)
    // Exclude already selected tags
    const matchingTags = tags
      .filter((tag) =>
        tag.toLowerCase().includes(searchLower) &&
        !selectedTags.includes(tag)
      )
      .slice(0, 5)
      .map((tag) => ({
        type: "tag" as const,
        value: tag,
        display: tag,
      }));

    // Then search filenames
    const matchingFilenames = filenames
      .filter((filename) => filename.toLowerCase().includes(searchLower))
      .slice(0, 5)
      .map((filename) => ({
        type: "filename" as const,
        value: filename,
        display: filename,
      }));

    results.push(...matchingTags, ...matchingFilenames);

    // Remove exact matches of current value
    return results.filter(
      (s) => s.value.toLowerCase() !== searchLower
    ).slice(0, 8);
  }, [value, filenames, tags, selectedTags]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle backspace to remove last tag when input is empty
    if (e.key === "Backspace" && !value && selectedTags.length > 0) {
      onTagsChange(selectedTags.slice(0, -1));
      return;
    }

    if (!isOpen || suggestions.length === 0) {
      if (e.key === "ArrowDown" && suggestions.length > 0) {
        setIsOpen(true);
        setHighlightedIndex(0);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
          selectSuggestion(suggestions[highlightedIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  const selectSuggestion = (suggestion: Suggestion) => {
    if (suggestion.type === "tag") {
      // Add tag to selected tags
      onTagsChange([...selectedTags, suggestion.value]);
      onChange(""); // Clear the input
    } else {
      // For filenames, set as search value
      onChange(suggestion.value);
    }
    setIsOpen(false);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  };

  const removeTag = (tagToRemove: string) => {
    onTagsChange(selectedTags.filter(tag => tag !== tagToRemove));
    inputRef.current?.focus();
  };

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const item = listRef.current.children[highlightedIndex] as HTMLElement;
      item?.scrollIntoView({ block: "nearest" });
    }
  }, [highlightedIndex]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Open dropdown when typing
  useEffect(() => {
    if (value.trim() && suggestions.length > 0) {
      setIsOpen(true);
      setHighlightedIndex(-1);
    } else {
      setIsOpen(false);
    }
  }, [value, suggestions.length]);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Input container with selected tags */}
      <div className="relative flex items-center flex-wrap gap-1 min-h-[36px] px-8 py-1 border border-input rounded-md bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

        {/* Selected tags */}
        {selectedTags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full border border-primary/20"
          >
            <Tag className="h-3 w-3" />
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="hover:bg-primary/20 rounded-full p-0.5"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}

        {/* Text input */}
        <input
          ref={inputRef}
          type="text"
          placeholder={selectedTags.length === 0 ? placeholder : "Add more..."}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (value.trim() && suggestions.length > 0) {
              setIsOpen(true);
            }
          }}
          className="flex-1 min-w-[100px] bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground"
          autoComplete="off"
        />

        {/* Clear all button */}
        {(value || selectedTags.length > 0) && (
          <button
            type="button"
            onClick={() => {
              onChange("");
              onTagsChange([]);
              inputRef.current?.focus();
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Suggestions dropdown - solid background */}
      {isOpen && suggestions.length > 0 && (
        <ul
          ref={listRef}
          className="absolute z-50 mt-1 w-full rounded-md shadow-lg max-h-60 overflow-auto border border-border bg-white dark:bg-zinc-900"
        >
          {suggestions.map((suggestion, index) => (
            <li
              key={`${suggestion.type}-${suggestion.value}`}
              onClick={() => selectSuggestion(suggestion)}
              onMouseEnter={() => setHighlightedIndex(index)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 cursor-pointer text-sm",
                highlightedIndex === index
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent/50"
              )}
            >
              {suggestion.type === "tag" ? (
                <Tag className="h-3.5 w-3.5 text-primary flex-shrink-0" />
              ) : (
                <FileImage className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              )}
              <span className="truncate">{suggestion.display}</span>
              <span className="ml-auto text-xs text-muted-foreground flex-shrink-0">
                {suggestion.type === "tag" ? "tag" : "file"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
