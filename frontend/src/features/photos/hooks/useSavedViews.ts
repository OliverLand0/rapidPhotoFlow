import { useState, useCallback, useEffect } from "react";
import type { SavedView } from "../../../lib/api/types";
import type { StatusFilter, SortOption } from "./usePhotoFilters";

const STORAGE_KEY = "rapidphotoflow_saved_views";

// Default preset views
const defaultViews: SavedView[] = [
  {
    id: "preset-recent-failures",
    name: "Recent Failures",
    createdAt: new Date().toISOString(),
    filters: {
      search: "",
      status: "FAILED",
      sort: "newest",
    },
  },
  {
    id: "preset-approved-today",
    name: "Approved",
    createdAt: new Date().toISOString(),
    filters: {
      search: "",
      status: "APPROVED",
      sort: "newest",
    },
  },
  {
    id: "preset-ready-review",
    name: "Ready to Review",
    createdAt: new Date().toISOString(),
    filters: {
      search: "",
      status: "PROCESSED",
      sort: "newest",
    },
  },
];

function loadViews(): SavedView[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const userViews = JSON.parse(stored) as SavedView[];
      // Combine default views with user views, user views can override defaults by id
      const viewMap = new Map<string, SavedView>();
      defaultViews.forEach((v) => viewMap.set(v.id, v));
      userViews.forEach((v) => viewMap.set(v.id, v));
      return Array.from(viewMap.values());
    }
  } catch (e) {
    console.error("Failed to load saved views:", e);
  }
  return defaultViews;
}

function saveViews(views: SavedView[]): void {
  try {
    // Only save user-created views (not presets)
    const userViews = views.filter((v) => !v.id.startsWith("preset-"));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userViews));
  } catch (e) {
    console.error("Failed to save views:", e);
  }
}

export interface CurrentFilters {
  search: string;
  status: StatusFilter;
  sort: SortOption;
  tag?: string | null;
}

export function useSavedViews() {
  const [views, setViews] = useState<SavedView[]>(loadViews);

  // Sync with localStorage when views change
  useEffect(() => {
    saveViews(views);
  }, [views]);

  const createView = useCallback(
    (name: string, filters: CurrentFilters): SavedView => {
      const newView: SavedView = {
        id: `user-${Date.now()}`,
        name,
        createdAt: new Date().toISOString(),
        filters,
      };
      setViews((prev) => [...prev, newView]);
      return newView;
    },
    []
  );

  const deleteView = useCallback((id: string) => {
    // Don't allow deleting preset views
    if (id.startsWith("preset-")) return;
    setViews((prev) => prev.filter((v) => v.id !== id));
  }, []);

  const renameView = useCallback((id: string, newName: string) => {
    if (id.startsWith("preset-")) return;
    setViews((prev) =>
      prev.map((v) => (v.id === id ? { ...v, name: newName } : v))
    );
  }, []);

  const getView = useCallback(
    (id: string): SavedView | undefined => {
      return views.find((v) => v.id === id);
    },
    [views]
  );

  return {
    views,
    createView,
    deleteView,
    renameView,
    getView,
    presetViews: views.filter((v) => v.id.startsWith("preset-")),
    userViews: views.filter((v) => !v.id.startsWith("preset-")),
  };
}
