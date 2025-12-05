import { useState, useEffect } from "react";
import {
  Share2,
  Link as LinkIcon,
  Copy,
  Check,
  Trash2,
  Eye,
  Download,
  Clock,
  Lock,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  ExternalLink,
  AlertCircle,
  Filter
} from "lucide-react";
import { shareClient } from "../lib/api/client";
import { formatRelativeTime } from "../lib/utils";
import type { SharedLink } from "../lib/api/types";
import { useToast } from "../components/ui/toast";

// Helper to resolve API URLs in development
const resolveApiUrl = (url: string | null): string | null => {
  if (!url) return null;
  // In dev mode, prepend the backend URL for relative API paths
  if (import.meta.env.DEV && url.startsWith("/api/")) {
    const apiHost = typeof window !== 'undefined' && window.location.hostname === 'host.docker.internal'
      ? 'host.docker.internal'
      : 'localhost';
    return `http://${apiHost}:8080${url}`;
  }
  return url;
};

type FilterOption = "all" | "active" | "expired" | "disabled";
type SortOption = "newest" | "oldest" | "most-views" | "most-downloads";

export function SharesPage() {
  const [shares, setShares] = useState<SharedLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterOption>("all");
  const [sort, setSort] = useState<SortOption>("newest");
  const { toast } = useToast();

  const loadShares = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await shareClient.getShares();
      setShares(response.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load shares");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShares();
  }, []);

  const handleCopy = async (share: SharedLink) => {
    try {
      const fullUrl = window.location.origin + share.url;
      await navigator.clipboard.writeText(fullUrl);
      setCopiedId(share.id);
      setTimeout(() => setCopiedId(null), 2000);
      toast({ type: "success", title: "Link copied to clipboard" });
    } catch {
      toast({ type: "error", title: "Failed to copy link" });
    }
  };

  const handleToggleActive = async (share: SharedLink) => {
    setActionInProgress(share.id);
    try {
      if (share.isActive) {
        await shareClient.deactivateShare(share.id);
        toast({ type: "success", title: "Share link deactivated" });
      } else {
        await shareClient.activateShare(share.id);
        toast({ type: "success", title: "Share link activated" });
      }
      await loadShares();
    } catch (err) {
      toast({ type: "error", title: `Failed to ${share.isActive ? "deactivate" : "activate"} share` });
    } finally {
      setActionInProgress(null);
    }
  };

  const handleDelete = async (share: SharedLink) => {
    if (!confirm("Are you sure you want to delete this share link? This action cannot be undone.")) {
      return;
    }
    setActionInProgress(share.id);
    try {
      await shareClient.deleteShare(share.id);
      toast({ type: "success", title: "Share link deleted" });
      await loadShares();
    } catch (err) {
      toast({ type: "error", title: "Failed to delete share" });
    } finally {
      setActionInProgress(null);
    }
  };

  // Filter shares
  const filteredShares = shares.filter((share) => {
    switch (filter) {
      case "active":
        return share.isActive && !share.isExpired;
      case "expired":
        return share.isExpired;
      case "disabled":
        return !share.isActive;
      default:
        return true;
    }
  });

  // Sort shares
  const sortedShares = [...filteredShares].sort((a, b) => {
    switch (sort) {
      case "oldest":
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case "most-views":
        return b.viewCount - a.viewCount;
      case "most-downloads":
        return b.downloadCount - a.downloadCount;
      default: // newest
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  const getStatusBadge = (share: SharedLink) => {
    if (share.isExpired) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
          <Clock className="h-3 w-3" />
          Expired
        </span>
      );
    }
    if (!share.isActive) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400">
          Disabled
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
        Active
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
        <h2 className="text-lg font-semibold mb-2">Failed to load shares</h2>
        <p className="text-muted-foreground mb-4">{error}</p>
        <button
          onClick={loadShares}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Share2 className="h-6 w-6" />
            Shared Links
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your photo share links and view analytics
          </p>
        </div>
        <button
          onClick={loadShares}
          className="flex items-center gap-2 px-3 py-2 text-sm rounded-md border border-border hover:bg-muted transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Filters and Sort */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as FilterOption)}
            className="px-3 py-2 text-sm rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">All shares</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="disabled">Disabled</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Sort by:</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            className="px-3 py-2 text-sm rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="most-views">Most views</option>
            <option value="most-downloads">Most downloads</option>
          </select>
        </div>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg border border-border bg-muted/30">
          <p className="text-2xl font-bold">{shares.length}</p>
          <p className="text-sm text-muted-foreground">Total shares</p>
        </div>
        <div className="p-4 rounded-lg border border-border bg-muted/30">
          <p className="text-2xl font-bold">{shares.filter(s => s.isActive && !s.isExpired).length}</p>
          <p className="text-sm text-muted-foreground">Active</p>
        </div>
        <div className="p-4 rounded-lg border border-border bg-muted/30">
          <p className="text-2xl font-bold">{shares.reduce((sum, s) => sum + s.viewCount, 0)}</p>
          <p className="text-sm text-muted-foreground">Total views</p>
        </div>
        <div className="p-4 rounded-lg border border-border bg-muted/30">
          <p className="text-2xl font-bold">{shares.reduce((sum, s) => sum + s.downloadCount, 0)}</p>
          <p className="text-sm text-muted-foreground">Total downloads</p>
        </div>
      </div>

      {/* Shares list */}
      {sortedShares.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border rounded-lg">
          <LinkIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-lg font-semibold mb-2">
            {filter === "all" ? "No share links yet" : `No ${filter} shares`}
          </h2>
          <p className="text-muted-foreground">
            {filter === "all"
              ? "Create a share link from any photo to get started"
              : "Try changing the filter to see other shares"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedShares.map((share) => (
            <div
              key={share.id}
              className="p-4 rounded-lg border border-border bg-background hover:bg-muted/30 transition-colors"
            >
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Thumbnail */}
                <div className="w-full sm:w-20 h-20 rounded-md overflow-hidden bg-muted flex-shrink-0">
                  {share.targetThumbnailUrl ? (
                    <img
                      src={resolveApiUrl(share.targetThumbnailUrl) || ""}
                      alt={share.targetName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Share2 className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h3 className="font-medium truncate">{share.targetName}</h3>
                      <p className="text-xs text-muted-foreground">
                        Created {formatRelativeTime(share.createdAt)}
                      </p>
                    </div>
                    {getStatusBadge(share)}
                  </div>

                  {/* Settings summary */}
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-3">
                    {share.hasPassword && (
                      <span className="flex items-center gap-1">
                        <Lock className="h-3 w-3" />
                        Password
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {share.expiresAt
                        ? `Expires ${formatRelativeTime(share.expiresAt)}`
                        : "Never expires"}
                    </span>
                    {share.maxViews && (
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {share.viewCount}/{share.maxViews} views
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Download className="h-3 w-3" />
                      {share.downloadAllowed ? "Downloads enabled" : "View only"}
                    </span>
                  </div>

                  {/* Analytics */}
                  <div className="flex gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Eye className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{share.viewCount}</span>
                      <span className="text-muted-foreground">views</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Download className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{share.downloadCount}</span>
                      <span className="text-muted-foreground">downloads</span>
                    </div>
                    {share.lastAccessedAt && (
                      <div className="text-muted-foreground text-xs">
                        Last accessed {formatRelativeTime(share.lastAccessedAt)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex sm:flex-col gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleCopy(share)}
                    disabled={actionInProgress === share.id}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-md border border-border hover:bg-muted transition-colors disabled:opacity-50"
                    title="Copy link"
                  >
                    {copiedId === share.id ? (
                      <>
                        <Check className="h-4 w-4 text-green-500" />
                        <span className="hidden sm:inline">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        <span className="hidden sm:inline">Copy</span>
                      </>
                    )}
                  </button>
                  <a
                    href={share.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-md border border-border hover:bg-muted transition-colors"
                    title="Open link"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span className="hidden sm:inline">Open</span>
                  </a>
                  <button
                    onClick={() => handleToggleActive(share)}
                    disabled={actionInProgress === share.id || share.isExpired}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-md border border-border hover:bg-muted transition-colors disabled:opacity-50"
                    title={share.isActive ? "Deactivate" : "Activate"}
                  >
                    {share.isActive ? (
                      <>
                        <ToggleRight className="h-4 w-4 text-green-500" />
                        <span className="hidden sm:inline">On</span>
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="h-4 w-4" />
                        <span className="hidden sm:inline">Off</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(share)}
                    disabled={actionInProgress === share.id}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-md border border-border text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="hidden sm:inline">Delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
