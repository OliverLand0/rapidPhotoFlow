import { useState } from "react";
import { X, FolderInput, ChevronRight, ChevronDown, Folder as FolderIcon, FolderOpen, Home } from "lucide-react";
import { useFolders } from "../../lib/FoldersContext";
import type { Folder } from "../../lib/api/types";
import { cn } from "../../lib/utils";

interface FolderSelectItemProps {
  folder: Folder;
  level: number;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

function FolderSelectItem({ folder, level, selectedId, onSelect }: FolderSelectItemProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const isSelected = selectedId === folder.id;
  const hasChildren = folder.children && folder.children.length > 0;

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer text-sm transition-colors",
          isSelected
            ? "bg-primary text-primary-foreground"
            : "hover:bg-muted"
        )}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={() => onSelect(folder.id)}
      >
        {/* Expand/collapse button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className={cn(
            "p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10",
            !hasChildren && "invisible"
          )}
        >
          {isExpanded ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" />
          )}
        </button>

        {/* Folder icon */}
        {isExpanded && hasChildren ? (
          <FolderOpen className="h-4 w-4 shrink-0" />
        ) : (
          <FolderIcon className="h-4 w-4 shrink-0" />
        )}

        {/* Folder name */}
        <span className="truncate">{folder.name}</span>
      </div>

      {/* Children */}
      {isExpanded && hasChildren && (
        <div>
          {folder.children.map((child) => (
            <FolderSelectItem
              key={child.id}
              folder={child}
              level={level + 1}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface MoveToFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  photoIds: string[];
  onMoved?: () => void;
}

export function MoveToFolderModal({ isOpen, onClose, photoIds, onMoved }: MoveToFolderModalProps) {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { folders, movePhotosToFolder } = useFolders();

  const handleMove = async () => {
    if (photoIds.length === 0) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await movePhotosToFolder(photoIds, selectedFolderId);
      onMoved?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to move photos");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-background rounded-lg shadow-lg w-full max-w-md mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <FolderInput className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Move to Folder</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-muted transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Photo count */}
        <div className="px-4 py-2 text-sm text-muted-foreground border-b">
          Moving {photoIds.length} photo{photoIds.length !== 1 ? "s" : ""}
        </div>

        {/* Folder selection */}
        <div className="flex-1 overflow-auto p-4">
          {/* Root (No folder) option */}
          <div
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer text-sm transition-colors mb-2",
              selectedFolderId === null
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted"
            )}
            onClick={() => setSelectedFolderId(null)}
          >
            <Home className="h-4 w-4" />
            <span>Root (No folder)</span>
          </div>

          {/* Divider */}
          <div className="border-t my-2" />

          {/* Folders */}
          {folders.length === 0 ? (
            <p className="text-sm text-muted-foreground">No folders available</p>
          ) : (
            <div>
              {folders.map((folder) => (
                <FolderSelectItem
                  key={folder.id}
                  folder={folder}
                  level={0}
                  selectedId={selectedFolderId}
                  onSelect={setSelectedFolderId}
                />
              ))}
            </div>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="px-4 py-2 text-sm text-red-500 border-t">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 p-4 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-md hover:bg-muted transition-colors"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            onClick={handleMove}
            className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
            disabled={isSubmitting || photoIds.length === 0}
          >
            {isSubmitting ? "Moving..." : "Move Photos"}
          </button>
        </div>
      </div>
    </div>
  );
}
