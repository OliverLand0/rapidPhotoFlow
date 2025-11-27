import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePhotoFilters } from "./usePhotoFilters";
import type { Photo } from "../../../lib/api/types";

const createPhoto = (
  id: string,
  overrides: Partial<Photo> = {}
): Photo => ({
  id,
  filename: `photo-${id}.jpg`,
  status: "PENDING",
  mimeType: "image/jpeg",
  sizeBytes: 1024,
  failureReason: null,
  updatedAt: "2024-01-15T10:00:00Z",
  uploadedAt: "2024-01-15T10:00:00Z",
  ...overrides,
});

describe("usePhotoFilters", () => {
  const basePhotos: Photo[] = [
    createPhoto("1", { filename: "beach.jpg", status: "PENDING", uploadedAt: "2024-01-15T10:00:00Z" }),
    createPhoto("2", { filename: "mountain.jpg", status: "PROCESSED", uploadedAt: "2024-01-15T11:00:00Z" }),
    createPhoto("3", { filename: "city.jpg", status: "APPROVED", uploadedAt: "2024-01-15T12:00:00Z" }),
    createPhoto("4", { filename: "sunset.jpg", status: "FAILED", uploadedAt: "2024-01-15T09:00:00Z" }),
    createPhoto("5", { filename: "beach-sunset.jpg", status: "REJECTED", uploadedAt: "2024-01-15T08:00:00Z" }),
  ];

  describe("status filtering", () => {
    it("should return all photos when status is ALL", () => {
      const { result } = renderHook(() =>
        usePhotoFilters(basePhotos, "ALL", { pageSize: 20 })
      );

      expect(result.current.totalFilteredCount).toBe(5);
    });

    it("should filter by PENDING status", () => {
      const { result } = renderHook(() =>
        usePhotoFilters(basePhotos, "PENDING", { pageSize: 20 })
      );

      expect(result.current.totalFilteredCount).toBe(1);
      expect(result.current.filteredPhotos[0].status).toBe("PENDING");
    });

    it("should filter by PROCESSED status", () => {
      const { result } = renderHook(() =>
        usePhotoFilters(basePhotos, "PROCESSED", { pageSize: 20 })
      );

      expect(result.current.totalFilteredCount).toBe(1);
      expect(result.current.filteredPhotos[0].status).toBe("PROCESSED");
    });
  });

  describe("search filtering", () => {
    it("should filter by search term", () => {
      const { result } = renderHook(() =>
        usePhotoFilters(basePhotos, "ALL", { pageSize: 20 })
      );

      act(() => {
        result.current.setSearch("beach");
      });

      expect(result.current.totalFilteredCount).toBe(2);
      expect(result.current.filteredPhotos.every((p) => p.filename.includes("beach"))).toBe(true);
    });

    it("should be case insensitive", () => {
      const { result } = renderHook(() =>
        usePhotoFilters(basePhotos, "ALL", { pageSize: 20 })
      );

      act(() => {
        result.current.setSearch("BEACH");
      });

      expect(result.current.totalFilteredCount).toBe(2);
    });

    it("should return empty when no matches", () => {
      const { result } = renderHook(() =>
        usePhotoFilters(basePhotos, "ALL", { pageSize: 20 })
      );

      act(() => {
        result.current.setSearch("nonexistent");
      });

      expect(result.current.totalFilteredCount).toBe(0);
    });
  });

  describe("sorting", () => {
    it("should sort by newest first by default", () => {
      const { result } = renderHook(() =>
        usePhotoFilters(basePhotos, "ALL", { pageSize: 20 })
      );

      expect(result.current.filteredPhotos[0].id).toBe("3"); // Latest upload
      expect(result.current.filteredPhotos[4].id).toBe("5"); // Earliest upload
    });

    it("should sort by oldest first", () => {
      const { result } = renderHook(() =>
        usePhotoFilters(basePhotos, "ALL", { pageSize: 20 })
      );

      act(() => {
        result.current.setSortBy("oldest");
      });

      expect(result.current.filteredPhotos[0].id).toBe("5"); // Earliest upload
      expect(result.current.filteredPhotos[4].id).toBe("3"); // Latest upload
    });

    it("should sort by status", () => {
      const { result } = renderHook(() =>
        usePhotoFilters(basePhotos, "ALL", { pageSize: 20 })
      );

      act(() => {
        result.current.setSortBy("status");
      });

      // Status order: PENDING, PROCESSING, PROCESSED, FAILED, APPROVED, REJECTED
      expect(result.current.filteredPhotos[0].status).toBe("PENDING");
      expect(result.current.filteredPhotos[4].status).toBe("REJECTED");
    });
  });

  describe("pagination", () => {
    it("should paginate results", () => {
      const { result } = renderHook(() =>
        usePhotoFilters(basePhotos, "ALL", { pageSize: 2 })
      );

      expect(result.current.filteredPhotos.length).toBe(2);
      expect(result.current.totalFilteredCount).toBe(5);
    });

    it("should change page", () => {
      const { result } = renderHook(() =>
        usePhotoFilters(basePhotos, "ALL", { pageSize: 2 })
      );

      const firstPageFirstItem = result.current.filteredPhotos[0].id;

      act(() => {
        result.current.setCurrentPage(1);
      });

      expect(result.current.filteredPhotos[0].id).not.toBe(firstPageFirstItem);
    });

    it("should reset page when search changes", () => {
      const { result } = renderHook(() =>
        usePhotoFilters(basePhotos, "ALL", { pageSize: 2 })
      );

      act(() => {
        result.current.setCurrentPage(1);
      });
      act(() => {
        result.current.setSearch("beach");
      });

      expect(result.current.currentPage).toBe(0);
    });

    it("should reset page when sort changes", () => {
      const { result } = renderHook(() =>
        usePhotoFilters(basePhotos, "ALL", { pageSize: 2 })
      );

      act(() => {
        result.current.setCurrentPage(1);
      });
      act(() => {
        result.current.setSortBy("oldest");
      });

      expect(result.current.currentPage).toBe(0);
    });
  });

  describe("clearFilters", () => {
    it("should reset search and sort", () => {
      const { result } = renderHook(() =>
        usePhotoFilters(basePhotos, "ALL", { pageSize: 20 })
      );

      act(() => {
        result.current.setSearch("beach");
        result.current.setSortBy("oldest");
        result.current.setCurrentPage(1);
      });

      act(() => {
        result.current.clearFilters();
      });

      expect(result.current.search).toBe("");
      expect(result.current.sortBy).toBe("newest");
      expect(result.current.currentPage).toBe(0);
    });
  });

  describe("hasActiveFilters", () => {
    it("should return false when no filters active", () => {
      const { result } = renderHook(() =>
        usePhotoFilters(basePhotos, "ALL", { pageSize: 20 })
      );

      expect(result.current.hasActiveFilters).toBe(false);
    });

    it("should return true when search is active", () => {
      const { result } = renderHook(() =>
        usePhotoFilters(basePhotos, "ALL", { pageSize: 20 })
      );

      act(() => {
        result.current.setSearch("beach");
      });

      expect(result.current.hasActiveFilters).toBe(true);
    });

    it("should return true when sort is not default", () => {
      const { result } = renderHook(() =>
        usePhotoFilters(basePhotos, "ALL", { pageSize: 20 })
      );

      act(() => {
        result.current.setSortBy("oldest");
      });

      expect(result.current.hasActiveFilters).toBe(true);
    });
  });
});
