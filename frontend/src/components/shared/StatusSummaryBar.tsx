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
}[] = [
  {
    key: "pending",
    label: "Pending",
    icon: <Circle className="h-3 w-3 fill-slate-400 text-slate-400" />,
    colorClass: "text-slate-500",
  },
  {
    key: "processing",
    label: "Processing",
    icon: <Loader2 className="h-3 w-3 animate-spin text-sky-500" />,
    colorClass: "text-sky-600",
  },
  {
    key: "processed",
    label: "Ready",
    icon: <Check className="h-3 w-3 text-amber-500" />,
    colorClass: "text-amber-600",
  },
  {
    key: "failed",
    label: "Failed",
    icon: <AlertTriangle className="h-3 w-3 text-red-500" />,
    colorClass: "text-red-600",
  },
  {
    key: "approved",
    label: "Approved",
    icon: <CheckCircle className="h-3 w-3 text-emerald-500" />,
    colorClass: "text-emerald-600",
  },
  {
    key: "rejected",
    label: "Rejected",
    icon: <XCircle className="h-3 w-3 text-orange-500" />,
    colorClass: "text-orange-600",
  },
];

export function StatusSummaryBar({ photos, lastUpdated }: StatusSummaryBarProps) {
  const counts = computeCounts(photos);

  return (
    <div className="border-b bg-muted/30">
      <div className="container mx-auto px-4 h-10 flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm">
          {statusItems.map((item) => (
            <div key={item.key} className="flex items-center gap-1.5">
              {item.icon}
              <span className={item.colorClass}>
                {item.label}: <span className="font-medium">{counts[item.key]}</span>
              </span>
            </div>
          ))}
          <div className="border-l pl-4 ml-2 text-muted-foreground">
            Total: <span className="font-medium">{counts.total}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>Updated {formatRelativeTime(lastUpdated)}</span>
        </div>
      </div>
    </div>
  );
}
