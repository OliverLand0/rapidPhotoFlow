import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { cn, formatRelativeTime, formatFileSize, formatSpeed } from "./utils";

describe("cn", () => {
  it("should merge class names correctly", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("should handle conditional classes", () => {
    expect(cn("foo", false && "bar", "baz")).toBe("foo baz");
    expect(cn("foo", true && "bar", "baz")).toBe("foo bar baz");
  });

  it("should handle arrays", () => {
    expect(cn(["foo", "bar"])).toBe("foo bar");
  });

  it("should merge tailwind classes correctly", () => {
    expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });

  it("should handle undefined and null", () => {
    expect(cn("foo", undefined, null, "bar")).toBe("foo bar");
  });
});

describe("formatRelativeTime", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-15T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should return 'just now' for times within 5 seconds", () => {
    const date = new Date("2024-01-15T11:59:57Z");
    expect(formatRelativeTime(date)).toBe("just now");
  });

  it("should return seconds ago for times within a minute", () => {
    const date = new Date("2024-01-15T11:59:30Z");
    expect(formatRelativeTime(date)).toBe("30s ago");
  });

  it("should return minutes ago for times within an hour", () => {
    const date = new Date("2024-01-15T11:30:00Z");
    expect(formatRelativeTime(date)).toBe("30m ago");
  });

  it("should return hours ago for times within a day", () => {
    const date = new Date("2024-01-15T06:00:00Z");
    expect(formatRelativeTime(date)).toBe("6h ago");
  });

  it("should return days ago for times beyond a day", () => {
    const date = new Date("2024-01-13T12:00:00Z");
    expect(formatRelativeTime(date)).toBe("2d ago");
  });

  it("should handle string dates", () => {
    expect(formatRelativeTime("2024-01-15T11:59:57Z")).toBe("just now");
  });
});

describe("formatFileSize", () => {
  it("should format bytes correctly", () => {
    expect(formatFileSize(500)).toBe("500 B");
    expect(formatFileSize(0)).toBe("0 B");
    expect(formatFileSize(1023)).toBe("1023 B");
  });

  it("should format kilobytes correctly", () => {
    expect(formatFileSize(1024)).toBe("1.0 KB");
    expect(formatFileSize(1536)).toBe("1.5 KB");
    expect(formatFileSize(1024 * 500)).toBe("500.0 KB");
  });

  it("should format megabytes correctly", () => {
    expect(formatFileSize(1024 * 1024)).toBe("1.0 MB");
    expect(formatFileSize(1024 * 1024 * 2.5)).toBe("2.5 MB");
    expect(formatFileSize(1024 * 1024 * 100)).toBe("100.0 MB");
  });

  it("should format gigabytes correctly", () => {
    expect(formatFileSize(1024 * 1024 * 1024)).toBe("1.00 GB");
    expect(formatFileSize(1024 * 1024 * 1024 * 2.5)).toBe("2.50 GB");
  });
});

describe("formatSpeed", () => {
  it("should format bytes per second correctly", () => {
    expect(formatSpeed(500)).toBe("500 B/s");
    expect(formatSpeed(0)).toBe("0 B/s");
    expect(formatSpeed(1023)).toBe("1023 B/s");
  });

  it("should format kilobytes per second correctly", () => {
    expect(formatSpeed(1024)).toBe("1.0 KB/s");
    expect(formatSpeed(1536)).toBe("1.5 KB/s");
    expect(formatSpeed(1024 * 500)).toBe("500.0 KB/s");
  });

  it("should format megabytes per second correctly", () => {
    expect(formatSpeed(1024 * 1024)).toBe("1.0 MB/s");
    expect(formatSpeed(1024 * 1024 * 2.5)).toBe("2.5 MB/s");
    expect(formatSpeed(1024 * 1024 * 100)).toBe("100.0 MB/s");
  });

  it("should format gigabytes per second correctly", () => {
    expect(formatSpeed(1024 * 1024 * 1024)).toBe("1.00 GB/s");
    expect(formatSpeed(1024 * 1024 * 1024 * 2.5)).toBe("2.50 GB/s");
  });
});
