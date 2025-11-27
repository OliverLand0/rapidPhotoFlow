import { useState, useEffect, useCallback } from "react";
import { eventClient } from "../../../lib/api/client";
import type { EventLog } from "../../../lib/api/types";

interface UseEventLogOptions {
  photoId?: string;
  intervalMs?: number;
  limit?: number;
  enabled?: boolean;
}

export function useEventLog(options: UseEventLogOptions = {}) {
  const { photoId, intervalMs = 5000, limit = 50, enabled = true } = options;

  const [events, setEvents] = useState<EventLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchEvents = useCallback(async () => {
    try {
      const data = await eventClient.getEvents({ photoId, limit });
      setEvents(data.items);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [photoId, limit]);

  useEffect(() => {
    if (!enabled) return;

    fetchEvents();
    const interval = setInterval(fetchEvents, intervalMs);
    return () => clearInterval(interval);
  }, [fetchEvents, intervalMs, enabled]);

  return {
    events,
    isLoading,
    error,
    refresh: fetchEvents,
  };
}
