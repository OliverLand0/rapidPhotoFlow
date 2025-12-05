import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import { useEventLog } from "../hooks/useEventLog";
import { formatRelativeTime } from "../../../lib/utils";
import { cn } from "../../../lib/utils";
import { Skeleton } from "../../../components/shared/LoadingSkeleton";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../../../components/ui/select";
import type { EventLog, EventType } from "../../../lib/api/types";

interface EventLogPanelProps {
  photoId?: string;
  onPhotoClick?: (photoId: string) => void;
}

type EventFilter = "all" | "errors" | "success" | "activity";

const filterOptions: { value: EventFilter; label: string }[] = [
  { value: "all", label: "All Events" },
  { value: "activity", label: "Activity" },
  { value: "success", label: "Success" },
  { value: "errors", label: "Errors Only" },
];

const filterGroups: Record<EventFilter, EventType[] | null> = {
  all: null,
  errors: ["PROCESSING_FAILED"],
  success: ["PROCESSING_COMPLETED", "APPROVED", "TAG_ADDED", "AUTO_TAGGED"],
  activity: ["PHOTO_CREATED", "PROCESSING_STARTED", "RETRY_REQUESTED", "REJECTED", "DELETED", "TAG_ADDED", "TAG_REMOVED", "AUTO_TAGGED"],
};

const eventTypeColors: Record<string, string> = {
  PHOTO_CREATED: "bg-blue-500",
  PROCESSING_STARTED: "bg-blue-500",
  PROCESSING_COMPLETED: "bg-green-500",
  PROCESSING_FAILED: "bg-red-500",
  APPROVED: "bg-green-500",
  REJECTED: "bg-orange-500",
  DELETED: "bg-slate-500",
  RETRY_REQUESTED: "bg-amber-500",
  TAG_ADDED: "bg-purple-500",
  TAG_REMOVED: "bg-purple-400",
  AUTO_TAGGED: "bg-violet-500",
};

function EventItem({
  event,
  isLatest,
  onClick,
  showNavigate,
}: {
  event: EventLog;
  isLatest: boolean;
  onClick?: () => void;
  showNavigate?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex gap-3 py-3 border-b last:border-0 group",
        onClick && "cursor-pointer hover:bg-muted/50 -mx-2 px-2 rounded transition-colors"
      )}
      onClick={onClick}
    >
      <div className="flex-shrink-0 pt-1">
        <div
          className={cn(
            "w-2 h-2 rounded-full",
            isLatest
              ? eventTypeColors[event.type] || "bg-primary"
              : "bg-muted-foreground/30"
          )}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{event.message}</p>
        <p className="text-xs text-muted-foreground">
          {formatRelativeTime(event.timestamp)}
        </p>
      </div>
      {showNavigate && onClick && (
        <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
      )}
    </div>
  );
}

export function EventLogPanel({ photoId, onPhotoClick }: EventLogPanelProps) {
  const [filter, setFilter] = useState<EventFilter>("all");
  const navigate = useNavigate();

  const { events, isLoading } = useEventLog({
    photoId,
    intervalMs: 5000,
    limit: 30,
  });

  const handleEventClick = (event: EventLog) => {
    if (onPhotoClick) {
      onPhotoClick(event.photoId);
    } else {
      // Fallback: Navigate to review page with search query for the photo
      navigate(`/review?photoId=${event.photoId}`);
    }
  };

  const filteredEvents = useMemo(() => {
    const allowedTypes = filterGroups[filter];
    if (!allowedTypes) return events;
    return events.filter((e) => allowedTypes.includes(e.type));
  }, [events, filter]);

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="w-2 h-2 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold">Event Log</h3>
        <Select value={filter} onValueChange={(value) => setFilter(value as EventFilter)}>
          <SelectTrigger className="h-7 text-xs w-auto min-w-[100px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {filterOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredEvents.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-8">
            {events.length === 0 ? "No events yet" : "No matching events"}
          </div>
        ) : (
          <div className="space-y-0">
            {filteredEvents.map((event, index) => (
              <EventItem
                key={event.id}
                event={event}
                isLatest={index === 0}
                onClick={() => handleEventClick(event)}
                showNavigate={!photoId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
