import { Link } from "react-router-dom";
import { Circle, Loader2, Check, AlertTriangle, CheckCircle, XCircle, Clock } from "lucide-react";
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

const statusItems: {
  key: keyof Omit<StatusCounts, "total">;
  label: string;
  icon: React.ReactNode;
  colorClass: string;
  filterParam: string | null; // null means not linkable (pending/processing)
}[] = [
  {
    key: "pending",
    label: "Pending",
    icon: <Circle className="h-3 w-3 fill-slate-400 text-slate-400" />,
    colorClass: "text-slate-500",
    filterParam: null,
  },
  {
    key: "processing",
    label: "Processing",
    icon: <Loader2 className="h-3 w-3 animate-spin text-sky-500" />,
    colorClass: "text-sky-600",
    filterParam: null,
  },
  {
    key: "processed",
    label: "Ready",
    icon: <Check className="h-3 w-3 text-amber-500" />,
    colorClass: "text-amber-600",
    filterParam: "PROCESSED",
  },
  {
    key: "failed",
    label: "Failed",
    icon: <AlertTriangle className="h-3 w-3 text-red-500" />,
    colorClass: "text-red-600",
    filterParam: "FAILED",
  },
  {
    key: "approved",
    label: "Approved",
    icon: <CheckCircle className="h-3 w-3 text-emerald-500" />,
    colorClass: "text-emerald-600",
    filterParam: "APPROVED",
  },
  {
    key: "rejected",
    label: "Rejected",
    icon: <XCircle className="h-3 w-3 text-orange-500" />,
    colorClass: "text-orange-600",
    filterParam: "REJECTED",
  },
];

export function StatusSummaryBar({ photos, lastUpdated }: StatusSummaryBarProps) {
  const counts = computeCounts(photos);

  return (
    <div className="border-b bg-muted/30">
      <div className="container mx-auto px-4 h-10 flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm">
          {statusItems.map((item) => {
            const content = (
              <>
                {item.icon}
                <span className={item.colorClass}>
                  {item.label}: <span className="font-medium">{counts[item.key]}</span>
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
