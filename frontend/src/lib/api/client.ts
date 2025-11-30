import type {
  Photo,
  PhotoListResponse,
  EventListResponse,
  ActionType,
  PhotoStatus,
  StatusCount,
  BulkActionResponse,
} from "./types";
import { getAccessToken } from "../auth/cognitoConfig";

// Use relative URLs in production (CloudFront routes /api/* and /ai/* to backend services)
// Use localhost in development
const isDev = import.meta.env.DEV;
const API_BASE = isDev ? "http://localhost:8080/api" : "/api";
const AI_SERVICE_BASE = isDev ? "http://localhost:3001/ai" : "/ai";

async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await getAccessToken();
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const authHeaders = await getAuthHeaders();
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export const photoClient = {
  async getPhotos(status?: PhotoStatus): Promise<PhotoListResponse> {
    const url = status
      ? `${API_BASE}/photos?status=${status}`
      : `${API_BASE}/photos`;
    return fetchJson<PhotoListResponse>(url);
  },

  async getPhotoById(id: string): Promise<Photo> {
    return fetchJson<Photo>(`${API_BASE}/photos/${id}`);
  },

  uploadPhotos(
    files: File[],
    onProgress?: (progress: number, speed: number) => void
  ): { promise: Promise<PhotoListResponse>; abort: () => void } {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });

    const xhr = new XMLHttpRequest();
    let startTime = 0;
    let lastLoaded = 0;
    let lastTime = 0;

    const promise = (async () => {
      // Get auth token before starting upload
      const token = await getAccessToken();

      return new Promise<PhotoListResponse>((resolve, reject) => {
        xhr.upload.addEventListener("loadstart", () => {
          startTime = Date.now();
          lastTime = startTime;
          lastLoaded = 0;
        });

        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable && onProgress) {
            const progress = Math.round((event.loaded / event.total) * 100);

            // Calculate speed (bytes per second) using a rolling window
            const now = Date.now();
            const timeDiff = (now - lastTime) / 1000; // seconds
            const bytesDiff = event.loaded - lastLoaded;

            // Only update speed if enough time has passed (avoid division by tiny numbers)
            let speed = 0;
            if (timeDiff >= 0.1) {
              speed = bytesDiff / timeDiff;
              lastTime = now;
              lastLoaded = event.loaded;
            } else if (lastTime > startTime) {
              // Use previous speed calculation if not enough time passed
              speed = bytesDiff / timeDiff || 0;
            } else {
              // First update - use overall speed
              const totalTime = (now - startTime) / 1000;
              speed = totalTime > 0 ? event.loaded / totalTime : 0;
            }

            onProgress(progress, speed);
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve(response);
            } catch {
              reject(new Error("Invalid JSON response"));
            }
          } else {
            reject(new Error(`Upload failed: ${xhr.status}`));
          }
        });

        xhr.addEventListener("error", () => {
          reject(new Error("Network error during upload"));
        });

        xhr.addEventListener("abort", () => {
          reject(new Error("Upload cancelled"));
        });

        xhr.open("POST", `${API_BASE}/photos`);
        if (token) {
          xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        }
        xhr.send(formData);
      });
    })();

    return {
      promise,
      abort: () => xhr.abort(),
    };
  },

  async performAction(photoId: string, action: ActionType): Promise<Photo> {
    return fetchJson<Photo>(`${API_BASE}/photos/${photoId}/action`, {
      method: "POST",
      body: JSON.stringify({ action }),
    });
  },

  async deletePhoto(photoId: string): Promise<void> {
    const authHeaders = await getAuthHeaders();
    const response = await fetch(`${API_BASE}/photos/${photoId}`, {
      method: "DELETE",
      headers: authHeaders,
    });
    if (!response.ok) {
      throw new Error(`Failed to delete photo: ${response.status}`);
    }
  },

  async getStatusCounts(): Promise<StatusCount[]> {
    return fetchJson<StatusCount[]>(`${API_BASE}/photos/counts`);
  },

  async performBulkAction(
    ids: string[],
    action: ActionType
  ): Promise<BulkActionResponse> {
    return fetchJson<BulkActionResponse>(`${API_BASE}/photos/bulk-action`, {
      method: "POST",
      body: JSON.stringify({ ids, action }),
    });
  },

  async bulkDelete(ids: string[]): Promise<BulkActionResponse> {
    return fetchJson<BulkActionResponse>(`${API_BASE}/photos/bulk-delete`, {
      method: "POST",
      body: JSON.stringify({ ids }),
    });
  },

  async removeDuplicates(): Promise<PhotoListResponse> {
    const authHeaders = await getAuthHeaders();
    const response = await fetch(`${API_BASE}/photos/duplicates`, {
      method: "DELETE",
      headers: authHeaders,
    });
    if (!response.ok) {
      throw new Error(`Failed to remove duplicates: ${response.status}`);
    }
    return response.json();
  },

  getPhotoContentUrl(id: string): string {
    return `${API_BASE}/photos/${id}/content`;
  },

  async addTag(photoId: string, tag: string): Promise<Photo> {
    return fetchJson<Photo>(`${API_BASE}/photos/${photoId}/tags`, {
      method: "POST",
      body: JSON.stringify({ tag }),
    });
  },

  async removeTag(photoId: string, tag: string): Promise<Photo> {
    const authHeaders = await getAuthHeaders();
    const encodedTag = encodeURIComponent(tag);
    const response = await fetch(`${API_BASE}/photos/${photoId}/tags/${encodedTag}`, {
      method: "DELETE",
      headers: authHeaders,
    });
    if (!response.ok) {
      throw new Error(`Failed to remove tag: ${response.status}`);
    }
    return response.json();
  },
};

export const eventClient = {
  async getEvents(params?: {
    photoId?: string;
    limit?: number;
  }): Promise<EventListResponse> {
    const searchParams = new URLSearchParams();
    if (params?.photoId) searchParams.set("photoId", params.photoId);
    if (params?.limit) searchParams.set("limit", params.limit.toString());

    const query = searchParams.toString();
    const url = query ? `${API_BASE}/events?${query}` : `${API_BASE}/events`;
    return fetchJson<EventListResponse>(url);
  },
};

export interface AutoTagResponse {
  success: boolean;
  tags: string[];
  failedTags?: string[];
  applied?: boolean;
  error?: string;
}

export const aiClient = {
  /**
   * Check if the AI service is available
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Use /ai/health which works in both dev (localhost:3001/ai/health) and prod (/ai/health via CloudFront)
      const healthUrl = isDev ? "http://localhost:3001/health" : "/ai/health";
      const response = await fetch(healthUrl);
      return response.ok;
    } catch {
      return false;
    }
  },

  /**
   * Analyze a photo and get suggested tags (without applying them)
   */
  async analyzeTags(photoId: string): Promise<AutoTagResponse> {
    return fetchJson<AutoTagResponse>(`${AI_SERVICE_BASE}/analyze`, {
      method: "POST",
      body: JSON.stringify({ photoId }),
    });
  },

  /**
   * Analyze a photo and automatically apply the generated tags
   */
  async autoTag(photoId: string): Promise<AutoTagResponse> {
    return fetchJson<AutoTagResponse>(`${AI_SERVICE_BASE}/analyze-and-apply`, {
      method: "POST",
      body: JSON.stringify({ photoId }),
    });
  },
};

