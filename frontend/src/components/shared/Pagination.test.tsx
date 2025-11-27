import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Pagination } from "./Pagination";

describe("Pagination", () => {
  it("should return null when totalItems <= pageSize", () => {
    const { container } = render(
      <Pagination
        currentPage={0}
        totalItems={10}
        pageSize={20}
        onPageChange={() => {}}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it("should display correct item range", () => {
    render(
      <Pagination
        currentPage={0}
        totalItems={100}
        pageSize={20}
        onPageChange={() => {}}
      />
    );

    expect(screen.getByText("Showing 1-20 of 100")).toBeInTheDocument();
  });

  it("should display correct item range for second page", () => {
    render(
      <Pagination
        currentPage={1}
        totalItems={100}
        pageSize={20}
        onPageChange={() => {}}
      />
    );

    expect(screen.getByText("Showing 21-40 of 100")).toBeInTheDocument();
  });

  it("should display correct item range for last page", () => {
    render(
      <Pagination
        currentPage={4}
        totalItems={95}
        pageSize={20}
        onPageChange={() => {}}
      />
    );

    expect(screen.getByText("Showing 81-95 of 95")).toBeInTheDocument();
  });

  it("should display correct page info", () => {
    render(
      <Pagination
        currentPage={2}
        totalItems={100}
        pageSize={20}
        onPageChange={() => {}}
      />
    );

    expect(screen.getByText("Page 3 of 5")).toBeInTheDocument();
  });

  it("should disable Prev button on first page", () => {
    render(
      <Pagination
        currentPage={0}
        totalItems={100}
        pageSize={20}
        onPageChange={() => {}}
      />
    );

    const prevButton = screen.getByRole("button", { name: /prev/i });
    expect(prevButton).toBeDisabled();
  });

  it("should disable Next button on last page", () => {
    render(
      <Pagination
        currentPage={4}
        totalItems={100}
        pageSize={20}
        onPageChange={() => {}}
      />
    );

    const nextButton = screen.getByRole("button", { name: /next/i });
    expect(nextButton).toBeDisabled();
  });

  it("should call onPageChange with previous page when Prev clicked", async () => {
    const user = userEvent.setup();
    const handlePageChange = vi.fn();

    render(
      <Pagination
        currentPage={2}
        totalItems={100}
        pageSize={20}
        onPageChange={handlePageChange}
      />
    );

    await user.click(screen.getByRole("button", { name: /prev/i }));
    expect(handlePageChange).toHaveBeenCalledWith(1);
  });

  it("should call onPageChange with next page when Next clicked", async () => {
    const user = userEvent.setup();
    const handlePageChange = vi.fn();

    render(
      <Pagination
        currentPage={2}
        totalItems={100}
        pageSize={20}
        onPageChange={handlePageChange}
      />
    );

    await user.click(screen.getByRole("button", { name: /next/i }));
    expect(handlePageChange).toHaveBeenCalledWith(3);
  });
});
