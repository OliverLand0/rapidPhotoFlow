import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserAttribute,
  CognitoUserSession,
  type ISignUpResult,
} from "amazon-cognito-identity-js";

// Cognito configuration from environment variables
const COGNITO_USER_POOL_ID = import.meta.env.VITE_COGNITO_USER_POOL_ID || "";
const COGNITO_CLIENT_ID = import.meta.env.VITE_COGNITO_CLIENT_ID || "";

// Initialize the Cognito User Pool
const poolData = {
  UserPoolId: COGNITO_USER_POOL_ID,
  ClientId: COGNITO_CLIENT_ID,
};

let userPool: CognitoUserPool | null = null;

export function getUserPool(): CognitoUserPool {
  if (!userPool) {
    if (!COGNITO_USER_POOL_ID || !COGNITO_CLIENT_ID) {
      throw new Error(
        "Cognito configuration is missing. Set VITE_COGNITO_USER_POOL_ID and VITE_COGNITO_CLIENT_ID environment variables."
      );
    }
    userPool = new CognitoUserPool(poolData);
  }
  return userPool;
}

export interface SignUpParams {
  email: string;
  username: string;
  password: string;
}

export interface LoginParams {
  email: string;
  password: string;
}

export interface ConfirmSignUpParams {
  email: string;
  code: string;
}

export interface ForgotPasswordParams {
  email: string;
}

export interface ResetPasswordParams {
  email: string;
  code: string;
  newPassword: string;
}

export interface CognitoUserInfo {
  sub: string;
  email: string;
  username: string;
  emailVerified: boolean;
}

/**
 * Sign up a new user with Cognito.
 */
export function signUp(params: SignUpParams): Promise<ISignUpResult> {
  const { email, username, password } = params;
  const pool = getUserPool();

  const attributeList = [
    new CognitoUserAttribute({ Name: "email", Value: email }),
    new CognitoUserAttribute({ Name: "preferred_username", Value: username }),
  ];

  return new Promise((resolve, reject) => {
    pool.signUp(email, password, attributeList, [], (err, result) => {
      if (err) {
        reject(err);
        return;
      }
      if (result) {
        resolve(result);
      } else {
        reject(new Error("Sign up failed: no result returned"));
      }
    });
  });
}

/**
 * Confirm user sign up with verification code.
 */
export function confirmSignUp(params: ConfirmSignUpParams): Promise<string> {
  const { email, code } = params;
  const pool = getUserPool();

  const cognitoUser = new CognitoUser({
    Username: email,
    Pool: pool,
  });

  return new Promise((resolve, reject) => {
    cognitoUser.confirmRegistration(code, true, (err, result) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(result);
    });
  });
}

/**
 * Resend confirmation code.
 */
export function resendConfirmationCode(email: string): Promise<void> {
  const pool = getUserPool();

  const cognitoUser = new CognitoUser({
    Username: email,
    Pool: pool,
  });

  return new Promise((resolve, reject) => {
    cognitoUser.resendConfirmationCode((err) => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });
}

/**
 * Sign in a user with Cognito.
 */
export function signIn(params: LoginParams): Promise<CognitoUserSession> {
  const { email, password } = params;
  const pool = getUserPool();

  const cognitoUser = new CognitoUser({
    Username: email,
    Pool: pool,
  });

  const authenticationDetails = new AuthenticationDetails({
    Username: email,
    Password: password,
  });

  return new Promise((resolve, reject) => {
    cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess: (session) => {
        resolve(session);
      },
      onFailure: (err) => {
        reject(err);
      },
      newPasswordRequired: () => {
        reject(new Error("New password required. Please reset your password."));
      },
    });
  });
}

/**
 * Sign out the current user.
 */
export function signOut(): void {
  const pool = getUserPool();
  const cognitoUser = pool.getCurrentUser();
  if (cognitoUser) {
    cognitoUser.signOut();
  }
}

/**
 * Get the current authenticated user's session.
 */
export function getCurrentSession(): Promise<CognitoUserSession | null> {
  const pool = getUserPool();
  const cognitoUser = pool.getCurrentUser();

  if (!cognitoUser) {
    return Promise.resolve(null);
  }

  return new Promise((resolve, reject) => {
    cognitoUser.getSession(
      (err: Error | null, session: CognitoUserSession | null) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(session);
      }
    );
  });
}

/**
 * Get the current user's JWT access token.
 */
export async function getAccessToken(): Promise<string | null> {
  const session = await getCurrentSession();
  return session?.getAccessToken().getJwtToken() || null;
}

/**
 * Get current user info from the ID token.
 */
export async function getCurrentUserInfo(): Promise<CognitoUserInfo | null> {
  const session = await getCurrentSession();
  if (!session) {
    return null;
  }

  const idToken = session.getIdToken();
  const payload = idToken.payload;

  return {
    sub: payload.sub,
    email: payload.email,
    username: payload["preferred_username"] || payload.email,
    emailVerified: payload.email_verified === true,
  };
}

/**
 * Initiate forgot password flow.
 */
export function forgotPassword(params: ForgotPasswordParams): Promise<void> {
  const { email } = params;
  const pool = getUserPool();

  const cognitoUser = new CognitoUser({
    Username: email,
    Pool: pool,
  });

  return new Promise((resolve, reject) => {
    cognitoUser.forgotPassword({
      onSuccess: () => {
        resolve();
      },
      onFailure: (err) => {
        reject(err);
      },
    });
  });
}

/**
 * Reset password with verification code.
 */
export function resetPassword(params: ResetPasswordParams): Promise<void> {
  const { email, code, newPassword } = params;
  const pool = getUserPool();

  const cognitoUser = new CognitoUser({
    Username: email,
    Pool: pool,
  });

  return new Promise((resolve, reject) => {
    cognitoUser.confirmPassword(code, newPassword, {
      onSuccess: () => {
        resolve();
      },
      onFailure: (err) => {
        reject(err);
      },
    });
  });
}

/**
 * Check if Cognito is configured.
 */
export function isCognitoConfigured(): boolean {
  return Boolean(COGNITO_USER_POOL_ID && COGNITO_CLIENT_ID);
}
