import { describe, it, expect, vi, beforeEach } from "vitest";
import { photoClient, eventClient, seedClient } from "./client";

describe("photoClient", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("getPhotos", () => {
    it("should fetch all photos without status filter", async () => {
      const mockPhotos = { items: [{ id: "1", filename: "test.jpg" }] };
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockPhotos),
      } as Response);

      const result = await photoClient.getPhotos();

      expect(fetch).toHaveBeenCalledWith(
        "http://localhost:8080/api/photos",
        expect.objectContaining({
          headers: { "Content-Type": "application/json" },
        })
      );
      expect(result).toEqual(mockPhotos);
    });

    it("should fetch photos with status filter", async () => {
      const mockPhotos = { items: [] };
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockPhotos),
      } as Response);

      await photoClient.getPhotos("PENDING");

      expect(fetch).toHaveBeenCalledWith(
        "http://localhost:8080/api/photos?status=PENDING",
        expect.any(Object)
      );
    });

    it("should throw error on failed request", async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      } as Response);

      await expect(photoClient.getPhotos()).rejects.toThrow(
        "API error: 500 Internal Server Error"
      );
    });
  });

  describe("getPhotoById", () => {
    it("should fetch a single photo by ID", async () => {
      const mockPhoto = { id: "123", filename: "test.jpg" };
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockPhoto),
      } as Response);

      const result = await photoClient.getPhotoById("123");

      expect(fetch).toHaveBeenCalledWith(
        "http://localhost:8080/api/photos/123",
        expect.any(Object)
      );
      expect(result).toEqual(mockPhoto);
    });
  });

  describe("performAction", () => {
    it("should send approve action", async () => {
      const mockPhoto = { id: "123", status: "APPROVED" };
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockPhoto),
      } as Response);

      const result = await photoClient.performAction("123", "approve");

      expect(fetch).toHaveBeenCalledWith(
        "http://localhost:8080/api/photos/123/action",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ action: "approve" }),
        })
      );
      expect(result).toEqual(mockPhoto);
    });

    it("should send reject action", async () => {
      const mockPhoto = { id: "123", status: "REJECTED" };
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockPhoto),
      } as Response);

      await photoClient.performAction("123", "reject");

      expect(fetch).toHaveBeenCalledWith(
        "http://localhost:8080/api/photos/123/action",
        expect.objectContaining({
          body: JSON.stringify({ action: "reject" }),
        })
      );
    });

    it("should send retry action", async () => {
      const mockPhoto = { id: "123", status: "PENDING" };
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockPhoto),
      } as Response);

      await photoClient.performAction("123", "retry");

      expect(fetch).toHaveBeenCalledWith(
        "http://localhost:8080/api/photos/123/action",
        expect.objectContaining({
          body: JSON.stringify({ action: "retry" }),
        })
      );
    });
  });

  describe("deletePhoto", () => {
    it("should delete a photo", async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
      } as Response);

      await photoClient.deletePhoto("123");

      expect(fetch).toHaveBeenCalledWith(
        "http://localhost:8080/api/photos/123",
        expect.objectContaining({ method: "DELETE" })
      );
    });

    it("should throw error on failed delete", async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as Response);

      await expect(photoClient.deletePhoto("123")).rejects.toThrow(
        "Failed to delete photo: 404"
      );
    });
  });

  describe("getStatusCounts", () => {
    it("should fetch status counts", async () => {
      const mockCounts = [
        { status: "PENDING", count: 5 },
        { status: "PROCESSED", count: 10 },
      ];
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockCounts),
      } as Response);

      const result = await photoClient.getStatusCounts();

      expect(fetch).toHaveBeenCalledWith(
        "http://localhost:8080/api/photos/counts",
        expect.any(Object)
      );
      expect(result).toEqual(mockCounts);
    });
  });

  describe("performBulkAction", () => {
    it("should perform bulk action on multiple photos", async () => {
      const mockResponse = {
        success: [{ id: "1" }, { id: "2" }],
        errors: [],
      };
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const result = await photoClient.performBulkAction(["1", "2"], "approve");

      expect(fetch).toHaveBeenCalledWith(
        "http://localhost:8080/api/photos/bulk-action",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ ids: ["1", "2"], action: "approve" }),
        })
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe("getPhotoContentUrl", () => {
    it("should return the correct content URL", () => {
      const url = photoClient.getPhotoContentUrl("abc-123");
      expect(url).toBe("http://localhost:8080/api/photos/abc-123/content");
    });
  });
});

describe("eventClient", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("getEvents", () => {
    it("should fetch all events without params", async () => {
      const mockEvents = { items: [] };
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockEvents),
      } as Response);

      await eventClient.getEvents();

      expect(fetch).toHaveBeenCalledWith(
        "http://localhost:8080/api/events",
        expect.any(Object)
      );
    });

    it("should fetch events with photoId filter", async () => {
      const mockEvents = { items: [] };
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockEvents),
      } as Response);

      await eventClient.getEvents({ photoId: "123" });

      expect(fetch).toHaveBeenCalledWith(
        "http://localhost:8080/api/events?photoId=123",
        expect.any(Object)
      );
    });

    it("should fetch events with limit", async () => {
      const mockEvents = { items: [] };
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockEvents),
      } as Response);

      await eventClient.getEvents({ limit: 50 });

      expect(fetch).toHaveBeenCalledWith(
        "http://localhost:8080/api/events?limit=50",
        expect.any(Object)
      );
    });
  });
});

describe("seedClient", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("seedData", () => {
    it("should POST to seed endpoint", async () => {
      const mockPhotos = { items: [] };
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockPhotos),
      } as Response);

      await seedClient.seedData();

      expect(fetch).toHaveBeenCalledWith(
        "http://localhost:8080/api/seed",
        expect.objectContaining({ method: "POST" })
      );
    });
  });

  describe("clearData", () => {
    it("should DELETE to seed endpoint", async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
      } as Response);

      await seedClient.clearData();

      expect(fetch).toHaveBeenCalledWith("http://localhost:8080/api/seed", {
        method: "DELETE",
      });
    });
  });
});
