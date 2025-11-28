import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";

// Mock the useAuth hook
vi.mock("../../contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from "../../contexts/AuthContext";

const mockUseAuth = useAuth as ReturnType<typeof vi.fn>;

describe("ProtectedRoute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("loading state", () => {
    it("should show loading spinner while checking auth", () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: true,
        isConfigured: true,
        user: null,
      });

      render(
        <MemoryRouter>
          <ProtectedRoute>
            <div>Protected Content</div>
          </ProtectedRoute>
        </MemoryRouter>
      );

      // Should show loading spinner (SVG with animate-spin class)
      const loadingElement = document.querySelector(".animate-spin");
      expect(loadingElement).toBeInTheDocument();
      expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
    });
  });

  describe("authenticated state", () => {
    it("should render children when authenticated", () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        isConfigured: true,
        user: { sub: "123", email: "test@example.com", username: "testuser", emailVerified: true },
      });

      render(
        <MemoryRouter>
          <ProtectedRoute>
            <div>Protected Content</div>
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.getByText("Protected Content")).toBeInTheDocument();
    });
  });

  describe("unauthenticated state", () => {
    it("should redirect to login when not authenticated", () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        isConfigured: true,
        user: null,
      });

      render(
        <MemoryRouter initialEntries={["/protected"]}>
          <ProtectedRoute>
            <div>Protected Content</div>
          </ProtectedRoute>
        </MemoryRouter>
      );

      // Should not render protected content
      expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
    });
  });

  describe("unconfigured auth", () => {
    it("should allow access when auth is not configured", () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        isConfigured: false,
        user: null,
      });

      render(
        <MemoryRouter>
          <ProtectedRoute>
            <div>Protected Content</div>
          </ProtectedRoute>
        </MemoryRouter>
      );

      // Should render content when auth is not configured (dev mode)
      expect(screen.getByText("Protected Content")).toBeInTheDocument();
    });
  });
});
