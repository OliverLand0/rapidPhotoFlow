import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { Folder } from "./api/types";
import { folderClient } from "./api/client";
import { usePhotos } from "./PhotosContext";

interface FoldersContextType {
  folders: Folder[];
  currentFolderId: string | null;
  folderPath: Folder[];
  loading: boolean;
  error: string | null;
  createFolder: (name: string, parentId?: string | null) => Promise<Folder>;
  renameFolder: (id: string, name: string) => Promise<void>;
  deleteFolder: (id: string, deleteContents?: boolean) => Promise<void>;
  moveFolder: (id: string, parentId: string | null) => Promise<void>;
  movePhotosToFolder: (photoIds: string[], folderId: string | null) => Promise<void>;
  setCurrentFolder: (id: string | null) => void;
  refreshFolders: () => Promise<void>;
  getFolderById: (id: string) => Folder | undefined;
}

const FoldersContext = createContext<FoldersContextType | undefined>(undefined);

export function FoldersProvider({ children }: { children: React.ReactNode }) {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [folderPath, setFolderPath] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use PhotosContext's currentFolderId to keep photo filtering in sync
  const { currentFolderId, setCurrentFolderId: setPhotosCurrentFolderId } = usePhotos();

  // Helper to find a folder in the tree
  const findFolderInTree = useCallback((folders: Folder[], id: string): Folder | undefined => {
    for (const folder of folders) {
      if (folder.id === id) {
        return folder;
      }
      if (folder.children && folder.children.length > 0) {
        const found = findFolderInTree(folder.children, id);
        if (found) return found;
      }
    }
    return undefined;
  }, []);

  const getFolderById = useCallback((id: string): Folder | undefined => {
    return findFolderInTree(folders, id);
  }, [folders, findFolderInTree]);

  // Fetch folder tree
  const refreshFolders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await folderClient.getFolderTree();
      setFolders(response.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load folders");
      console.error("Failed to load folders:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch folder path when currentFolderId changes
  useEffect(() => {
    if (currentFolderId) {
      folderClient.getFolderPath(currentFolderId)
        .then(response => setFolderPath(response.items))
        .catch(err => console.error("Failed to load folder path:", err));
    } else {
      setFolderPath([]);
    }
  }, [currentFolderId]);

  // Initial load
  useEffect(() => {
    refreshFolders();
  }, [refreshFolders]);

  const createFolder = useCallback(async (name: string, parentId?: string | null): Promise<Folder> => {
    const folder = await folderClient.createFolder({ name, parentId });
    await refreshFolders();
    return folder;
  }, [refreshFolders]);

  const renameFolder = useCallback(async (id: string, name: string): Promise<void> => {
    await folderClient.renameFolder(id, name);
    await refreshFolders();
  }, [refreshFolders]);

  const deleteFolder = useCallback(async (id: string, deleteContents: boolean = false): Promise<void> => {
    await folderClient.deleteFolder(id, deleteContents);
    // If we deleted the current folder, go back to root
    if (currentFolderId === id) {
      setPhotosCurrentFolderId(null);
    }
    await refreshFolders();
  }, [currentFolderId, refreshFolders, setPhotosCurrentFolderId]);

  const moveFolder = useCallback(async (id: string, parentId: string | null): Promise<void> => {
    await folderClient.moveFolder(id, parentId);
    await refreshFolders();
  }, [refreshFolders]);

  const movePhotosToFolder = useCallback(async (photoIds: string[], folderId: string | null): Promise<void> => {
    await folderClient.movePhotosToFolder(folderId, photoIds);
    await refreshFolders();
  }, [refreshFolders]);

  const setCurrentFolder = useCallback((id: string | null) => {
    setPhotosCurrentFolderId(id);
  }, [setPhotosCurrentFolderId]);

  return (
    <FoldersContext.Provider
      value={{
        folders,
        currentFolderId,
        folderPath,
        loading,
        error,
        createFolder,
        renameFolder,
        deleteFolder,
        moveFolder,
        movePhotosToFolder,
        setCurrentFolder,
        refreshFolders,
        getFolderById,
      }}
    >
      {children}
    </FoldersContext.Provider>
  );
}

export function useFolders() {
  const context = useContext(FoldersContext);
  if (context === undefined) {
    throw new Error("useFolders must be used within a FoldersProvider");
  }
  return context;
}
