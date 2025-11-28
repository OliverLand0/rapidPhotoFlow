import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { photoClient } from "./api/client";
import type { Photo } from "./api/types";

interface PhotosContextValue {
  photos: Photo[];
  isLoading: boolean;
  error: Error | null;
  lastUpdated: Date;
  refresh: () => Promise<void>;
  setPhotos: React.Dispatch<React.SetStateAction<Photo[]>>;
  // Upload tracking
  uploadingCount: number;
  setUploadingCount: React.Dispatch<React.SetStateAction<number>>;
}

const PhotosContext = createContext<PhotosContextValue | null>(null);

const POLL_INTERVAL_MS = 3000;

export function PhotosProvider({ children }: { children: ReactNode }) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [uploadingCount, setUploadingCount] = useState(0);

  const fetchPhotos = useCallback(async () => {
    try {
      const data = await photoClient.getPhotos();
      setPhotos(data.items);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    await fetchPhotos();
  }, [fetchPhotos]);

  useEffect(() => {
    fetchPhotos();
    const interval = setInterval(fetchPhotos, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchPhotos]);

  return (
    <PhotosContext.Provider
      value={{
        photos,
        isLoading,
        error,
        lastUpdated,
        refresh,
        setPhotos,
        uploadingCount,
        setUploadingCount,
      }}
    >
      {children}
    </PhotosContext.Provider>
  );
}

export function usePhotos(): PhotosContextValue {
  const context = useContext(PhotosContext);
  if (!context) {
    throw new Error("usePhotos must be used within a PhotosProvider");
  }
  return context;
}
