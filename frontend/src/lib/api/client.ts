import type {
  Photo,
  PhotoListResponse,
  EventListResponse,
  ActionType,
  PhotoStatus,
  StatusCount,
  BulkActionResponse,
} from "./types";

const API_BASE = "http://localhost:8080/api";

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
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

    const promise = new Promise<PhotoListResponse>((resolve, reject) => {
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
      xhr.send(formData);
    });

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
    const response = await fetch(`${API_BASE}/photos/${photoId}`, {
      method: "DELETE",
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

  async removeDuplicates(): Promise<PhotoListResponse> {
    const response = await fetch(`${API_BASE}/photos/duplicates`, {
      method: "DELETE",
    });
    if (!response.ok) {
      throw new Error(`Failed to remove duplicates: ${response.status}`);
    }
    return response.json();
  },

  getPhotoContentUrl(id: string): string {
    return `${API_BASE}/photos/${id}/content`;
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

export const seedClient = {
  async seedData(): Promise<PhotoListResponse> {
    return fetchJson<PhotoListResponse>(`${API_BASE}/seed`, {
      method: "POST",
    });
  },

  async clearData(): Promise<void> {
    await fetch(`${API_BASE}/seed`, { method: "DELETE" });
  },
};

