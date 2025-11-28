import { Link } from "react-router-dom";
import { Check, AlertTriangle, CheckCircle, XCircle, Clock, Upload } from "lucide-react";
import type { Photo, PhotoStatus } from "../../lib/api/types";
import { formatRelativeTime } from "../../lib/utils";

interface StatusCounts {
  pending: number;
  processing: number;
  processed: number;
  failed: number;
  approved: number;
  rejected: number;
  total: number;
}

interface StatusSummaryBarProps {
  photos: Photo[];
  lastUpdated: Date;
  uploadingCount?: number;
}

function computeCounts(photos: Photo[]): StatusCounts {
  const counts: StatusCounts = {
    pending: 0,
    processing: 0,
    processed: 0,
    failed: 0,
    approved: 0,
    rejected: 0,
    total: photos.length,
  };

  for (const photo of photos) {
    const status = photo.status.toLowerCase() as Lowercase<PhotoStatus>;
    if (status in counts) {
      counts[status as keyof Omit<StatusCounts, "total">]++;
    }
  }

  return counts;
}

interface StatusItemConfig {
  key: keyof Omit<StatusCounts, "total">;
  label: string;
  colorClass: string;
  filterParam: string | null;
}

const statusItemConfigs: StatusItemConfig[] = [
  {
    key: "processed",
    label: "Ready",
    colorClass: "text-amber-600",
    filterParam: "PROCESSED",
  },
  {
    key: "failed",
    label: "Failed",
    colorClass: "text-red-600",
    filterParam: "FAILED",
  },
  {
    key: "approved",
    label: "Approved",
    colorClass: "text-emerald-600",
    filterParam: "APPROVED",
  },
  {
    key: "rejected",
    label: "Rejected",
    colorClass: "text-orange-600",
    filterParam: "REJECTED",
  },
];

// Dynamic icon based on status
function getStatusIcon(key: string): React.ReactNode {
  switch (key) {
    case "processed":
      return <Check className="h-3 w-3 text-amber-500" />;
    case "failed":
      return <AlertTriangle className="h-3 w-3 text-red-500" />;
    case "approved":
      return <CheckCircle className="h-3 w-3 text-emerald-500" />;
    case "rejected":
      return <XCircle className="h-3 w-3 text-orange-500" />;
    default:
      return null;
  }
}

export function StatusSummaryBar({ photos, lastUpdated, uploadingCount = 0 }: StatusSummaryBarProps) {
  const counts = computeCounts(photos);

  return (
    <div className="border-b bg-muted/30">
      <div className="container mx-auto px-4 h-10 flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm">
          {/* Uploading indicator - show only when actively uploading */}
          {uploadingCount > 0 && (
            <div className="flex items-center gap-1.5 pr-3 border-r">
              <Upload className="h-3 w-3 text-primary animate-bounce" />
              <span className="text-primary font-medium">
                Uploading: <span className="font-bold">{uploadingCount}</span>
              </span>
            </div>
          )}
          {statusItemConfigs.map((item) => {
            const count = counts[item.key];
            const icon = getStatusIcon(item.key);

            const content = (
              <>
                {icon}
                <span className={item.colorClass}>
                  {item.label}: <span className="font-medium">{count}</span>
                </span>
              </>
            );

            // If this status has a filter param, make it a link
            if (item.filterParam) {
              return (
                <Link
                  key={item.key}
                  to={`/review?status=${item.filterParam}`}
                  className="flex items-center gap-1.5 hover:opacity-70 transition-opacity"
                >
                  {content}
                </Link>
              );
            }

            return (
              <div key={item.key} className="flex items-center gap-1.5">
                {content}
              </div>
            );
          })}
          <Link
            to="/review"
            className="border-l pl-4 ml-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            Total: <span className="font-medium">{counts.total}</span>
          </Link>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>Updated {formatRelativeTime(lastUpdated)}</span>
        </div>
      </div>
    </div>
  );
}
