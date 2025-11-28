import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useKeyboardShortcuts } from "./useKeyboardShortcuts";
import type { Photo } from "../../../lib/api/types";

const createPhoto = (overrides: Partial<Photo> = {}): Photo => ({
  id: "photo-1",
  filename: "test.jpg",
  status: "PROCESSED",
  mimeType: "image/jpeg",
  sizeBytes: 1024,
  failureReason: null,
  uploadedAt: "2024-01-15T10:00:00Z",
  updatedAt: "2024-01-15T10:00:00Z",
  ...overrides,
});

describe("useKeyboardShortcuts", () => {
  const defaultProps = {
    photos: [
      createPhoto({ id: "photo-1" }),
      createPhoto({ id: "photo-2" }),
      createPhoto({ id: "photo-3" }),
    ],
    focusedPhotoId: null as string | null,
    setFocusedPhotoId: vi.fn(),
    selectedIds: new Set<string>(),
    toggleSelection: vi.fn(),
    selectAll: vi.fn(),
    clearSelection: vi.fn(),
    onAction: vi.fn(),
    onBulkAction: vi.fn(),
    onPreview: vi.fn(),
    onClosePreview: vi.fn(),
    isPreviewOpen: false,
    showHelp: vi.fn(),
    enabled: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up any event listeners
  });

  describe("navigation", () => {
    it("should focus first photo on ArrowDown when no focus", () => {
      renderHook(() => useKeyboardShortcuts(defaultProps));

      act(() => {
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown" }));
      });

      expect(defaultProps.setFocusedPhotoId).toHaveBeenCalledWith("photo-1");
    });

    it("should focus last photo on ArrowUp when no focus", () => {
      renderHook(() => useKeyboardShortcuts(defaultProps));

      act(() => {
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp" }));
      });

      expect(defaultProps.setFocusedPhotoId).toHaveBeenCalledWith("photo-3");
    });

    it("should move focus down", () => {
      renderHook(() =>
        useKeyboardShortcuts({
          ...defaultProps,
          focusedPhotoId: "photo-1",
        })
      );

      act(() => {
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown" }));
      });

      expect(defaultProps.setFocusedPhotoId).toHaveBeenCalledWith("photo-2");
    });

    it("should move focus up", () => {
      renderHook(() =>
        useKeyboardShortcuts({
          ...defaultProps,
          focusedPhotoId: "photo-2",
        })
      );

      act(() => {
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp" }));
      });

      expect(defaultProps.setFocusedPhotoId).toHaveBeenCalledWith("photo-1");
    });

    it("should not go below last photo", () => {
      renderHook(() =>
        useKeyboardShortcuts({
          ...defaultProps,
          focusedPhotoId: "photo-3",
        })
      );

      act(() => {
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown" }));
      });

      expect(defaultProps.setFocusedPhotoId).toHaveBeenCalledWith("photo-3");
    });

    it("should not go above first photo", () => {
      renderHook(() =>
        useKeyboardShortcuts({
          ...defaultProps,
          focusedPhotoId: "photo-1",
        })
      );

      act(() => {
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp" }));
      });

      expect(defaultProps.setFocusedPhotoId).toHaveBeenCalledWith("photo-1");
    });
  });

  describe("preview", () => {
    it("should open preview on Enter", () => {
      renderHook(() =>
        useKeyboardShortcuts({
          ...defaultProps,
          focusedPhotoId: "photo-1",
        })
      );

      act(() => {
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
      });

      expect(defaultProps.onPreview).toHaveBeenCalledWith(defaultProps.photos[0]);
    });

    it("should not open preview when no photo is focused", () => {
      renderHook(() => useKeyboardShortcuts(defaultProps));

      act(() => {
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
      });

      expect(defaultProps.onPreview).not.toHaveBeenCalled();
    });

    it("should close preview on Escape", () => {
      renderHook(() =>
        useKeyboardShortcuts({
          ...defaultProps,
          isPreviewOpen: true,
        })
      );

      act(() => {
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
      });

      expect(defaultProps.onClosePreview).toHaveBeenCalled();
    });
  });

  describe("selection", () => {
    it("should toggle selection on Space", () => {
      renderHook(() =>
        useKeyboardShortcuts({
          ...defaultProps,
          focusedPhotoId: "photo-1",
        })
      );

      act(() => {
        window.dispatchEvent(new KeyboardEvent("keydown", { key: " " }));
      });

      expect(defaultProps.toggleSelection).toHaveBeenCalledWith("photo-1");
    });

    it("should select all on Cmd+A", () => {
      renderHook(() => useKeyboardShortcuts(defaultProps));

      act(() => {
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "a", metaKey: true }));
      });

      expect(defaultProps.selectAll).toHaveBeenCalledWith(defaultProps.photos);
    });

    it("should clear selection on Escape when no focus but has selection", () => {
      renderHook(() =>
        useKeyboardShortcuts({
          ...defaultProps,
          selectedIds: new Set(["photo-1", "photo-2"]),
        })
      );

      act(() => {
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
      });

      expect(defaultProps.clearSelection).toHaveBeenCalled();
    });

    it("should clear focus on Escape when focused", () => {
      renderHook(() =>
        useKeyboardShortcuts({
          ...defaultProps,
          focusedPhotoId: "photo-1",
        })
      );

      act(() => {
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
      });

      expect(defaultProps.setFocusedPhotoId).toHaveBeenCalledWith(null);
    });
  });

  describe("actions", () => {
    it("should approve focused photo on A key", () => {
      renderHook(() =>
        useKeyboardShortcuts({
          ...defaultProps,
          focusedPhotoId: "photo-1",
        })
      );

      act(() => {
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "a" }));
      });

      expect(defaultProps.onAction).toHaveBeenCalledWith("photo-1", "approve");
    });

    it("should reject focused photo on R key", () => {
      renderHook(() =>
        useKeyboardShortcuts({
          ...defaultProps,
          focusedPhotoId: "photo-1",
        })
      );

      act(() => {
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "r" }));
      });

      expect(defaultProps.onAction).toHaveBeenCalledWith("photo-1", "reject");
    });

    it("should retry failed photo on T key", () => {
      const failedPhoto = createPhoto({ id: "photo-1", status: "FAILED" });
      renderHook(() =>
        useKeyboardShortcuts({
          ...defaultProps,
          photos: [failedPhoto],
          focusedPhotoId: "photo-1",
        })
      );

      act(() => {
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "t" }));
      });

      expect(defaultProps.onAction).toHaveBeenCalledWith("photo-1", "retry");
    });

    it("should not retry non-failed photo", () => {
      renderHook(() =>
        useKeyboardShortcuts({
          ...defaultProps,
          focusedPhotoId: "photo-1",
        })
      );

      act(() => {
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "t" }));
      });

      expect(defaultProps.onAction).not.toHaveBeenCalled();
    });

    it("should bulk approve selected photos on A key", () => {
      renderHook(() =>
        useKeyboardShortcuts({
          ...defaultProps,
          selectedIds: new Set(["photo-1", "photo-2"]),
        })
      );

      act(() => {
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "a" }));
      });

      expect(defaultProps.onBulkAction).toHaveBeenCalledWith(
        expect.arrayContaining(["photo-1", "photo-2"]),
        "approve"
      );
    });

    it("should bulk reject selected photos on R key", () => {
      renderHook(() =>
        useKeyboardShortcuts({
          ...defaultProps,
          selectedIds: new Set(["photo-1", "photo-2"]),
        })
      );

      act(() => {
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "r" }));
      });

      expect(defaultProps.onBulkAction).toHaveBeenCalledWith(
        expect.arrayContaining(["photo-1", "photo-2"]),
        "reject"
      );
    });
  });

  describe("help", () => {
    it("should show help on ? key", () => {
      renderHook(() => useKeyboardShortcuts(defaultProps));

      act(() => {
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "?" }));
      });

      expect(defaultProps.showHelp).toHaveBeenCalled();
    });
  });

  describe("disabled state", () => {
    it("should not respond to keys when disabled", () => {
      renderHook(() =>
        useKeyboardShortcuts({
          ...defaultProps,
          enabled: false,
        })
      );

      act(() => {
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown" }));
      });

      expect(defaultProps.setFocusedPhotoId).not.toHaveBeenCalled();
    });
  });

  describe("input handling", () => {
    it("should not trigger shortcuts when typing in input", () => {
      renderHook(() =>
        useKeyboardShortcuts({
          ...defaultProps,
          focusedPhotoId: "photo-1",
        })
      );

      // Create a mock input element
      const input = document.createElement("input");
      document.body.appendChild(input);
      input.focus();

      act(() => {
        const event = new KeyboardEvent("keydown", { key: "a" });
        Object.defineProperty(event, "target", { value: input });
        window.dispatchEvent(event);
      });

      expect(defaultProps.onAction).not.toHaveBeenCalled();

      document.body.removeChild(input);
    });
  });

  describe("focusedPhoto return value", () => {
    it("should return focused photo", () => {
      const { result } = renderHook(() =>
        useKeyboardShortcuts({
          ...defaultProps,
          focusedPhotoId: "photo-2",
        })
      );

      expect(result.current.focusedPhoto).toEqual(defaultProps.photos[1]);
    });

    it("should return null when no photo is focused", () => {
      const { result } = renderHook(() => useKeyboardShortcuts(defaultProps));

      expect(result.current.focusedPhoto).toBeNull();
    });
  });
});
