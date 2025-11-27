import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePhotoSelection } from "./usePhotoSelection";
import type { Photo } from "@/lib/api/types";

const createPhoto = (id: string): Photo => ({
  id,
  filename: `photo-${id}.jpg`,
  status: "PENDING",
  mimeType: "image/jpeg",
  sizeBytes: 1024,
  failureReason: null,
  uploadedAt: "2024-01-15T10:00:00Z",
  updatedAt: "2024-01-15T10:00:00Z",
});

describe("usePhotoSelection", () => {
  it("should initialize with empty selection", () => {
    const { result } = renderHook(() => usePhotoSelection());

    expect(result.current.selectedIds.size).toBe(0);
    expect(result.current.selectedCount).toBe(0);
  });

  it("should toggle selection on", () => {
    const { result } = renderHook(() => usePhotoSelection());

    act(() => {
      result.current.toggle("photo-1");
    });

    expect(result.current.selectedIds.has("photo-1")).toBe(true);
    expect(result.current.selectedCount).toBe(1);
    expect(result.current.isSelected("photo-1")).toBe(true);
  });

  it("should toggle selection off", () => {
    const { result } = renderHook(() => usePhotoSelection());

    act(() => {
      result.current.toggle("photo-1");
    });
    act(() => {
      result.current.toggle("photo-1");
    });

    expect(result.current.selectedIds.has("photo-1")).toBe(false);
    expect(result.current.selectedCount).toBe(0);
    expect(result.current.isSelected("photo-1")).toBe(false);
  });

  it("should select multiple items", () => {
    const { result } = renderHook(() => usePhotoSelection());

    act(() => {
      result.current.toggle("photo-1");
      result.current.toggle("photo-2");
      result.current.toggle("photo-3");
    });

    expect(result.current.selectedCount).toBe(3);
    expect(result.current.isSelected("photo-1")).toBe(true);
    expect(result.current.isSelected("photo-2")).toBe(true);
    expect(result.current.isSelected("photo-3")).toBe(true);
  });

  it("should select all photos", () => {
    const { result } = renderHook(() => usePhotoSelection());
    const photos = [createPhoto("1"), createPhoto("2"), createPhoto("3")];

    act(() => {
      result.current.selectAll(photos);
    });

    expect(result.current.selectedCount).toBe(3);
    expect(result.current.isSelected("1")).toBe(true);
    expect(result.current.isSelected("2")).toBe(true);
    expect(result.current.isSelected("3")).toBe(true);
  });

  it("should clear selection", () => {
    const { result } = renderHook(() => usePhotoSelection());

    act(() => {
      result.current.toggle("photo-1");
      result.current.toggle("photo-2");
    });
    act(() => {
      result.current.clearSelection();
    });

    expect(result.current.selectedCount).toBe(0);
    expect(result.current.isSelected("photo-1")).toBe(false);
    expect(result.current.isSelected("photo-2")).toBe(false);
  });

  describe("isAllSelected", () => {
    it("should return true when all photos are selected", () => {
      const { result } = renderHook(() => usePhotoSelection());
      const photos = [createPhoto("1"), createPhoto("2")];

      act(() => {
        result.current.selectAll(photos);
      });

      expect(result.current.isAllSelected(photos)).toBe(true);
    });

    it("should return false when not all photos are selected", () => {
      const { result } = renderHook(() => usePhotoSelection());
      const photos = [createPhoto("1"), createPhoto("2"), createPhoto("3")];

      act(() => {
        result.current.toggle("1");
        result.current.toggle("2");
      });

      expect(result.current.isAllSelected(photos)).toBe(false);
    });

    it("should return false for empty array", () => {
      const { result } = renderHook(() => usePhotoSelection());

      expect(result.current.isAllSelected([])).toBe(false);
    });
  });

  describe("isSomeSelected", () => {
    it("should return true when some but not all are selected", () => {
      const { result } = renderHook(() => usePhotoSelection());
      const photos = [createPhoto("1"), createPhoto("2"), createPhoto("3")];

      act(() => {
        result.current.toggle("1");
      });

      expect(result.current.isSomeSelected(photos)).toBe(true);
    });

    it("should return false when all are selected", () => {
      const { result } = renderHook(() => usePhotoSelection());
      const photos = [createPhoto("1"), createPhoto("2")];

      act(() => {
        result.current.selectAll(photos);
      });

      expect(result.current.isSomeSelected(photos)).toBe(false);
    });

    it("should return false when none are selected", () => {
      const { result } = renderHook(() => usePhotoSelection());
      const photos = [createPhoto("1"), createPhoto("2")];

      expect(result.current.isSomeSelected(photos)).toBe(false);
    });
  });
});
