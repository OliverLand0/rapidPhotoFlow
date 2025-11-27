import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider, useTheme } from "./ThemeContext";

// Test component that uses the theme
function TestComponent() {
  const { theme, toggleTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <button onClick={toggleTheme}>Toggle Theme</button>
    </div>
  );
}

describe("ThemeContext", () => {
  let localStorageMock: { [key: string]: string };

  beforeEach(() => {
    localStorageMock = {};
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(
      (key) => localStorageMock[key] || null
    );
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(
      (key, value) => {
        localStorageMock[key] = value;
      }
    );

    // Reset document class
    document.documentElement.classList.remove("dark");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("ThemeProvider", () => {
    it("should provide theme context to children", () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      expect(screen.getByTestId("theme")).toBeInTheDocument();
    });

    it("should default to light theme when no stored preference", () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      expect(screen.getByTestId("theme")).toHaveTextContent("light");
    });

    it("should use stored theme from localStorage", () => {
      localStorageMock["theme"] = "dark";

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      expect(screen.getByTestId("theme")).toHaveTextContent("dark");
    });

    it("should add dark class to document when theme is dark", () => {
      localStorageMock["theme"] = "dark";

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      expect(document.documentElement.classList.contains("dark")).toBe(true);
    });

    it("should remove dark class from document when theme is light", () => {
      document.documentElement.classList.add("dark");
      localStorageMock["theme"] = "light";

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      expect(document.documentElement.classList.contains("dark")).toBe(false);
    });

    it("should save theme to localStorage", () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      expect(localStorage.setItem).toHaveBeenCalledWith("theme", "light");
    });
  });

  describe("toggleTheme", () => {
    it("should toggle from light to dark", async () => {
      const user = userEvent.setup();

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      expect(screen.getByTestId("theme")).toHaveTextContent("light");

      await user.click(screen.getByRole("button", { name: /toggle theme/i }));

      expect(screen.getByTestId("theme")).toHaveTextContent("dark");
    });

    it("should toggle from dark to light", async () => {
      const user = userEvent.setup();
      localStorageMock["theme"] = "dark";

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      expect(screen.getByTestId("theme")).toHaveTextContent("dark");

      await user.click(screen.getByRole("button", { name: /toggle theme/i }));

      expect(screen.getByTestId("theme")).toHaveTextContent("light");
    });

    it("should update localStorage when toggling", async () => {
      const user = userEvent.setup();

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      await user.click(screen.getByRole("button", { name: /toggle theme/i }));

      expect(localStorage.setItem).toHaveBeenCalledWith("theme", "dark");
    });

    it("should update document class when toggling", async () => {
      const user = userEvent.setup();

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      expect(document.documentElement.classList.contains("dark")).toBe(false);

      await user.click(screen.getByRole("button", { name: /toggle theme/i }));

      expect(document.documentElement.classList.contains("dark")).toBe(true);
    });
  });

  describe("useTheme", () => {
    it("should throw error when used outside ThemeProvider", () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      expect(() => render(<TestComponent />)).toThrow(
        "useTheme must be used within a ThemeProvider"
      );

      consoleSpy.mockRestore();
    });
  });

  describe("system preference", () => {
    it("should use dark theme when system prefers dark and no stored preference", () => {
      // Mock matchMedia to return dark preference
      window.matchMedia = vi.fn().mockImplementation((query) => ({
        matches: query === "(prefers-color-scheme: dark)",
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      expect(screen.getByTestId("theme")).toHaveTextContent("dark");
    });
  });
});
