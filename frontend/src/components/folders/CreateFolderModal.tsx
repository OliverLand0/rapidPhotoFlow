import { useState } from "react";
import { X, FolderPlus } from "lucide-react";
import { useFolders } from "../../lib/FoldersContext";

interface CreateFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  parentId?: string | null;
}

export function CreateFolderModal({ isOpen, onClose, parentId }: CreateFolderModalProps) {
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { createFolder, getFolderById } = useFolders();

  const parentFolder = parentId ? getFolderById(parentId) : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError("Folder name is required");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await createFolder(name.trim(), parentId);
      setName("");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create folder");
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
      <div className="relative bg-background rounded-lg shadow-lg w-full max-w-md mx-4 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FolderPlus className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Create Folder</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-muted transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Parent folder info */}
        {parentFolder && (
          <p className="text-sm text-muted-foreground mb-4">
            Creating folder inside: <span className="font-medium">{parentFolder.name}</span>
          </p>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="folderName"
              className="block text-sm font-medium mb-1"
            >
              Folder Name
            </label>
            <input
              type="text"
              id="folderName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter folder name"
              className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              autoFocus
              disabled={isSubmitting}
            />
          </div>

          {/* Error message */}
          {error && (
            <p className="text-sm text-red-500 mb-4">{error}</p>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-md hover:bg-muted transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
              disabled={isSubmitting || !name.trim()}
            >
              {isSubmitting ? "Creating..." : "Create Folder"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
