import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { compressImage, compressImages } from "./imageUtils";

describe("compressImage", () => {
  let mockDrawImage: ReturnType<typeof vi.fn>;
  let mockToBlob: ReturnType<typeof vi.fn>;
  let mockGetContext: ReturnType<typeof vi.fn>;
  let originalCreateElement: typeof document.createElement;
  let MockImageClass: typeof Image;
  let mockImageInstance: {
    src: string;
    onload: (() => void) | null;
    onerror: (() => void) | null;
    width: number;
    height: number;
  };

  beforeEach(() => {
    mockDrawImage = vi.fn();
    mockToBlob = vi.fn();
    mockGetContext = vi.fn(() => ({
      drawImage: mockDrawImage,
    }));

    originalCreateElement = document.createElement.bind(document);

    // Mock canvas
    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      if (tag === "canvas") {
        return {
          width: 0,
          height: 0,
          getContext: mockGetContext,
          toBlob: mockToBlob,
        } as unknown as HTMLCanvasElement;
      }
      return originalCreateElement(tag);
    });

    // Create a proper mock Image class
    mockImageInstance = {
      src: "",
      onload: null,
      onerror: null,
      width: 1000,
      height: 800,
    };

    MockImageClass = class {
      src = "";
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      width = mockImageInstance.width;
      height = mockImageInstance.height;

      constructor() {
        // Store reference for triggering callbacks
        setTimeout(() => {
          if (mockImageInstance.onerror) {
            this.onerror?.();
          } else if (this.onload) {
            this.onload();
          }
        }, 0);
      }
    } as unknown as typeof Image;

    vi.stubGlobal("Image", MockImageClass);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("should return non-image files unchanged", async () => {
    const file = new File(["test content"], "test.txt", {
      type: "text/plain",
    });

    const result = await compressImage(file);

    expect(result).toBe(file);
  });

  it("should return small image files unchanged (under 500KB)", async () => {
    const smallContent = new Uint8Array(100 * 1024); // 100KB
    const file = new File([smallContent], "small.jpg", {
      type: "image/jpeg",
    });

    const result = await compressImage(file);

    expect(result).toBe(file);
  });

  it("should process large image files and return compressed version", async () => {
    const largeContent = new Uint8Array(600 * 1024); // 600KB
    const file = new File([largeContent], "large.jpg", {
      type: "image/jpeg",
    });

    mockImageInstance.width = 1000;
    mockImageInstance.height = 800;
    mockImageInstance.onerror = null;

    // Mock toBlob to return a smaller blob
    mockToBlob.mockImplementation((callback: (blob: Blob | null) => void) => {
      const smallerBlob = new Blob([new Uint8Array(400 * 1024)], {
        type: "image/jpeg",
      });
      callback(smallerBlob);
    });

    const result = await compressImage(file);

    expect(result.name).toBe("large.jpg");
    expect(result.type).toBe("image/jpeg");
    expect(result.size).toBeLessThan(file.size);
  });

  it("should return original if compressed is larger", async () => {
    const content = new Uint8Array(600 * 1024); // 600KB
    const file = new File([content], "test.jpg", {
      type: "image/jpeg",
    });

    mockImageInstance.width = 500;
    mockImageInstance.height = 400;
    mockImageInstance.onerror = null;

    // Mock toBlob to return a larger blob
    mockToBlob.mockImplementation((callback: (blob: Blob | null) => void) => {
      const largerBlob = new Blob([new Uint8Array(700 * 1024)], {
        type: "image/jpeg",
      });
      callback(largerBlob);
    });

    const result = await compressImage(file);

    expect(result).toBe(file);
  });

  it("should return original if canvas context is null", async () => {
    mockGetContext.mockReturnValueOnce(null);

    const content = new Uint8Array(600 * 1024);
    const file = new File([content], "test.jpg", {
      type: "image/jpeg",
    });

    const result = await compressImage(file);

    expect(result).toBe(file);
  });

  it("should return original if toBlob returns null", async () => {
    const content = new Uint8Array(600 * 1024);
    const file = new File([content], "test.jpg", {
      type: "image/jpeg",
    });

    mockImageInstance.width = 1000;
    mockImageInstance.height = 800;
    mockImageInstance.onerror = null;

    mockToBlob.mockImplementation((callback: (blob: Blob | null) => void) => {
      callback(null);
    });

    const result = await compressImage(file);

    expect(result).toBe(file);
  });

  it("should return original on image load error", async () => {
    const content = new Uint8Array(600 * 1024);
    const file = new File([content], "test.jpg", {
      type: "image/jpeg",
    });

    // Set onerror to be triggered instead of onload
    mockImageInstance.onerror = () => {};

    const result = await compressImage(file);

    expect(result).toBe(file);
  });
});

describe("compressImages", () => {
  it("should process multiple files", async () => {
    const files = [
      new File(["a"], "a.txt", { type: "text/plain" }),
      new File(["b"], "b.txt", { type: "text/plain" }),
      new File(["c"], "c.txt", { type: "text/plain" }),
    ];

    const results = await compressImages(files);

    expect(results).toHaveLength(3);
    expect(results[0]).toBe(files[0]);
    expect(results[1]).toBe(files[1]);
    expect(results[2]).toBe(files[2]);
  });

  it("should call progress callback", async () => {
    const files = [
      new File(["a"], "a.txt", { type: "text/plain" }),
      new File(["b"], "b.txt", { type: "text/plain" }),
    ];
    const onProgress = vi.fn();

    await compressImages(files, onProgress);

    expect(onProgress).toHaveBeenCalledTimes(2);
    expect(onProgress).toHaveBeenCalledWith(1, 2);
    expect(onProgress).toHaveBeenCalledWith(2, 2);
  });

  it("should handle empty file array", async () => {
    const results = await compressImages([]);

    expect(results).toHaveLength(0);
  });
});
