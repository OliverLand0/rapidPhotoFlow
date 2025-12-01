import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import {
  signUp as cognitoSignUp,
  signIn as cognitoSignIn,
  signOut as cognitoSignOut,
  confirmSignUp as cognitoConfirmSignUp,
  forgotPassword as cognitoForgotPassword,
  resetPassword as cognitoResetPassword,
  resendConfirmationCode as cognitoResendCode,
  getCurrentUserInfo,
  getAccessToken,
  isCognitoConfigured,
  type SignUpParams,
  type LoginParams,
  type ConfirmSignUpParams,
  type ForgotPasswordParams,
  type ResetPasswordParams,
  type CognitoUserInfo,
} from "../lib/auth/cognitoConfig";
import { syncUser, type UserRole } from "../lib/api/authApi";

interface AuthState {
  user: CognitoUserInfo | null;
  userRole: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isConfigured: boolean;
}

interface AuthContextValue extends AuthState {
  isAdmin: boolean;
  login: (params: LoginParams) => Promise<void>;
  logout: () => void;
  signup: (params: SignUpParams) => Promise<void>;
  confirmSignup: (params: ConfirmSignUpParams) => Promise<void>;
  resendConfirmationCode: (email: string) => Promise<void>;
  forgotPassword: (params: ForgotPasswordParams) => Promise<void>;
  resetPassword: (params: ResetPasswordParams) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    user: null,
    userRole: null,
    isAuthenticated: false,
    isLoading: true,
    isConfigured: isCognitoConfigured(),
  });

  const refreshUser = useCallback(async () => {
    if (!isCognitoConfigured()) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        isConfigured: false,
      }));
      return;
    }

    try {
      const userInfo = await getCurrentUserInfo();
      let userRole: UserRole | null = null;

      // Sync with backend to get user role
      if (userInfo) {
        try {
          const token = await getAccessToken();
          if (token) {
            const syncedUser = await syncUser(
              { email: userInfo.email, username: userInfo.username },
              token
            );
            userRole = syncedUser.role;
          }
        } catch (syncError) {
          console.warn("Failed to sync user with backend:", syncError);
        }
      }

      setState({
        user: userInfo,
        userRole,
        isAuthenticated: !!userInfo,
        isLoading: false,
        isConfigured: true,
      });
    } catch {
      setState({
        user: null,
        userRole: null,
        isAuthenticated: false,
        isLoading: false,
        isConfigured: true,
      });
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = useCallback(async (params: LoginParams) => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      await cognitoSignIn(params);
      const userInfo = await getCurrentUserInfo();
      let userRole: UserRole | null = null;

      if (userInfo) {
        // Sync user with backend
        try {
          const token = await getAccessToken();
          if (token) {
            const syncedUser = await syncUser(
              {
                email: userInfo.email,
                username: userInfo.username,
              },
              token
            );
            userRole = syncedUser.role;
          }
        } catch (syncError) {
          console.warn("Failed to sync user with backend:", syncError);
          // Don't fail login if sync fails
        }
      }

      setState({
        user: userInfo,
        userRole,
        isAuthenticated: !!userInfo,
        isLoading: false,
        isConfigured: true,
      });
    } catch (error) {
      setState((prev) => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, []);

  const logout = useCallback(() => {
    cognitoSignOut();
    setState({
      user: null,
      userRole: null,
      isAuthenticated: false,
      isLoading: false,
      isConfigured: true,
    });
  }, []);

  const signup = useCallback(async (params: SignUpParams) => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      await cognitoSignUp(params);
      setState((prev) => ({ ...prev, isLoading: false }));
    } catch (error) {
      setState((prev) => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, []);

  const confirmSignup = useCallback(async (params: ConfirmSignUpParams) => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      await cognitoConfirmSignUp(params);
      setState((prev) => ({ ...prev, isLoading: false }));
    } catch (error) {
      setState((prev) => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, []);

  const resendConfirmationCode = useCallback(async (email: string) => {
    await cognitoResendCode(email);
  }, []);

  const forgotPassword = useCallback(async (params: ForgotPasswordParams) => {
    await cognitoForgotPassword(params);
  }, []);

  const resetPassword = useCallback(async (params: ResetPasswordParams) => {
    await cognitoResetPassword(params);
  }, []);

  const value: AuthContextValue = {
    ...state,
    isAdmin: state.userRole === "ADMIN",
    login,
    logout,
    signup,
    confirmSignup,
    resendConfirmationCode,
    forgotPassword,
    resetPassword,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
