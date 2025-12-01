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
  // Folder filtering
  currentFolderId: string | null;
  setCurrentFolderId: (folderId: string | null) => void;
}

const PhotosContext = createContext<PhotosContextValue | null>(null);

const POLL_INTERVAL_MS = 3000;

export function PhotosProvider({ children }: { children: ReactNode }) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [uploadingCount, setUploadingCount] = useState(0);
  const [currentFolderId, setCurrentFolderIdState] = useState<string | null>(null);

  const fetchPhotos = useCallback(async (folderId: string | null = null) => {
    try {
      // Pass folder filter to API - for now we fetch all and filter client-side
      // The backend supports folderId param but we need to update photoClient
      const data = await photoClient.getPhotos();

      // Client-side filtering by folder (until we update the API call)
      let filteredPhotos = data.items;
      if (folderId !== null) {
        filteredPhotos = data.items.filter(p => p.folderId === folderId);
      }

      setPhotos(filteredPhotos);
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
    await fetchPhotos(currentFolderId);
  }, [fetchPhotos, currentFolderId]);

  const setCurrentFolderId = useCallback((folderId: string | null) => {
    setCurrentFolderIdState(folderId);
  }, []);

  // Refetch when folder changes
  useEffect(() => {
    fetchPhotos(currentFolderId);
  }, [currentFolderId, fetchPhotos]);

  // Initial load and polling
  useEffect(() => {
    fetchPhotos(currentFolderId);
    const interval = setInterval(() => fetchPhotos(currentFolderId), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchPhotos, currentFolderId]);

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
        currentFolderId,
        setCurrentFolderId,
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
