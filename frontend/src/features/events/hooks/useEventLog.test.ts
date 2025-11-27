import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useEventLog } from "./useEventLog";
import { eventClient } from "../../../lib/api/client";
import type { EventLog } from "../../../lib/api/types";

vi.mock("../../../lib/api/client", () => ({
  eventClient: {
    getEvents: vi.fn(),
  },
}));

const createEvent = (id: string, type: string = "PHOTO_CREATED"): EventLog => ({
  id,
  type: type as EventLog["type"],
  photoId: "photo-1",
  message: "Test event",
  timestamp: "2024-01-15T10:00:00Z",
});

describe("useEventLog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should start with loading state true", () => {
    vi.mocked(eventClient.getEvents).mockResolvedValue({ items: [] });

    const { result } = renderHook(() => useEventLog({ enabled: false }));

    expect(result.current.isLoading).toBe(true);
  });

  it("should not fetch when disabled", () => {
    vi.mocked(eventClient.getEvents).mockResolvedValue({ items: [] });

    renderHook(() => useEventLog({ enabled: false }));

    expect(eventClient.getEvents).not.toHaveBeenCalled();
  });

  it("should have empty events initially", () => {
    vi.mocked(eventClient.getEvents).mockResolvedValue({ items: [] });

    const { result } = renderHook(() => useEventLog({ enabled: false }));

    expect(result.current.events).toEqual([]);
  });

  it("should have error as null initially", () => {
    vi.mocked(eventClient.getEvents).mockResolvedValue({ items: [] });

    const { result } = renderHook(() => useEventLog({ enabled: false }));

    expect(result.current.error).toBe(null);
  });

  it("should have refresh function available", () => {
    vi.mocked(eventClient.getEvents).mockResolvedValue({ items: [] });

    const { result } = renderHook(() => useEventLog({ enabled: false }));

    expect(typeof result.current.refresh).toBe("function");
  });

  it("should call getEvents with correct params when refreshing", async () => {
    vi.mocked(eventClient.getEvents).mockResolvedValue({ items: [] });

    const { result } = renderHook(() =>
      useEventLog({ enabled: false, photoId: "test-123", limit: 25 })
    );

    await act(async () => {
      await result.current.refresh();
    });

    expect(eventClient.getEvents).toHaveBeenCalledWith({
      photoId: "test-123",
      limit: 25,
    });
  });

  it("should update events after refresh", async () => {
    const mockEvents = [createEvent("1"), createEvent("2")];
    vi.mocked(eventClient.getEvents).mockResolvedValue({ items: mockEvents });

    const { result } = renderHook(() => useEventLog({ enabled: false }));

    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.events).toEqual(mockEvents);
    expect(result.current.isLoading).toBe(false);
  });

  it("should set error on fetch failure", async () => {
    const error = new Error("Network error");
    vi.mocked(eventClient.getEvents).mockRejectedValue(error);

    const { result } = renderHook(() => useEventLog({ enabled: false }));

    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.error).toBe(error);
    expect(result.current.isLoading).toBe(false);
  });

  it("should clear error on successful fetch", async () => {
    const error = new Error("Network error");
    vi.mocked(eventClient.getEvents).mockRejectedValueOnce(error);

    const { result } = renderHook(() => useEventLog({ enabled: false }));

    // First refresh fails
    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.error).toBe(error);

    // Second refresh succeeds
    vi.mocked(eventClient.getEvents).mockResolvedValue({ items: [] });

    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.error).toBe(null);
  });

  it("should use default limit of 50", async () => {
    vi.mocked(eventClient.getEvents).mockResolvedValue({ items: [] });

    const { result } = renderHook(() => useEventLog({ enabled: false }));

    await act(async () => {
      await result.current.refresh();
    });

    expect(eventClient.getEvents).toHaveBeenCalledWith({
      photoId: undefined,
      limit: 50,
    });
  });
});
