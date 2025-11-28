import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { AuthProvider, useAuth } from "./AuthContext";
import { ReactNode } from "react";

// Mock the Cognito config module
vi.mock("../lib/auth/cognitoConfig", () => ({
  isCognitoConfigured: vi.fn(),
  getCurrentUserInfo: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
  signUp: vi.fn(),
  confirmSignUp: vi.fn(),
  resendConfirmationCode: vi.fn(),
  forgotPassword: vi.fn(),
  resetPassword: vi.fn(),
  getAccessToken: vi.fn(),
}));

// Mock the auth API
vi.mock("../lib/api/authApi", () => ({
  syncUser: vi.fn(),
}));

import {
  isCognitoConfigured,
  getCurrentUserInfo,
  signIn,
  signOut,
  signUp,
  confirmSignUp,
  resendConfirmationCode,
  forgotPassword,
  resetPassword,
  getAccessToken,
} from "../lib/auth/cognitoConfig";
import { syncUser } from "../lib/api/authApi";

const mockIsCognitoConfigured = isCognitoConfigured as ReturnType<typeof vi.fn>;
const mockGetCurrentUserInfo = getCurrentUserInfo as ReturnType<typeof vi.fn>;
const mockSignIn = signIn as ReturnType<typeof vi.fn>;
const mockSignOut = signOut as ReturnType<typeof vi.fn>;
const mockSignUp = signUp as ReturnType<typeof vi.fn>;
const mockConfirmSignUp = confirmSignUp as ReturnType<typeof vi.fn>;
const mockResendConfirmationCode = resendConfirmationCode as ReturnType<typeof vi.fn>;
const mockForgotPassword = forgotPassword as ReturnType<typeof vi.fn>;
const mockResetPassword = resetPassword as ReturnType<typeof vi.fn>;
const mockGetAccessToken = getAccessToken as ReturnType<typeof vi.fn>;
const mockSyncUser = syncUser as ReturnType<typeof vi.fn>;

function wrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe("AuthContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsCognitoConfigured.mockReturnValue(true);
    mockGetCurrentUserInfo.mockResolvedValue(null);
  });

  describe("initialization", () => {
    it("should start with isLoading true", () => {
      const { result } = renderHook(() => useAuth(), { wrapper });
      expect(result.current.isLoading).toBe(true);
    });

    it("should set isConfigured based on Cognito config", async () => {
      mockIsCognitoConfigured.mockReturnValue(false);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isConfigured).toBe(false);
    });

    it("should set user when already authenticated", async () => {
      const mockUser = {
        sub: "user-123",
        email: "test@example.com",
        username: "testuser",
        emailVerified: true,
      };
      mockGetCurrentUserInfo.mockResolvedValue(mockUser);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  describe("login", () => {
    it("should call signIn and update state on success", async () => {
      const mockUser = {
        sub: "user-123",
        email: "test@example.com",
        username: "testuser",
        emailVerified: true,
      };
      mockSignIn.mockResolvedValue({});
      mockGetCurrentUserInfo.mockResolvedValue(mockUser);
      mockGetAccessToken.mockResolvedValue("mock-token");
      mockSyncUser.mockResolvedValue({});

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.login({ email: "test@example.com", password: "password" });
      });

      expect(mockSignIn).toHaveBeenCalledWith({ email: "test@example.com", password: "password" });
      expect(result.current.isAuthenticated).toBe(true);
    });

    it("should throw error on login failure", async () => {
      mockSignIn.mockRejectedValue(new Error("Invalid credentials"));
      mockGetCurrentUserInfo.mockResolvedValue(null);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.login({ email: "test@example.com", password: "wrong" });
        })
      ).rejects.toThrow("Invalid credentials");
    });
  });

  describe("logout", () => {
    it("should call signOut and clear state", async () => {
      const mockUser = {
        sub: "user-123",
        email: "test@example.com",
        username: "testuser",
        emailVerified: true,
      };
      mockGetCurrentUserInfo.mockResolvedValue(mockUser);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      act(() => {
        result.current.logout();
      });

      expect(mockSignOut).toHaveBeenCalled();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBe(null);
    });
  });

  describe("signup", () => {
    it("should call signUp on success", async () => {
      mockSignUp.mockResolvedValue({});
      mockGetCurrentUserInfo.mockResolvedValue(null);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.signup({
          email: "new@example.com",
          username: "newuser",
          password: "Password123",
        });
      });

      expect(mockSignUp).toHaveBeenCalledWith({
        email: "new@example.com",
        username: "newuser",
        password: "Password123",
      });
    });
  });

  describe("confirmSignup", () => {
    it("should call confirmSignUp on success", async () => {
      mockConfirmSignUp.mockResolvedValue("SUCCESS");
      mockGetCurrentUserInfo.mockResolvedValue(null);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.confirmSignup({ email: "test@example.com", code: "123456" });
      });

      expect(mockConfirmSignUp).toHaveBeenCalledWith({ email: "test@example.com", code: "123456" });
    });
  });

  describe("forgotPassword", () => {
    it("should call forgotPassword on success", async () => {
      mockForgotPassword.mockResolvedValue(undefined);
      mockGetCurrentUserInfo.mockResolvedValue(null);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.forgotPassword({ email: "test@example.com" });
      });

      expect(mockForgotPassword).toHaveBeenCalledWith({ email: "test@example.com" });
    });
  });

  describe("resetPassword", () => {
    it("should call resetPassword on success", async () => {
      mockResetPassword.mockResolvedValue(undefined);
      mockGetCurrentUserInfo.mockResolvedValue(null);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.resetPassword({
          email: "test@example.com",
          code: "123456",
          newPassword: "NewPassword123",
        });
      });

      expect(mockResetPassword).toHaveBeenCalledWith({
        email: "test@example.com",
        code: "123456",
        newPassword: "NewPassword123",
      });
    });
  });

  describe("resendConfirmationCode", () => {
    it("should call resendConfirmationCode on success", async () => {
      mockResendConfirmationCode.mockResolvedValue(undefined);
      mockGetCurrentUserInfo.mockResolvedValue(null);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.resendConfirmationCode("test@example.com");
      });

      expect(mockResendConfirmationCode).toHaveBeenCalledWith("test@example.com");
    });
  });
});
