import { ChevronRight, Home } from "lucide-react";
import { useFolders } from "../../lib/FoldersContext";
import { cn } from "../../lib/utils";

export function FolderBreadcrumbs() {
  const { folderPath, currentFolderId, setCurrentFolder } = useFolders();

  if (!currentFolderId) {
    return null;
  }

  return (
    <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
      {/* Home / All Photos */}
      <button
        onClick={() => setCurrentFolder(null)}
        className="flex items-center gap-1 hover:text-foreground transition-colors"
      >
        <Home className="h-4 w-4" />
        <span>All Photos</span>
      </button>

      {/* Path segments */}
      {folderPath.map((folder, index) => (
        <div key={folder.id} className="flex items-center gap-1">
          <ChevronRight className="h-4 w-4" />
          <button
            onClick={() => setCurrentFolder(folder.id)}
            className={cn(
              "hover:text-foreground transition-colors",
              index === folderPath.length - 1 && "text-foreground font-medium"
            )}
          >
            {folder.name}
          </button>
        </div>
      ))}
    </nav>
  );
}
