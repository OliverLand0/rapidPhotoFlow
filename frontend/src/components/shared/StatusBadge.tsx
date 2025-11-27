import { Badge } from "../ui/badge";
import { cn } from "../../lib/utils";
import type { PhotoStatus } from "../../lib/api/types";
import { Loader2, Check, AlertTriangle, Circle, CheckCircle, XCircle } from "lucide-react";

interface StatusBadgeProps {
  status: PhotoStatus;
  className?: string;
}

const statusConfig: Record<
  PhotoStatus,
  {
    variant: "outline" | "processing" | "success" | "destructive" | "warning" | "rejected";
    icon: React.ReactNode;
    label: string;
  }
> = {
  PENDING: {
    variant: "outline",
    icon: <Circle className="h-3 w-3 fill-slate-400 text-slate-400" />,
    label: "Pending",
  },
  PROCESSING: {
    variant: "processing",
    icon: <Loader2 className="h-3 w-3 animate-spin text-sky-600" />,
    label: "Processing",
  },
  PROCESSED: {
    variant: "warning",
    icon: <Check className="h-3 w-3 text-amber-600" />,
    label: "Ready",
  },
  FAILED: {
    variant: "destructive",
    icon: <AlertTriangle className="h-3 w-3 text-red-600" />,
    label: "Failed",
  },
  APPROVED: {
    variant: "success",
    icon: <CheckCircle className="h-3 w-3 text-emerald-600" />,
    label: "Approved",
  },
  REJECTED: {
    variant: "rejected",
    icon: <XCircle className="h-3 w-3 text-orange-600" />,
    label: "Rejected",
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} className={cn("gap-1", className)}>
      {config.icon}
      {config.label}
    </Badge>
  );
}
