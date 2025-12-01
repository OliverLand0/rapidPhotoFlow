// Use relative URLs in production (CloudFront routes /api/* to backend)
// Use localhost in development
const isDev = import.meta.env.DEV;
const API_BASE = isDev ? "http://localhost:8080" : "";

export interface SyncUserRequest {
  email: string;
  username: string;
}

export type UserRole = "USER" | "ADMIN";
export type UserStatus = "ACTIVE" | "SUSPENDED" | "PENDING" | "DELETED";

export interface UserDTO {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  status: UserStatus;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface UpdateProfileRequest {
  username?: string;
}

/**
 * Sync user with backend after Cognito login/signup.
 */
export async function syncUser(
  request: SyncUserRequest,
  accessToken: string
): Promise<UserDTO> {
  const response = await fetch(`${API_BASE}/api/auth/sync`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Failed to sync user: ${response.status}`);
  }

  return response.json();
}

/**
 * Update user profile.
 */
export async function updateProfile(
  request: UpdateProfileRequest,
  accessToken: string
): Promise<UserDTO> {
  const response = await fetch(`${API_BASE}/api/users/me`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Failed to update profile: ${response.status}`);
  }

  return response.json();
}
