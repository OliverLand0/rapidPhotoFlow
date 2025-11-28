import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
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

  const renderWithRouter = (ui: React.ReactElement) => {
    return render(<MemoryRouter>{ui}</MemoryRouter>);
  };

  it("should display all status counts", () => {
    const photos: Photo[] = [
      createPhoto("1", "PROCESSED"),
      createPhoto("2", "PROCESSED"),
      createPhoto("3", "FAILED"),
      createPhoto("4", "APPROVED"),
      createPhoto("5", "REJECTED"),
    ];

    renderWithRouter(
      <StatusSummaryBar photos={photos} lastUpdated={new Date("2024-01-15T11:50:00Z")} />
    );

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

    renderWithRouter(
      <StatusSummaryBar photos={photos} lastUpdated={new Date()} />
    );

    expect(screen.getByText(/Total:/)).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("should display zero counts when no photos", () => {
    renderWithRouter(
      <StatusSummaryBar photos={[]} lastUpdated={new Date()} />
    );

    expect(screen.getByText(/Total:/)).toBeInTheDocument();
  });

  it("should display last updated time", () => {
    renderWithRouter(
      <StatusSummaryBar
        photos={[]}
        lastUpdated={new Date("2024-01-15T11:55:00Z")}
      />
    );

    expect(screen.getByText(/Updated 5m ago/)).toBeInTheDocument();
  });

  it("should render links for all linkable statuses", () => {
    renderWithRouter(
      <StatusSummaryBar photos={[]} lastUpdated={new Date()} />
    );

    // Check that all review-eligible statuses have links (even with 0 count)
    const readyLink = screen.getByRole("link", { name: /Ready:/ });
    expect(readyLink).toHaveAttribute("href", "/review?status=PROCESSED");

    const failedLink = screen.getByRole("link", { name: /Failed:/ });
    expect(failedLink).toHaveAttribute("href", "/review?status=FAILED");

    const approvedLink = screen.getByRole("link", { name: /Approved:/ });
    expect(approvedLink).toHaveAttribute("href", "/review?status=APPROVED");

    const rejectedLink = screen.getByRole("link", { name: /Rejected:/ });
    expect(rejectedLink).toHaveAttribute("href", "/review?status=REJECTED");

    const totalLink = screen.getByRole("link", { name: /Total:/ });
    expect(totalLink).toHaveAttribute("href", "/review");
  });
});
