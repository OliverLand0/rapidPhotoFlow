export type PhotoStatus =
  | "PENDING"
  | "PROCESSING"
  | "PROCESSED"
  | "FAILED"
  | "APPROVED"
  | "REJECTED";

export type EventType =
  | "PHOTO_CREATED"
  | "PROCESSING_STARTED"
  | "PROCESSING_COMPLETED"
  | "PROCESSING_FAILED"
  | "APPROVED"
  | "REJECTED"
  | "DELETED"
  | "RETRY_REQUESTED"
  | "TAG_ADDED"
  | "TAG_REMOVED"
  | "AUTO_TAGGED";

export interface Photo {
  id: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  status: PhotoStatus;
  failureReason: string | null;
  uploadedAt: string;
  updatedAt: string;
  tags: string[];
}

export interface EventLog {
  id: string;
  photoId: string;
  type: EventType;
  message: string;
  timestamp: string;
}

export interface PhotoListResponse {
  items: Photo[];
  total: number;
  hasMore: boolean;
}

export interface EventListResponse {
  items: EventLog[];
}

export interface StatusCount {
  status: PhotoStatus;
  count: number;
}

export type ActionType = "approve" | "reject" | "retry";

export interface BulkActionResponse {
  success: Photo[];
  errors: Record<string, string>;
  successCount: number;
  errorCount: number;
}

export interface SavedView {
  id: string;
  name: string;
  createdAt: string;
  filters: {
    search: string;
    status: PhotoStatus | "ALL";
    sort: "newest" | "oldest" | "status";
    tag?: string | null;
  };
}
