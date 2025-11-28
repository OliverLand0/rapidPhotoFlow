import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { KeyboardShortcutsModal } from "./KeyboardShortcutsModal";

describe("KeyboardShortcutsModal", () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("should not render when isOpen is false", () => {
      render(<KeyboardShortcutsModal isOpen={false} onClose={vi.fn()} />);

      expect(screen.queryByText("Keyboard Shortcuts")).not.toBeInTheDocument();
    });

    it("should render when isOpen is true", () => {
      render(<KeyboardShortcutsModal {...defaultProps} />);

      expect(screen.getByText("Keyboard Shortcuts")).toBeInTheDocument();
    });
  });

  describe("shortcut categories", () => {
    it("should display Navigation category", () => {
      render(<KeyboardShortcutsModal {...defaultProps} />);

      expect(screen.getByText("Navigation")).toBeInTheDocument();
    });

    it("should display Actions category", () => {
      render(<KeyboardShortcutsModal {...defaultProps} />);

      expect(screen.getByText("Actions on focused photo")).toBeInTheDocument();
    });

    it("should display Selection category", () => {
      render(<KeyboardShortcutsModal {...defaultProps} />);

      expect(screen.getByText("Selection")).toBeInTheDocument();
    });

    it("should display Help category", () => {
      render(<KeyboardShortcutsModal {...defaultProps} />);

      expect(screen.getByText("Help")).toBeInTheDocument();
    });
  });

  describe("navigation shortcuts", () => {
    it("should show arrow key shortcuts", () => {
      render(<KeyboardShortcutsModal {...defaultProps} />);

      expect(screen.getByText("Move focus up/down")).toBeInTheDocument();
    });

    it("should show Enter shortcut", () => {
      render(<KeyboardShortcutsModal {...defaultProps} />);

      expect(screen.getByText("Open photo preview")).toBeInTheDocument();
    });

    it("should show Escape shortcut description", () => {
      render(<KeyboardShortcutsModal {...defaultProps} />);

      expect(screen.getByText("Close preview / Clear focus / Clear selection")).toBeInTheDocument();
    });
  });

  describe("action shortcuts", () => {
    it("should show Approve shortcut", () => {
      render(<KeyboardShortcutsModal {...defaultProps} />);

      expect(screen.getByText("Approve photo")).toBeInTheDocument();
    });

    it("should show Reject shortcut", () => {
      render(<KeyboardShortcutsModal {...defaultProps} />);

      expect(screen.getByText("Reject photo")).toBeInTheDocument();
    });

    it("should show Retry shortcut", () => {
      render(<KeyboardShortcutsModal {...defaultProps} />);

      expect(screen.getByText("Retry failed photo")).toBeInTheDocument();
    });

    it("should show Space shortcut for toggle selection", () => {
      render(<KeyboardShortcutsModal {...defaultProps} />);

      expect(screen.getByText("Toggle selection")).toBeInTheDocument();
    });
  });

  describe("selection shortcuts", () => {
    it("should show select all shortcut", () => {
      render(<KeyboardShortcutsModal {...defaultProps} />);

      expect(screen.getByText("Select all photos")).toBeInTheDocument();
    });

    it("should show extend selection shortcut", () => {
      render(<KeyboardShortcutsModal {...defaultProps} />);

      expect(screen.getByText("Extend selection")).toBeInTheDocument();
    });
  });

  describe("help shortcuts", () => {
    it("should show help shortcut", () => {
      render(<KeyboardShortcutsModal {...defaultProps} />);

      expect(screen.getByText("Show this help")).toBeInTheDocument();
    });
  });

  describe("footer", () => {
    it("should display Esc instruction", () => {
      render(<KeyboardShortcutsModal {...defaultProps} />);

      expect(screen.getByText(/to close/)).toBeInTheDocument();
    });
  });

  describe("closing", () => {
    it("should call onClose when clicking close button", async () => {
      const user = userEvent.setup();
      render(<KeyboardShortcutsModal {...defaultProps} />);

      // The close button is inside the modal header
      const buttons = screen.getAllByRole("button");
      const closeButton = buttons[0]; // First button is the close button

      await user.click(closeButton);

      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it("should call onClose when clicking backdrop", async () => {
      const user = userEvent.setup();
      const handleClose = vi.fn();
      render(<KeyboardShortcutsModal isOpen={true} onClose={handleClose} />);

      // Click the backdrop (the outer fixed div)
      const backdrop = document.querySelector(".fixed.inset-0.z-50");
      if (backdrop) {
        await user.click(backdrop);
        expect(handleClose).toHaveBeenCalled();
      }
    });
  });

  describe("keyboard display", () => {
    it("should display keyboard keys in kbd elements", () => {
      render(<KeyboardShortcutsModal {...defaultProps} />);

      const kbdElements = document.querySelectorAll("kbd");
      expect(kbdElements.length).toBeGreaterThan(0);
    });

    it("should display A key for approve", () => {
      render(<KeyboardShortcutsModal {...defaultProps} />);

      const kbdElements = Array.from(document.querySelectorAll("kbd"));
      const aKey = kbdElements.find((kbd) => kbd.textContent === "A");
      expect(aKey).toBeInTheDocument();
    });

    it("should display R key for reject", () => {
      render(<KeyboardShortcutsModal {...defaultProps} />);

      const kbdElements = Array.from(document.querySelectorAll("kbd"));
      const rKey = kbdElements.find((kbd) => kbd.textContent === "R");
      expect(rKey).toBeInTheDocument();
    });
  });
});
