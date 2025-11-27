import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PhotoFilters } from "./PhotoFilters";

describe("PhotoFilters", () => {
  const defaultProps = {
    search: "",
    onSearchChange: vi.fn(),
    selectedTags: [] as string[],
    onTagsChange: vi.fn(),
    sortBy: "newest" as const,
    onSortChange: vi.fn(),
    hasActiveFilters: false,
    onClear: vi.fn(),
    resultCount: 10,
  };

  it("should render search input", () => {
    render(<PhotoFilters {...defaultProps} />);

    expect(screen.getByPlaceholderText("Search by filename or tag...")).toBeInTheDocument();
  });

  it("should render sort select", () => {
    render(<PhotoFilters {...defaultProps} />);

    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("should display search value", () => {
    render(<PhotoFilters {...defaultProps} search="beach" />);

    expect(screen.getByPlaceholderText("Search by filename or tag...")).toHaveValue("beach");
  });

  it("should call onSearchChange when typing in search", async () => {
    const user = userEvent.setup();
    const handleSearchChange = vi.fn();

    render(<PhotoFilters {...defaultProps} onSearchChange={handleSearchChange} />);

    await user.type(screen.getByPlaceholderText("Search by filename or tag..."), "test");

    expect(handleSearchChange).toHaveBeenCalled();
  });

  it("should call onSortChange when sort option changes", async () => {
    const user = userEvent.setup();
    const handleSortChange = vi.fn();

    render(<PhotoFilters {...defaultProps} onSortChange={handleSortChange} />);

    await user.selectOptions(screen.getByRole("combobox"), "oldest");

    expect(handleSortChange).toHaveBeenCalled();
  });

  it("should show clear button when hasActiveFilters is true", () => {
    render(<PhotoFilters {...defaultProps} hasActiveFilters />);

    expect(screen.getByRole("button", { name: /clear/i })).toBeInTheDocument();
  });

  it("should not show clear button when hasActiveFilters is false", () => {
    render(<PhotoFilters {...defaultProps} hasActiveFilters={false} />);

    expect(screen.queryByRole("button", { name: /clear/i })).not.toBeInTheDocument();
  });

  it("should call onClear when clear button is clicked", async () => {
    const user = userEvent.setup();
    const handleClear = vi.fn();

    render(<PhotoFilters {...defaultProps} hasActiveFilters onClear={handleClear} />);

    await user.click(screen.getByRole("button", { name: /clear/i }));

    expect(handleClear).toHaveBeenCalledOnce();
  });

  it("should display result count (singular)", () => {
    render(<PhotoFilters {...defaultProps} resultCount={1} />);

    expect(screen.getByText("1 photo")).toBeInTheDocument();
  });

  it("should display result count (plural)", () => {
    render(<PhotoFilters {...defaultProps} resultCount={10} />);

    expect(screen.getByText("10 photos")).toBeInTheDocument();
  });

  it("should display zero count", () => {
    render(<PhotoFilters {...defaultProps} resultCount={0} />);

    expect(screen.getByText("0 photos")).toBeInTheDocument();
  });

  it("should render all sort options", () => {
    render(<PhotoFilters {...defaultProps} />);

    const select = screen.getByRole("combobox");
    expect(select).toContainHTML("Newest first");
    expect(select).toContainHTML("Oldest first");
    expect(select).toContainHTML("By status");
  });
});
