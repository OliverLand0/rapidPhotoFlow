import { useState } from "react";
import { X, Share2, Copy, Check, Link } from "lucide-react";
import { shareClient } from "../../lib/api/client";
import type { Photo, SharedLink } from "../../lib/api/types";

interface CreateShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  photo: Photo;
}

export function CreateShareModal({ isOpen, onClose, photo }: CreateShareModalProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdShare, setCreatedShare] = useState<SharedLink | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCreate = async () => {
    setIsCreating(true);
    setError(null);

    try {
      const share = await shareClient.createShare({ photoId: photo.id });
      setCreatedShare(share);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create share link");
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopy = async () => {
    if (!createdShare) return;

    try {
      const fullUrl = window.location.origin + createdShare.url;
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = window.location.origin + createdShare.url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setCreatedShare(null);
    setError(null);
    setCopied(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-background rounded-lg shadow-lg w-full max-w-md mx-4 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Share Photo</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-md hover:bg-muted transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Photo preview */}
        <div className="mb-4 p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded overflow-hidden bg-muted flex-shrink-0">
              <img
                src={`/api/photos/${photo.id}/content`}
                alt={photo.filename}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="overflow-hidden">
              <p className="font-medium truncate">{photo.filename}</p>
              <p className="text-sm text-muted-foreground">
                {(photo.sizeBytes / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
        </div>

        {!createdShare ? (
          // Create share view
          <>
            <p className="text-sm text-muted-foreground mb-4">
              Create a shareable link for this photo. Anyone with the link can view the photo.
            </p>

            {/* Error message */}
            {error && (
              <p className="text-sm text-red-500 mb-4">{error}</p>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm rounded-md hover:bg-muted transition-colors"
                disabled={isCreating}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreate}
                className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                disabled={isCreating}
              >
                {isCreating ? (
                  "Creating..."
                ) : (
                  <>
                    <Link className="h-4 w-4" />
                    Create Link
                  </>
                )}
              </button>
            </div>
          </>
        ) : (
          // Share created view
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Share Link
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={window.location.origin + createdShare.url}
                  className="flex-1 px-3 py-2 border rounded-md bg-muted text-sm font-mono"
                />
                <button
                  onClick={handleCopy}
                  className="px-3 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors flex items-center gap-1"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="text-sm text-muted-foreground mb-4 space-y-1">
              <p>Anyone with this link can view the photo.</p>
              <p>Downloads are {createdShare.downloadAllowed ? "enabled" : "disabled"}.</p>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                Done
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
