import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import { aiClient } from "../lib/api/client";

export interface TaggingSession {
  id: string;
  startedAt: Date;
  completedAt?: Date;
  status: 'in_progress' | 'completed' | 'failed';
  total: number;
  processed: number;
  succeeded: number;
  failed: number;
  currentChunk: number;
  totalChunks: number;
}

interface AIServiceContextValue {
  isAvailable: boolean;
  isChecking: boolean;
  lastChecked: Date | null;
  error: string | null;
  checkHealth: () => Promise<boolean>;
  // Tagging sessions history (persists across navigation, tracks historical events)
  taggingSessions: TaggingSession[];
  clearTaggingSessions: () => void;
  dismissSession: (sessionId: string) => void;
  // Start batch tagging for a set of photo IDs
  startBatchTagging: (photoIds: string[]) => Promise<void>;
  // Queue photos for tagging (debounced)
  queuePhotosForTagging: (photoIds: string[]) => void;
  // Check if a photo has been tagged this session
  hasBeenTagged: (photoId: string) => boolean;
  // Mark photos as tagged
  markAsTagged: (photoIds: string[]) => void;
}

const AIServiceContext = createContext<AIServiceContextValue | null>(null);

const HEALTH_CHECK_INTERVAL_MS = 30000; // Check every 30 seconds

export function AIServiceProvider({ children }: { children: ReactNode }) {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Tagging sessions history (persistent across navigation, tracks historical events)
  const [taggingSessions, setTaggingSessions] = useState<TaggingSession[]>([]);

  // Track photos that have been tagged this session
  const taggedPhotosRef = useRef<Set<string>>(new Set());
  const isTaggingInProgressRef = useRef(false);
  const batchTagTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const photosReadyForBatchRef = useRef<Set<string>>(new Set());
  // Callback to refresh photos after tagging completes
  const onTaggingCompleteRef = useRef<(() => void) | null>(null);

  const checkHealth = useCallback(async (): Promise<boolean> => {
    setIsChecking(true);
    setError(null);
    try {
      const available = await aiClient.healthCheck();
      setIsAvailable(available);
      setLastChecked(new Date());
      if (!available) {
        setError("AI service is not responding");
      }
      return available;
    } catch (err) {
      setIsAvailable(false);
      setError(err instanceof Error ? err.message : "Failed to check AI service health");
      return false;
    } finally {
      setIsChecking(false);
    }
  }, []);

  const clearTaggingSessions = useCallback(() => {
    setTaggingSessions([]);
  }, []);

  const dismissSession = useCallback((sessionId: string) => {
    setTaggingSessions(prev => prev.filter(s => s.id !== sessionId));
  }, []);

  const hasBeenTagged = useCallback((photoId: string): boolean => {
    return taggedPhotosRef.current.has(photoId);
  }, []);

  const markAsTagged = useCallback((photoIds: string[]) => {
    photoIds.forEach(id => taggedPhotosRef.current.add(id));
  }, []);

  // Start batch tagging for a set of photo IDs
  const startBatchTagging = useCallback(async (photoIds: string[]): Promise<void> => {
    if (photoIds.length === 0) return;

    // Mark as tagged immediately to prevent re-queuing
    photoIds.forEach(id => taggedPhotosRef.current.add(id));

    isTaggingInProgressRef.current = true;

    // Use smaller chunks (10 photos) so progress updates more frequently
    const CHUNK_SIZE = 10;
    const chunks: string[][] = [];
    for (let i = 0; i < photoIds.length; i += CHUNK_SIZE) {
      chunks.push(photoIds.slice(i, i + CHUNK_SIZE));
    }

    console.log(`[AIService] Batch auto-tagging ${photoIds.length} photos in ${chunks.length} chunk(s) of ${CHUNK_SIZE}...`);

    // Create a new session for this batch
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newSession: TaggingSession = {
      id: sessionId,
      startedAt: new Date(),
      status: 'in_progress',
      total: photoIds.length,
      processed: 0,
      succeeded: 0,
      failed: 0,
      currentChunk: 1,
      totalChunks: chunks.length,
    };

    // Add session to history
    setTaggingSessions(prev => [newSession, ...prev]);

    let totalSucceeded = 0;
    let totalFailed = 0;
    let totalProcessed = 0;

    // Helper to update this session
    const updateSession = (updates: Partial<TaggingSession>) => {
      setTaggingSessions(prev => prev.map(s =>
        s.id === sessionId ? { ...s, ...updates } : s
      ));
    };

    try {
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        console.log(`[AIService] Processing chunk ${i + 1}/${chunks.length} (${chunk.length} photos)...`);

        // Update session for current chunk
        updateSession({ currentChunk: i + 1 });

        try {
          // Send smaller batches to AI service (chunk of 10, with 5 images per OpenAI call)
          const result = await aiClient.batchAutoTag(chunk, 5);
          totalSucceeded += result.succeeded;
          totalFailed += result.failed;
          totalProcessed += result.processed;

          // Update session after each chunk completes - this gives real-time feedback
          updateSession({
            processed: totalProcessed,
            succeeded: totalSucceeded,
            failed: totalFailed,
          });

          // Log any failures
          result.results
            .filter((r: { success: boolean }) => !r.success)
            .forEach((r: { photoId: string; error?: string }) => {
              console.error(`[AIService] Failed to tag photo ${r.photoId}:`, r.error);
            });
        } catch (chunkError) {
          console.error(`[AIService] Chunk ${i + 1} failed:`, chunkError);
          totalFailed += chunk.length;
          totalProcessed += chunk.length;

          // Update session after chunk error
          updateSession({
            processed: totalProcessed,
            succeeded: totalSucceeded,
            failed: totalFailed,
          });
        }
      }

      console.log(
        `[AIService] Batch tagging complete: ${totalSucceeded} succeeded, ${totalFailed} failed out of ${photoIds.length} total`
      );

      // Mark session as complete
      updateSession({
        status: 'completed',
        completedAt: new Date(),
        processed: totalProcessed,
        succeeded: totalSucceeded,
        failed: totalFailed,
      });
    } catch (error) {
      console.error("[AIService] Batch auto-tagging failed:", error);
      updateSession({
        status: 'failed',
        completedAt: new Date(),
      });
    } finally {
      isTaggingInProgressRef.current = false;
      // Call the refresh callback if set
      if (onTaggingCompleteRef.current) {
        onTaggingCompleteRef.current();
      }
    }
  }, []);

  // Queue photos for tagging (debounced to batch multiple calls)
  const queuePhotosForTagging = useCallback((photoIds: string[]) => {
    // Add to the queue, filtering out already tagged photos
    photoIds.forEach(id => {
      if (!taggedPhotosRef.current.has(id)) {
        photosReadyForBatchRef.current.add(id);
        taggedPhotosRef.current.add(id); // Mark as queued to prevent duplicates
      }
    });

    // If nothing was actually added, return
    if (photosReadyForBatchRef.current.size === 0) return;

    // Don't start a new timeout if already tagging - photos will be processed after current batch
    if (isTaggingInProgressRef.current) return;

    // Debounce: wait a bit to collect more photos before sending batch
    if (batchTagTimeoutRef.current) {
      clearTimeout(batchTagTimeoutRef.current);
    }

    batchTagTimeoutRef.current = setTimeout(async () => {
      if (isTaggingInProgressRef.current) return;

      // Process batches in a loop to catch photos that arrive while tagging
      while (photosReadyForBatchRef.current.size > 0) {
        const allPhotoIds = Array.from(photosReadyForBatchRef.current);

        // Clear the batch ref before processing
        photosReadyForBatchRef.current.clear();

        await startBatchTagging(allPhotoIds);

        // Small delay to let any new photos get queued
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }, 2000); // Wait 2 seconds to collect more photos
  }, [startBatchTagging]);

  // Initial health check on mount
  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  // Periodic health checks
  useEffect(() => {
    const interval = setInterval(() => {
      checkHealth();
    }, HEALTH_CHECK_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [checkHealth]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (batchTagTimeoutRef.current) {
        clearTimeout(batchTagTimeoutRef.current);
      }
    };
  }, []);

  return (
    <AIServiceContext.Provider
      value={{
        isAvailable,
        isChecking,
        lastChecked,
        error,
        checkHealth,
        taggingSessions,
        clearTaggingSessions,
        dismissSession,
        startBatchTagging,
        queuePhotosForTagging,
        hasBeenTagged,
        markAsTagged,
      }}
    >
      {children}
    </AIServiceContext.Provider>
  );
}

export function useAIService(): AIServiceContextValue {
  const context = useContext(AIServiceContext);
  if (!context) {
    throw new Error("useAIService must be used within an AIServiceProvider");
  }
  return context;
}
