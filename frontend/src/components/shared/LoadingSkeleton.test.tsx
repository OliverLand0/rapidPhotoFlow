import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  Skeleton,
  TableRowSkeleton,
  PhotoCardSkeleton,
  TableSkeleton,
} from "./LoadingSkeleton";

describe("Skeleton", () => {
  it("should render with default classes", () => {
    render(<Skeleton />);
    const skeleton = document.querySelector(".animate-pulse");
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveClass("rounded-md", "bg-muted");
  });

  it("should apply custom className", () => {
    render(<Skeleton className="h-4 w-32" />);
    const skeleton = document.querySelector(".animate-pulse");
    expect(skeleton).toHaveClass("h-4", "w-32");
  });
});

describe("TableRowSkeleton", () => {
  it("should render a table row with skeleton cells", () => {
    render(
      <table>
        <tbody>
          <TableRowSkeleton />
        </tbody>
      </table>
    );

    const row = screen.getByRole("row");
    expect(row).toBeInTheDocument();

    const cells = screen.getAllByRole("cell");
    expect(cells).toHaveLength(3);
  });
});

describe("PhotoCardSkeleton", () => {
  it("should render skeleton elements for photo card", () => {
    render(<PhotoCardSkeleton />);

    const skeletons = document.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });
});

describe("TableSkeleton", () => {
  it("should render default number of rows (5)", () => {
    render(<TableSkeleton />);

    const rows = screen.getAllByRole("row");
    // 1 header row + 5 body rows = 6 rows
    expect(rows).toHaveLength(6);
  });

  it("should render custom number of rows", () => {
    render(<TableSkeleton rows={3} />);

    const rows = screen.getAllByRole("row");
    // 1 header row + 3 body rows = 4 rows
    expect(rows).toHaveLength(4);
  });

  it("should render table header", () => {
    render(<TableSkeleton rows={1} />);

    const headerCells = screen.getAllByRole("columnheader");
    expect(headerCells).toHaveLength(3);
  });
});
