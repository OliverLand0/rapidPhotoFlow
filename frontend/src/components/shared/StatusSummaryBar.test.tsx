import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusSummaryBar } from "./StatusSummaryBar";
import type { Photo } from "../../lib/api/types";

describe("StatusSummaryBar", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-15T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

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

  it("should display all status counts", () => {
    const photos: Photo[] = [
      createPhoto("1", "PENDING"),
      createPhoto("2", "PENDING"),
      createPhoto("3", "PROCESSING"),
      createPhoto("4", "PROCESSED"),
      createPhoto("5", "FAILED"),
      createPhoto("6", "APPROVED"),
      createPhoto("7", "REJECTED"),
    ];

    render(
      <StatusSummaryBar photos={photos} lastUpdated={new Date("2024-01-15T11:50:00Z")} />
    );

    expect(screen.getByText(/Pending:/)).toBeInTheDocument();
    expect(screen.getByText(/Processing:/)).toBeInTheDocument();
    expect(screen.getByText(/Ready:/)).toBeInTheDocument();
    expect(screen.getByText(/Failed:/)).toBeInTheDocument();
    expect(screen.getByText(/Approved:/)).toBeInTheDocument();
    expect(screen.getByText(/Rejected:/)).toBeInTheDocument();
  });

  it("should display correct total count", () => {
    const photos: Photo[] = [
      createPhoto("1", "PENDING"),
      createPhoto("2", "PROCESSED"),
      createPhoto("3", "APPROVED"),
    ];

    render(
      <StatusSummaryBar photos={photos} lastUpdated={new Date()} />
    );

    expect(screen.getByText(/Total:/)).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("should display zero counts when no photos", () => {
    render(
      <StatusSummaryBar photos={[]} lastUpdated={new Date()} />
    );

    expect(screen.getByText(/Total:/)).toBeInTheDocument();
  });

  it("should display last updated time", () => {
    render(
      <StatusSummaryBar
        photos={[]}
        lastUpdated={new Date("2024-01-15T11:55:00Z")}
      />
    );

    expect(screen.getByText(/Updated 5m ago/)).toBeInTheDocument();
  });
});
