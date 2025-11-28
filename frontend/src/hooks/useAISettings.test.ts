import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAISettings } from "./useAISettings";

const STORAGE_KEY = "rapidphotoflow-ai-settings";

describe("useAISettings", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe("initialization", () => {
    it("should return default settings when localStorage is empty", () => {
      const { result } = renderHook(() => useAISettings());

      expect(result.current.autoTagOnUpload).toBe(false);
    });

    it("should load settings from localStorage", () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ autoTagOnUpload: true }));

      const { result } = renderHook(() => useAISettings());

      expect(result.current.autoTagOnUpload).toBe(true);
    });

    it("should handle invalid localStorage data gracefully", () => {
      localStorage.setItem(STORAGE_KEY, "invalid json{");

      const { result } = renderHook(() => useAISettings());

      expect(result.current.autoTagOnUpload).toBe(false);
    });

    it("should merge partial settings with defaults", () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({}));

      const { result } = renderHook(() => useAISettings());

      expect(result.current.autoTagOnUpload).toBe(false);
    });
  });

  describe("setAutoTagOnUpload", () => {
    it("should update autoTagOnUpload to true", () => {
      const { result } = renderHook(() => useAISettings());

      expect(result.current.autoTagOnUpload).toBe(false);

      act(() => {
        result.current.setAutoTagOnUpload(true);
      });

      expect(result.current.autoTagOnUpload).toBe(true);
    });

    it("should update autoTagOnUpload to false", () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ autoTagOnUpload: true }));

      const { result } = renderHook(() => useAISettings());

      expect(result.current.autoTagOnUpload).toBe(true);

      act(() => {
        result.current.setAutoTagOnUpload(false);
      });

      expect(result.current.autoTagOnUpload).toBe(false);
    });

    it("should persist changes to localStorage", () => {
      const { result } = renderHook(() => useAISettings());

      act(() => {
        result.current.setAutoTagOnUpload(true);
      });

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      expect(stored.autoTagOnUpload).toBe(true);
    });

    it("should be stable across renders", () => {
      const { result, rerender } = renderHook(() => useAISettings());

      const initialSetAutoTagOnUpload = result.current.setAutoTagOnUpload;

      rerender();

      expect(result.current.setAutoTagOnUpload).toBe(initialSetAutoTagOnUpload);
    });
  });

  describe("persistence", () => {
    it("should persist settings across hook instances", () => {
      const { result: result1 } = renderHook(() => useAISettings());

      act(() => {
        result1.current.setAutoTagOnUpload(true);
      });

      // Create new hook instance
      const { result: result2 } = renderHook(() => useAISettings());

      expect(result2.current.autoTagOnUpload).toBe(true);
    });

    it("should handle localStorage errors gracefully on save", () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const setItemSpy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new Error("Storage quota exceeded");
      });

      const { result } = renderHook(() => useAISettings());

      // Should not throw
      act(() => {
        result.current.setAutoTagOnUpload(true);
      });

      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
      setItemSpy.mockRestore();
    });
  });
});
