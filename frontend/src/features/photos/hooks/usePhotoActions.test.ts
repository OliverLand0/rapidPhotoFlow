import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { usePhotoActions } from "./usePhotoActions";
import { photoClient } from "../../../lib/api/client";
import type { Photo } from "../../../lib/api/types";

vi.mock("../../../lib/api/client", () => ({
  photoClient: {
    performAction: vi.fn(),
  },
}));

const createPhoto = (id: string, status: string): Photo => ({
  id,
  filename: `photo-${id}.jpg`,
  status: status as Photo["status"],
  mimeType: "image/jpeg",
  sizeBytes: 1024,
  failureReason: null,
  uploadedAt: "2024-01-15T10:00:00Z",
  updatedAt: "2024-01-15T10:00:00Z",
});

describe("usePhotoActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with no loading state", () => {
    const { result } = renderHook(() => usePhotoActions());

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  describe("approve", () => {
    it("should call photoClient.performAction with approve", async () => {
      const mockPhoto = createPhoto("123", "APPROVED");
      vi.mocked(photoClient.performAction).mockResolvedValue(mockPhoto);

      const { result } = renderHook(() => usePhotoActions());

      await act(async () => {
        await result.current.approve("123");
      });

      expect(photoClient.performAction).toHaveBeenCalledWith("123", "approve");
    });

    it("should call onSuccess callback when provided", async () => {
      const mockPhoto = createPhoto("123", "APPROVED");
      vi.mocked(photoClient.performAction).mockResolvedValue(mockPhoto);
      const onSuccess = vi.fn();

      const { result } = renderHook(() => usePhotoActions());

      await act(async () => {
        await result.current.approve("123", onSuccess);
      });

      expect(onSuccess).toHaveBeenCalledWith(mockPhoto);
    });

    it("should set loading state during action", async () => {
      let resolvePromise: (value: Photo) => void;
      const pendingPromise = new Promise<Photo>((resolve) => {
        resolvePromise = resolve;
      });
      vi.mocked(photoClient.performAction).mockReturnValue(pendingPromise);

      const { result } = renderHook(() => usePhotoActions());

      act(() => {
        result.current.approve("123");
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolvePromise!(createPhoto("123", "APPROVED"));
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("reject", () => {
    it("should call photoClient.performAction with reject", async () => {
      const mockPhoto = createPhoto("123", "REJECTED");
      vi.mocked(photoClient.performAction).mockResolvedValue(mockPhoto);

      const { result } = renderHook(() => usePhotoActions());

      await act(async () => {
        await result.current.reject("123");
      });

      expect(photoClient.performAction).toHaveBeenCalledWith("123", "reject");
    });
  });

  describe("retry", () => {
    it("should call photoClient.performAction with retry", async () => {
      const mockPhoto = createPhoto("123", "PENDING");
      vi.mocked(photoClient.performAction).mockResolvedValue(mockPhoto);

      const { result } = renderHook(() => usePhotoActions());

      await act(async () => {
        await result.current.retry("123");
      });

      expect(photoClient.performAction).toHaveBeenCalledWith("123", "retry");
    });
  });

  describe("error handling", () => {
    it("should set error state on failure", async () => {
      const error = new Error("Action failed");
      vi.mocked(photoClient.performAction).mockRejectedValue(error);

      const { result } = renderHook(() => usePhotoActions());

      await act(async () => {
        try {
          await result.current.approve("123");
        } catch {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe(error);
      expect(result.current.isLoading).toBe(false);
    });

    it("should rethrow error", async () => {
      const error = new Error("Action failed");
      vi.mocked(photoClient.performAction).mockRejectedValue(error);

      const { result } = renderHook(() => usePhotoActions());

      await expect(
        act(async () => {
          await result.current.approve("123");
        })
      ).rejects.toThrow("Action failed");
    });

    it("should clear error on successful action", async () => {
      const error = new Error("Action failed");
      vi.mocked(photoClient.performAction).mockRejectedValueOnce(error);

      const { result } = renderHook(() => usePhotoActions());

      // First call fails
      await act(async () => {
        try {
          await result.current.approve("123");
        } catch {
          // Expected
        }
      });

      expect(result.current.error).toBe(error);

      // Second call succeeds
      vi.mocked(photoClient.performAction).mockResolvedValue(
        createPhoto("123", "APPROVED")
      );

      await act(async () => {
        await result.current.approve("123");
      });

      expect(result.current.error).toBe(null);
    });
  });
});
