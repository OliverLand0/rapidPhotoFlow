import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeToggle } from "./ThemeToggle";
import { useTheme } from "../lib/ThemeContext";

vi.mock("../lib/ThemeContext");

describe("ThemeToggle", () => {
  const mockToggleTheme = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("light theme", () => {
    beforeEach(() => {
      vi.mocked(useTheme).mockReturnValue({
        theme: "light",
        toggleTheme: mockToggleTheme,
      });
    });

    it("should render moon icon in light mode", () => {
      render(<ThemeToggle />);

      // Moon icon should be present
      const button = screen.getByRole("button");
      const icon = button.querySelector("svg");
      expect(icon).toBeInTheDocument();
    });

    it("should have correct aria-label in light mode", () => {
      render(<ThemeToggle />);

      expect(screen.getByRole("button")).toHaveAttribute(
        "aria-label",
        "Switch to dark mode"
      );
    });

    it("should call toggleTheme when clicked", async () => {
      const user = userEvent.setup();
      render(<ThemeToggle />);

      await user.click(screen.getByRole("button"));

      expect(mockToggleTheme).toHaveBeenCalled();
    });
  });

  describe("dark theme", () => {
    beforeEach(() => {
      vi.mocked(useTheme).mockReturnValue({
        theme: "dark",
        toggleTheme: mockToggleTheme,
      });
    });

    it("should render sun icon in dark mode", () => {
      render(<ThemeToggle />);

      // Sun icon should be present
      const button = screen.getByRole("button");
      const icon = button.querySelector("svg");
      expect(icon).toBeInTheDocument();
    });

    it("should have correct aria-label in dark mode", () => {
      render(<ThemeToggle />);

      expect(screen.getByRole("button")).toHaveAttribute(
        "aria-label",
        "Switch to light mode"
      );
    });

    it("should call toggleTheme when clicked", async () => {
      const user = userEvent.setup();
      render(<ThemeToggle />);

      await user.click(screen.getByRole("button"));

      expect(mockToggleTheme).toHaveBeenCalled();
    });
  });

  describe("styling", () => {
    beforeEach(() => {
      vi.mocked(useTheme).mockReturnValue({
        theme: "light",
        toggleTheme: mockToggleTheme,
      });
    });

    it("should have transition classes", () => {
      render(<ThemeToggle />);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("transition-colors");
    });

    it("should have rounded styling", () => {
      render(<ThemeToggle />);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("rounded-md");
    });

    it("should have hover styling classes", () => {
      render(<ThemeToggle />);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("hover:bg-muted");
    });
  });

  describe("icon size", () => {
    beforeEach(() => {
      vi.mocked(useTheme).mockReturnValue({
        theme: "light",
        toggleTheme: mockToggleTheme,
      });
    });

    it("should render icon with correct size classes", () => {
      render(<ThemeToggle />);

      const button = screen.getByRole("button");
      const icon = button.querySelector("svg");
      expect(icon).toHaveClass("h-4", "w-4");
    });
  });

  describe("accessibility", () => {
    beforeEach(() => {
      vi.mocked(useTheme).mockReturnValue({
        theme: "light",
        toggleTheme: mockToggleTheme,
      });
    });

    it("should be focusable", () => {
      render(<ThemeToggle />);

      const button = screen.getByRole("button");
      button.focus();
      expect(document.activeElement).toBe(button);
    });

    it("should be a button element", () => {
      render(<ThemeToggle />);

      expect(screen.getByRole("button")).toBeInTheDocument();
    });
  });
});
