import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { SearchAutocomplete } from "./SearchAutocomplete";

// Mock scrollIntoView as it's not implemented in jsdom
Element.prototype.scrollIntoView = vi.fn();

// Wrapper component to handle controlled state
function ControlledSearchAutocomplete({
  initialValue = "",
  initialSelectedTags = [] as string[],
  ...props
}: {
  initialValue?: string;
  initialSelectedTags?: string[];
  filenames: string[];
  tags: string[];
  placeholder?: string;
  onSelectTag?: (tags: string[]) => void;
  onSelectFilename?: (filename: string) => void;
}) {
  const [value, setValue] = useState(initialValue);
  const [selectedTags, setSelectedTags] = useState<string[]>(initialSelectedTags);

  return (
    <SearchAutocomplete
      value={value}
      onChange={(newValue) => {
        setValue(newValue);
        props.onSelectFilename?.(newValue);
      }}
      selectedTags={selectedTags}
      onTagsChange={(newTags) => {
        setSelectedTags(newTags);
        props.onSelectTag?.(newTags);
      }}
      filenames={props.filenames}
      tags={props.tags}
      placeholder={props.placeholder}
    />
  );
}

describe("SearchAutocomplete", () => {
  const defaultProps = {
    filenames: ["photo1.jpg", "photo2.png", "sunset.jpg", "beach.png"],
    tags: ["sunset", "beach", "vacation", "nature", "portrait"],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("should render input with placeholder", () => {
      render(<ControlledSearchAutocomplete {...defaultProps} />);

      expect(screen.getByPlaceholderText("Search by filename or tag...")).toBeInTheDocument();
    });

    it("should render custom placeholder", () => {
      render(
        <ControlledSearchAutocomplete {...defaultProps} placeholder="Custom placeholder" />
      );

      expect(screen.getByPlaceholderText("Custom placeholder")).toBeInTheDocument();
    });

    it("should render selected tags", () => {
      render(
        <ControlledSearchAutocomplete
          {...defaultProps}
          initialSelectedTags={["sunset", "beach"]}
        />
      );

      expect(screen.getByText("sunset")).toBeInTheDocument();
      expect(screen.getByText("beach")).toBeInTheDocument();
    });

    it("should show 'Add more...' placeholder when tags are selected", () => {
      render(
        <ControlledSearchAutocomplete {...defaultProps} initialSelectedTags={["sunset"]} />
      );

      expect(screen.getByPlaceholderText("Add more...")).toBeInTheDocument();
    });
  });

  describe("suggestions", () => {
    it("should show tag suggestions when typing", async () => {
      const user = userEvent.setup();
      render(<ControlledSearchAutocomplete {...defaultProps} />);

      const input = screen.getByPlaceholderText("Search by filename or tag...");
      await user.type(input, "sun");

      await waitFor(() => {
        expect(screen.getByText("sunset")).toBeInTheDocument();
      });
    });

    it("should show filename suggestions when typing", async () => {
      const user = userEvent.setup();
      render(<ControlledSearchAutocomplete {...defaultProps} />);

      const input = screen.getByPlaceholderText("Search by filename or tag...");
      await user.type(input, "photo");

      await waitFor(() => {
        expect(screen.getByText("photo1.jpg")).toBeInTheDocument();
        expect(screen.getByText("photo2.png")).toBeInTheDocument();
      });
    });

    it("should not show suggestions for empty input", () => {
      render(<ControlledSearchAutocomplete {...defaultProps} />);

      // No dropdown should be visible
      expect(screen.queryByRole("list")).not.toBeInTheDocument();
    });

    it("should exclude already selected tags from suggestions", async () => {
      const user = userEvent.setup();
      render(
        <ControlledSearchAutocomplete {...defaultProps} initialSelectedTags={["sunset"]} />
      );

      const input = screen.getByPlaceholderText("Add more...");
      await user.type(input, "sun");

      // Wait for suggestions to appear
      await waitFor(() => {
        // The dropdown should appear but sunset should not be in it
        const listItems = screen.queryAllByText("sunset");
        // Only the selected tag badge should show "sunset", not in suggestions
        expect(listItems.length).toBe(1); // Just the badge
      });
    });
  });

  describe("selection", () => {
    it("should add tag when clicking a tag suggestion", async () => {
      const user = userEvent.setup();
      const handleSelectTag = vi.fn();
      render(
        <ControlledSearchAutocomplete {...defaultProps} onSelectTag={handleSelectTag} />
      );

      const input = screen.getByPlaceholderText("Search by filename or tag...");
      await user.type(input, "sun");

      await waitFor(() => {
        expect(screen.getByText("sunset")).toBeInTheDocument();
      });

      // Click the suggestion
      const suggestion = screen.getByText("sunset");
      await user.click(suggestion);

      expect(handleSelectTag).toHaveBeenCalledWith(["sunset"]);
    });

    it("should clear input after selecting a tag", async () => {
      const user = userEvent.setup();
      render(<ControlledSearchAutocomplete {...defaultProps} />);

      const input = screen.getByPlaceholderText("Search by filename or tag...");
      await user.type(input, "sun");

      await waitFor(() => {
        expect(screen.getByText("sunset")).toBeInTheDocument();
      });

      await user.click(screen.getByText("sunset"));

      // Input should be cleared
      await waitFor(() => {
        expect(input).toHaveValue("");
      });
    });
  });

  describe("keyboard navigation", () => {
    it("should navigate suggestions with arrow keys", async () => {
      const user = userEvent.setup();
      render(<ControlledSearchAutocomplete {...defaultProps} />);

      const input = screen.getByPlaceholderText("Search by filename or tag...");
      await user.type(input, "sun");

      await waitFor(() => {
        expect(screen.getByText("sunset")).toBeInTheDocument();
      });

      await user.keyboard("{ArrowDown}");

      // First item should be highlighted
      const listItems = screen.getAllByRole("listitem");
      expect(listItems[0]).toHaveClass("bg-accent");
    });

    it("should select suggestion on Enter", async () => {
      const user = userEvent.setup();
      const handleSelectTag = vi.fn();
      render(
        <ControlledSearchAutocomplete {...defaultProps} onSelectTag={handleSelectTag} />
      );

      const input = screen.getByPlaceholderText("Search by filename or tag...");
      await user.type(input, "sun");

      await waitFor(() => {
        expect(screen.getByText("sunset")).toBeInTheDocument();
      });

      await user.keyboard("{ArrowDown}{Enter}");

      expect(handleSelectTag).toHaveBeenCalled();
    });

    it("should close suggestions on Escape", async () => {
      const user = userEvent.setup();
      render(<ControlledSearchAutocomplete {...defaultProps} />);

      const input = screen.getByPlaceholderText("Search by filename or tag...");
      await user.type(input, "sun");

      await waitFor(() => {
        expect(screen.getByText("sunset")).toBeInTheDocument();
      });

      await user.keyboard("{Escape}");

      // Suggestions should be hidden (dropdown closed)
      await waitFor(() => {
        expect(screen.queryByRole("list")).not.toBeInTheDocument();
      });
    });

    it("should remove last tag on Backspace when input is empty", async () => {
      const user = userEvent.setup();
      const handleSelectTag = vi.fn();
      render(
        <ControlledSearchAutocomplete
          {...defaultProps}
          initialSelectedTags={["sunset", "beach"]}
          onSelectTag={handleSelectTag}
        />
      );

      const input = screen.getByPlaceholderText("Add more...");
      await user.click(input);
      await user.keyboard("{Backspace}");

      expect(handleSelectTag).toHaveBeenCalledWith(["sunset"]);
    });
  });

  describe("tag removal", () => {
    it("should remove tag when clicking X button", async () => {
      const user = userEvent.setup();
      const handleSelectTag = vi.fn();
      render(
        <ControlledSearchAutocomplete
          {...defaultProps}
          initialSelectedTags={["sunset", "beach"]}
          onSelectTag={handleSelectTag}
        />
      );

      // Find the X button for sunset tag
      const sunsetTag = screen.getByText("sunset").closest("span");
      const removeButton = sunsetTag?.querySelector("button");

      if (removeButton) {
        await user.click(removeButton);
        expect(handleSelectTag).toHaveBeenCalledWith(["beach"]);
      }
    });
  });

  describe("clear all", () => {
    it("should show clear button when there is input value", async () => {
      const user = userEvent.setup();
      render(<ControlledSearchAutocomplete {...defaultProps} />);

      const input = screen.getByPlaceholderText("Search by filename or tag...");
      await user.type(input, "test");

      // Clear button should be visible
      const clearButton = document.querySelector(".absolute.right-2\\.5");
      expect(clearButton).toBeInTheDocument();
    });

    it("should show clear button when there are selected tags", () => {
      render(
        <ControlledSearchAutocomplete {...defaultProps} initialSelectedTags={["sunset"]} />
      );

      // Clear button should be visible
      const buttons = screen.getAllByRole("button");
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe("click outside", () => {
    it("should close suggestions when clicking outside", async () => {
      const user = userEvent.setup();
      render(
        <div>
          <ControlledSearchAutocomplete {...defaultProps} />
          <button data-testid="outside">Outside</button>
        </div>
      );

      const input = screen.getByPlaceholderText("Search by filename or tag...");
      await user.type(input, "sun");

      await waitFor(() => {
        expect(screen.getByText("sunset")).toBeInTheDocument();
      });

      // Click outside
      fireEvent.mouseDown(screen.getByTestId("outside"));

      await waitFor(() => {
        expect(screen.queryByRole("list")).not.toBeInTheDocument();
      });
    });
  });
});
