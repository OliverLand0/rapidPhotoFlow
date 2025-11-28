import { useState, useCallback, type KeyboardEvent } from "react";
import { X, Plus, Loader2 } from "lucide-react";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { useToast } from "../ui/toast";
import { photoClient } from "../../lib/api/client";
import type { Photo } from "../../lib/api/types";

interface TagEditorProps {
  photo: Photo;
  onPhotoUpdate?: (photo: Photo) => void;
  compact?: boolean;
}

export function TagEditor({ photo, onPhotoUpdate, compact = false }: TagEditorProps) {
  const [inputValue, setInputValue] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [removingTag, setRemovingTag] = useState<string | null>(null);
  const { toast } = useToast();

  const handleAddTag = useCallback(async () => {
    const tag = inputValue.trim().toLowerCase();
    if (!tag) return;

    // Check if tag already exists
    if (photo.tags?.includes(tag)) {
      toast({
        type: "error",
        title: "Tag already exists",
      });
      return;
    }

    setIsAdding(true);
    try {
      const updated = await photoClient.addTag(photo.id, tag);
      onPhotoUpdate?.(updated);
      setInputValue("");
      toast({
        type: "success",
        title: `Tag "${tag}" added`,
      });
    } catch (error) {
      console.error("Failed to add tag:", error);
      toast({
        type: "error",
        title: "Failed to add tag",
      });
    } finally {
      setIsAdding(false);
    }
  }, [inputValue, photo.id, photo.tags, onPhotoUpdate, toast]);

  const handleRemoveTag = useCallback(async (tag: string) => {
    setRemovingTag(tag);
    try {
      const updated = await photoClient.removeTag(photo.id, tag);
      onPhotoUpdate?.(updated);
      toast({
        type: "success",
        title: `Tag "${tag}" removed`,
      });
    } catch (error) {
      console.error("Failed to remove tag:", error);
      toast({
        type: "error",
        title: "Failed to remove tag",
      });
    } finally {
      setRemovingTag(null);
    }
  }, [photo.id, onPhotoUpdate, toast]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const tags = photo.tags || [];

  if (compact) {
    // Compact view for PhotoCard - just shows tags, no editing
    if (tags.length === 0) return null;
    return (
      <div className="flex flex-wrap gap-1">
        {tags.slice(0, 3).map((tag) => (
          <Badge
            key={tag}
            variant="secondary"
            className="text-[10px] px-1.5 py-0"
          >
            {tag}
          </Badge>
        ))}
        {tags.length > 3 && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            +{tags.length - 3}
          </Badge>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Tags</p>

      {/* Tags list */}
      <div className="flex flex-wrap gap-1 min-h-[24px]">
        {tags.length === 0 ? (
          <span className="text-xs text-muted-foreground italic">No tags</span>
        ) : (
          tags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="pr-1 flex items-center gap-1"
            >
              {tag}
              <button
                onClick={() => handleRemoveTag(tag)}
                disabled={removingTag === tag}
                className="ml-0.5 hover:bg-muted rounded-full p-0.5 transition-colors"
              >
                {removingTag === tag ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <X className="h-3 w-3" />
                )}
              </button>
            </Badge>
          ))
        )}
      </div>

      {/* Add tag input */}
      <div className="flex gap-1">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add tag..."
          className="h-7 text-sm"
          disabled={isAdding}
        />
        <Button
          size="sm"
          variant="outline"
          onClick={handleAddTag}
          disabled={isAdding || !inputValue.trim()}
          className="h-7 px-2"
        >
          {isAdding ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Plus className="h-3 w-3" />
          )}
        </Button>
      </div>
    </div>
  );
}
