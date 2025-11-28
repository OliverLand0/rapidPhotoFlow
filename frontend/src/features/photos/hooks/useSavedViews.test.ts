import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSavedViews } from "./useSavedViews";

const STORAGE_KEY = "rapidphotoflow_saved_views";

describe("useSavedViews", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe("initialization", () => {
    it("should return default preset views when localStorage is empty", () => {
      const { result } = renderHook(() => useSavedViews());

      expect(result.current.presetViews).toHaveLength(3);
      expect(result.current.presetViews.map((v) => v.name)).toContain("Recent Failures");
      expect(result.current.presetViews.map((v) => v.name)).toContain("Approved");
      expect(result.current.presetViews.map((v) => v.name)).toContain("Ready to Review");
    });

    it("should have no user views initially", () => {
      const { result } = renderHook(() => useSavedViews());

      expect(result.current.userViews).toHaveLength(0);
    });

    it("should load user views from localStorage", () => {
      const userViews = [
        {
          id: "user-123",
          name: "My Custom View",
          createdAt: "2024-01-15T10:00:00Z",
          filters: { search: "test", status: "APPROVED", sort: "newest" },
        },
      ];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userViews));

      const { result } = renderHook(() => useSavedViews());

      expect(result.current.userViews).toHaveLength(1);
      expect(result.current.userViews[0].name).toBe("My Custom View");
    });

    it("should handle invalid localStorage data gracefully", () => {
      localStorage.setItem(STORAGE_KEY, "invalid json{");

      const { result } = renderHook(() => useSavedViews());

      // Should fall back to default views
      expect(result.current.presetViews).toHaveLength(3);
      expect(result.current.userViews).toHaveLength(0);
    });
  });

  describe("createView", () => {
    it("should create a new user view", () => {
      const { result } = renderHook(() => useSavedViews());

      act(() => {
        result.current.createView("My New View", {
          search: "sunset",
          status: "PROCESSED",
          sort: "oldest",
        });
      });

      expect(result.current.userViews).toHaveLength(1);
      expect(result.current.userViews[0].name).toBe("My New View");
      expect(result.current.userViews[0].filters.search).toBe("sunset");
    });

    it("should generate unique ID for new view", async () => {
      const { result } = renderHook(() => useSavedViews());

      act(() => {
        result.current.createView("View 1", {
          search: "",
          status: "all",
          sort: "newest",
        });
      });

      // Wait a bit to ensure different timestamp
      await new Promise((resolve) => setTimeout(resolve, 10));

      act(() => {
        result.current.createView("View 2", {
          search: "",
          status: "FAILED",
          sort: "newest",
        });
      });

      expect(result.current.userViews[0].id).not.toBe(result.current.userViews[1].id);
    });

    it("should persist new view to localStorage", () => {
      const { result } = renderHook(() => useSavedViews());

      act(() => {
        result.current.createView("Persisted View", {
          search: "",
          status: "APPROVED",
          sort: "newest",
        });
      });

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      expect(stored).toHaveLength(1);
      expect(stored[0].name).toBe("Persisted View");
    });

    it("should return the created view", () => {
      const { result } = renderHook(() => useSavedViews());

      let createdView;
      act(() => {
        createdView = result.current.createView("Return Test", {
          search: "",
          status: "PENDING",
          sort: "newest",
        });
      });

      expect(createdView).toBeDefined();
      expect((createdView as any).name).toBe("Return Test");
    });
  });

  describe("deleteView", () => {
    it("should delete a user view", () => {
      const userViews = [
        {
          id: "user-123",
          name: "To Delete",
          createdAt: "2024-01-15T10:00:00Z",
          filters: { search: "", status: "all", sort: "newest" },
        },
      ];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userViews));

      const { result } = renderHook(() => useSavedViews());

      expect(result.current.userViews).toHaveLength(1);

      act(() => {
        result.current.deleteView("user-123");
      });

      expect(result.current.userViews).toHaveLength(0);
    });

    it("should not delete preset views", () => {
      const { result } = renderHook(() => useSavedViews());
      const initialPresetCount = result.current.presetViews.length;

      act(() => {
        result.current.deleteView("preset-recent-failures");
      });

      expect(result.current.presetViews).toHaveLength(initialPresetCount);
    });

    it("should persist deletion to localStorage", () => {
      const userViews = [
        {
          id: "user-456",
          name: "Will Be Deleted",
          createdAt: "2024-01-15T10:00:00Z",
          filters: { search: "", status: "all", sort: "newest" },
        },
      ];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userViews));

      const { result } = renderHook(() => useSavedViews());

      act(() => {
        result.current.deleteView("user-456");
      });

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      expect(stored).toHaveLength(0);
    });
  });

  describe("renameView", () => {
    it("should rename a user view", () => {
      const userViews = [
        {
          id: "user-789",
          name: "Old Name",
          createdAt: "2024-01-15T10:00:00Z",
          filters: { search: "", status: "all", sort: "newest" },
        },
      ];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userViews));

      const { result } = renderHook(() => useSavedViews());

      act(() => {
        result.current.renameView("user-789", "New Name");
      });

      expect(result.current.userViews[0].name).toBe("New Name");
    });

    it("should not rename preset views", () => {
      const { result } = renderHook(() => useSavedViews());

      act(() => {
        result.current.renameView("preset-recent-failures", "Renamed Preset");
      });

      const presetView = result.current.presetViews.find(
        (v) => v.id === "preset-recent-failures"
      );
      expect(presetView?.name).toBe("Recent Failures");
    });
  });

  describe("getView", () => {
    it("should return a view by ID", () => {
      const { result } = renderHook(() => useSavedViews());

      const view = result.current.getView("preset-approved-today");

      expect(view).toBeDefined();
      expect(view?.name).toBe("Approved");
    });

    it("should return undefined for non-existent view", () => {
      const { result } = renderHook(() => useSavedViews());

      const view = result.current.getView("non-existent-id");

      expect(view).toBeUndefined();
    });
  });

  describe("views array", () => {
    it("should combine preset and user views", () => {
      const userViews = [
        {
          id: "user-abc",
          name: "User View",
          createdAt: "2024-01-15T10:00:00Z",
          filters: { search: "", status: "all", sort: "newest" },
        },
      ];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userViews));

      const { result } = renderHook(() => useSavedViews());

      expect(result.current.views.length).toBe(4); // 3 preset + 1 user
    });
  });
});
