import { useState } from "react";
import { X, Share2, Copy, Check, Link, ChevronDown, ChevronUp, Lock, Clock, Eye, Download } from "lucide-react";
import { shareClient } from "../../lib/api/client";
import type { Photo, SharedLink, CreateShareRequest } from "../../lib/api/types";

interface CreateShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  photo: Photo;
}

type ExpirationOption = "never" | "1h" | "24h" | "7d" | "30d";

const expirationOptions: { value: ExpirationOption; label: string }[] = [
  { value: "never", label: "Never expires" },
  { value: "1h", label: "1 hour" },
  { value: "24h", label: "24 hours" },
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
];

export function CreateShareModal({ isOpen, onClose, photo }: CreateShareModalProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdShare, setCreatedShare] = useState<SharedLink | null>(null);
  const [copied, setCopied] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Share settings
  const [expiresIn, setExpiresIn] = useState<ExpirationOption>("never");
  const [password, setPassword] = useState("");
  const [downloadAllowed, setDownloadAllowed] = useState(true);
  const [maxViews, setMaxViews] = useState<string>("");

  const handleCreate = async () => {
    setIsCreating(true);
    setError(null);

    try {
      const request: CreateShareRequest = {
        photoId: photo.id,
        expiresIn,
        downloadAllowed,
      };

      // Only include password if set
      if (password.trim()) {
        request.password = password.trim();
      }

      // Only include maxViews if set and valid
      const maxViewsNum = parseInt(maxViews, 10);
      if (!isNaN(maxViewsNum) && maxViewsNum > 0) {
        request.maxViews = maxViewsNum;
      }

      const share = await shareClient.createShare(request);
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
    setShowAdvanced(false);
    setExpiresIn("never");
    setPassword("");
    setDownloadAllowed(true);
    setMaxViews("");
    onClose();
  };

  const formatExpiration = (option: ExpirationOption): string => {
    const labels: Record<ExpirationOption, string> = {
      never: "Never",
      "1h": "1 hour",
      "24h": "24 hours",
      "7d": "7 days",
      "30d": "30 days",
    };
    return labels[option];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-background rounded-lg shadow-lg w-full max-w-md mx-4 p-6 max-h-[90vh] overflow-y-auto">
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

            {/* Advanced settings toggle */}
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full flex items-center justify-between px-3 py-2 text-sm rounded-md border border-border hover:bg-muted/50 transition-colors mb-4"
            >
              <span className="font-medium">Share settings</span>
              {showAdvanced ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>

            {/* Advanced settings panel */}
            {showAdvanced && (
              <div className="space-y-4 mb-4 p-4 bg-muted/30 rounded-lg border border-border">
                {/* Expiration */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium mb-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    Link expiration
                  </label>
                  <select
                    value={expiresIn}
                    onChange={(e) => setExpiresIn(e.target.value as ExpirationOption)}
                    className="w-full px-3 py-2 text-sm rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {expirationOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Password */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium mb-2">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                    Password protection
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Leave empty for no password"
                    className="w-full px-3 py-2 text-sm rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Viewers will need to enter this password to see the photo
                  </p>
                </div>

                {/* Max views */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium mb-2">
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    Maximum views
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={maxViews}
                    onChange={(e) => setMaxViews(e.target.value)}
                    placeholder="Unlimited"
                    className="w-full px-3 py-2 text-sm rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Link will be disabled after this many views
                  </p>
                </div>

                {/* Download allowed */}
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={downloadAllowed}
                      onChange={(e) => setDownloadAllowed(e.target.checked)}
                      className="rounded border-border"
                    />
                    <Download className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Allow downloads</span>
                  </label>
                  <p className="text-xs text-muted-foreground mt-1 ml-6">
                    {downloadAllowed
                      ? "Viewers can download the photo"
                      : "Viewers can only view, not download"}
                  </p>
                </div>
              </div>
            )}

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

            {/* Share settings summary */}
            <div className="text-sm text-muted-foreground mb-4 space-y-2 p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>
                  Expires: {createdShare.expiresAt
                    ? new Date(createdShare.expiresAt).toLocaleDateString()
                    : "Never"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                <span>
                  {createdShare.hasPassword ? "Password protected" : "No password"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                <span>
                  {createdShare.maxViews
                    ? `Limited to ${createdShare.maxViews} views`
                    : "Unlimited views"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                <span>
                  Downloads {createdShare.downloadAllowed ? "enabled" : "disabled"}
                </span>
              </div>
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
