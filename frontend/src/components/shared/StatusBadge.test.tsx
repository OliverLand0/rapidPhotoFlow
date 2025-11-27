import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusBadge } from "./StatusBadge";

describe("StatusBadge", () => {
  it("should render PENDING status correctly", () => {
    render(<StatusBadge status="PENDING" />);
    expect(screen.getByText("Pending")).toBeInTheDocument();
  });

  it("should render PROCESSING status correctly", () => {
    render(<StatusBadge status="PROCESSING" />);
    expect(screen.getByText("Processing")).toBeInTheDocument();
  });

  it("should render PROCESSED status correctly", () => {
    render(<StatusBadge status="PROCESSED" />);
    expect(screen.getByText("Ready")).toBeInTheDocument();
  });

  it("should render FAILED status correctly", () => {
    render(<StatusBadge status="FAILED" />);
    expect(screen.getByText("Failed")).toBeInTheDocument();
  });

  it("should render APPROVED status correctly", () => {
    render(<StatusBadge status="APPROVED" />);
    expect(screen.getByText("Approved")).toBeInTheDocument();
  });

  it("should render REJECTED status correctly", () => {
    render(<StatusBadge status="REJECTED" />);
    expect(screen.getByText("Rejected")).toBeInTheDocument();
  });

  it("should apply custom className", () => {
    render(<StatusBadge status="PENDING" className="custom-class" />);
    const badge = screen.getByText("Pending").closest("div");
    expect(badge).toHaveClass("custom-class");
  });
});
