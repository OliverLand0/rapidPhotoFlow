import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SavedViewsDropdown } from "./SavedViewsDropdown";
import type { SavedView } from "../../lib/api/types";

const createView = (overrides: Partial<SavedView> = {}): SavedView => ({
  id: "view-1",
  name: "Test View",
  createdAt: "2024-01-15T10:00:00Z",
  filters: {
    search: "",
    status: "all",
    sort: "newest",
  },
  ...overrides,
});

describe("SavedViewsDropdown", () => {
  const presetViews = [
    createView({ id: "preset-failures", name: "Recent Failures", filters: { search: "", status: "FAILED", sort: "newest" } }),
    createView({ id: "preset-approved", name: "Approved", filters: { search: "", status: "APPROVED", sort: "newest" } }),
  ];

  const userViews = [
    createView({ id: "user-1", name: "My Custom View", filters: { search: "test", status: "PROCESSED", sort: "oldest" } }),
  ];

  const defaultProps = {
    views: [...presetViews, ...userViews],
    presetViews,
    userViews,
    currentFilters: {
      search: "",
      status: "all" as const,
      sort: "newest" as const,
    },
    onSelectView: vi.fn(),
    onCreateView: vi.fn(),
    onDeleteView: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("should render the dropdown button", () => {
      render(<SavedViewsDropdown {...defaultProps} />);

      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("should show Views text when no active view", () => {
      render(<SavedViewsDropdown {...defaultProps} />);

      expect(screen.getByText("Views")).toBeInTheDocument();
    });
  });

  describe("dropdown behavior", () => {
    it("should open dropdown on button click", async () => {
      const user = userEvent.setup();
      render(<SavedViewsDropdown {...defaultProps} />);

      await user.click(screen.getByRole("button"));

      expect(screen.getByText("Quick Views")).toBeInTheDocument();
    });

    it("should close dropdown when clicking outside", async () => {
      const user = userEvent.setup();
      render(
        <div>
          <SavedViewsDropdown {...defaultProps} />
          <button data-testid="outside">Outside</button>
        </div>
      );

      await user.click(screen.getByRole("button", { name: /views/i }));
      expect(screen.getByText("Quick Views")).toBeInTheDocument();

      fireEvent.mouseDown(screen.getByTestId("outside"));

      await waitFor(() => {
        expect(screen.queryByText("Quick Views")).not.toBeInTheDocument();
      });
    });
  });

  describe("preset views", () => {
    it("should display preset views", async () => {
      const user = userEvent.setup();
      render(<SavedViewsDropdown {...defaultProps} />);

      await user.click(screen.getByRole("button"));

      expect(screen.getByText("Recent Failures")).toBeInTheDocument();
      expect(screen.getByText("Approved")).toBeInTheDocument();
    });

    it("should call onSelectView when clicking a preset view", async () => {
      const user = userEvent.setup();
      render(<SavedViewsDropdown {...defaultProps} />);

      await user.click(screen.getByRole("button"));
      await user.click(screen.getByText("Recent Failures"));

      expect(defaultProps.onSelectView).toHaveBeenCalledWith(presetViews[0]);
    });

    it("should close dropdown after selecting a view", async () => {
      const user = userEvent.setup();
      render(<SavedViewsDropdown {...defaultProps} />);

      await user.click(screen.getByRole("button"));
      await user.click(screen.getByText("Recent Failures"));

      await waitFor(() => {
        expect(screen.queryByText("Quick Views")).not.toBeInTheDocument();
      });
    });
  });

  describe("user views", () => {
    it("should display user views section", async () => {
      const user = userEvent.setup();
      render(<SavedViewsDropdown {...defaultProps} />);

      await user.click(screen.getByRole("button"));

      expect(screen.getByText("My Views")).toBeInTheDocument();
      expect(screen.getByText("My Custom View")).toBeInTheDocument();
    });

    it("should call onSelectView when clicking a user view", async () => {
      const user = userEvent.setup();
      render(<SavedViewsDropdown {...defaultProps} />);

      await user.click(screen.getByRole("button"));
      await user.click(screen.getByText("My Custom View"));

      expect(defaultProps.onSelectView).toHaveBeenCalledWith(userViews[0]);
    });

    it("should not show My Views section when no user views", async () => {
      const user = userEvent.setup();
      render(<SavedViewsDropdown {...defaultProps} userViews={[]} />);

      await user.click(screen.getByRole("button"));

      expect(screen.queryByText("My Views")).not.toBeInTheDocument();
    });
  });

  describe("creating views", () => {
    it("should show 'Save current view' button", async () => {
      const user = userEvent.setup();
      render(<SavedViewsDropdown {...defaultProps} />);

      await user.click(screen.getByRole("button"));

      expect(screen.getByText("Save current view")).toBeInTheDocument();
    });

    it("should show input when clicking 'Save current view'", async () => {
      const user = userEvent.setup();
      render(<SavedViewsDropdown {...defaultProps} />);

      await user.click(screen.getByRole("button"));
      await user.click(screen.getByText("Save current view"));

      expect(screen.getByPlaceholderText("View name...")).toBeInTheDocument();
    });

    it("should create view on Enter", async () => {
      const user = userEvent.setup();
      render(<SavedViewsDropdown {...defaultProps} />);

      await user.click(screen.getByRole("button"));
      await user.click(screen.getByText("Save current view"));
      await user.type(screen.getByPlaceholderText("View name..."), "New View{enter}");

      expect(defaultProps.onCreateView).toHaveBeenCalledWith("New View");
    });

    it("should cancel create mode on Escape", async () => {
      const user = userEvent.setup();
      render(<SavedViewsDropdown {...defaultProps} />);

      await user.click(screen.getByRole("button"));
      await user.click(screen.getByText("Save current view"));
      await user.keyboard("{Escape}");

      expect(screen.getByText("Save current view")).toBeInTheDocument();
      expect(screen.queryByPlaceholderText("View name...")).not.toBeInTheDocument();
    });

    it("should not create view with empty name", async () => {
      const user = userEvent.setup();
      render(<SavedViewsDropdown {...defaultProps} />);

      await user.click(screen.getByRole("button"));
      await user.click(screen.getByText("Save current view"));
      await user.type(screen.getByPlaceholderText("View name..."), "   {enter}");

      expect(defaultProps.onCreateView).not.toHaveBeenCalled();
    });
  });

  describe("active view indication", () => {
    it("should show active view name in button when filters match", () => {
      const activeFilters = {
        search: "",
        status: "FAILED" as const,
        sort: "newest" as const,
      };

      render(
        <SavedViewsDropdown
          {...defaultProps}
          currentFilters={activeFilters}
        />
      );

      expect(screen.getByText("Recent Failures")).toBeInTheDocument();
    });
  });
});
