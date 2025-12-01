import { useState } from "react";
import { ChevronRight, ChevronDown, Folder as FolderIcon, FolderOpen, Plus, Images, Share2 } from "lucide-react";
import { cn } from "../../lib/utils";
import type { Folder } from "../../lib/api/types";
import { useFolders } from "../../lib/FoldersContext";
import { CreateShareModal } from "../shares/CreateShareModal";

interface FolderTreeItemProps {
  folder: Folder;
  level: number;
  onCreateFolder?: (parentId: string) => void;
  onShare?: (folder: Folder) => void;
}

function FolderTreeItem({ folder, level, onCreateFolder, onShare }: FolderTreeItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { currentFolderId, setCurrentFolder } = useFolders();
  const isSelected = currentFolderId === folder.id;
  const hasChildren = folder.children && folder.children.length > 0;

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer text-sm transition-colors group",
          isSelected
            ? "bg-primary text-primary-foreground"
            : "hover:bg-muted text-muted-foreground hover:text-foreground"
        )}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={() => setCurrentFolder(folder.id)}
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
        {isExpanded ? (
          <FolderOpen className="h-4 w-4 shrink-0" />
        ) : (
          <FolderIcon className="h-4 w-4 shrink-0" />
        )}

        {/* Folder name */}
        <span className="truncate flex-1">{folder.name}</span>

        {/* Photo count */}
        {folder.photoCount > 0 && (
          <span className={cn(
            "text-xs px-1.5 rounded",
            isSelected ? "bg-primary-foreground/20" : "bg-muted-foreground/20"
          )}>
            {folder.photoCount}
          </span>
        )}

        {/* Share button (shown on hover) */}
        {onShare && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onShare(folder);
            }}
            className={cn(
              "p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity",
              isSelected ? "hover:bg-primary-foreground/20" : "hover:bg-muted-foreground/20"
            )}
            title="Share folder"
          >
            <Share2 className="h-3.5 w-3.5" />
          </button>
        )}

        {/* Create subfolder button (shown on hover) */}
        {onCreateFolder && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCreateFolder(folder.id);
            }}
            className={cn(
              "p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity",
              isSelected ? "hover:bg-primary-foreground/20" : "hover:bg-muted-foreground/20"
            )}
            title="Create subfolder"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Children */}
      {isExpanded && hasChildren && (
        <div>
          {folder.children.map((child) => (
            <FolderTreeItem
              key={child.id}
              folder={child}
              level={level + 1}
              onCreateFolder={onCreateFolder}
              onShare={onShare}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface FolderTreeProps {
  onCreateFolder?: (parentId?: string | null) => void;
}

export function FolderTree({ onCreateFolder }: FolderTreeProps) {
  const { folders, currentFolderId, setCurrentFolder, loading } = useFolders();
  const [shareFolder, setShareFolder] = useState<Folder | null>(null);

  const handleShare = (folder: Folder) => {
    setShareFolder(folder);
  };

  return (
    <div className="py-2">
      {/* All Photos option */}
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-md cursor-pointer text-sm transition-colors",
          currentFolderId === null
            ? "bg-primary text-primary-foreground"
            : "hover:bg-muted text-muted-foreground hover:text-foreground"
        )}
        onClick={() => setCurrentFolder(null)}
      >
        <Images className="h-4 w-4" />
        <span>All Photos</span>
      </div>

      {/* Divider */}
      <div className="my-2 border-t" />

      {/* Folders header */}
      <div className="flex items-center justify-between px-3 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">
        <span>Folders</span>
        {onCreateFolder && (
          <button
            onClick={() => onCreateFolder(null)}
            className="p-0.5 rounded hover:bg-muted transition-colors"
            title="Create folder"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Folder list */}
      {loading ? (
        <div className="px-3 py-2 text-sm text-muted-foreground">Loading...</div>
      ) : folders.length === 0 ? (
        <div className="px-3 py-2 text-sm text-muted-foreground">No folders yet</div>
      ) : (
        <div className="mt-1">
          {folders.map((folder) => (
            <FolderTreeItem
              key={folder.id}
              folder={folder}
              level={0}
              onCreateFolder={onCreateFolder}
              onShare={handleShare}
            />
          ))}
        </div>
      )}

      {/* Share Folder Modal */}
      <CreateShareModal
        isOpen={shareFolder !== null}
        onClose={() => setShareFolder(null)}
        folder={shareFolder ?? undefined}
      />
    </div>
  );
}
