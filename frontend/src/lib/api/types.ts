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
  | "AUTO_TAGGED"
  | "FOLDER_CREATED"
  | "FOLDER_RENAMED"
  | "FOLDER_MOVED"
  | "FOLDER_DELETED"
  | "PHOTO_MOVED_TO_FOLDER"
  | "ALBUM_CREATED"
  | "ALBUM_UPDATED"
  | "ALBUM_DELETED"
  | "PHOTO_ADDED_TO_ALBUM"
  | "PHOTO_REMOVED_FROM_ALBUM"
  | "SHARED_LINK_CREATED"
  | "SHARED_LINK_UPDATED"
  | "SHARED_LINK_ACCESSED"
  | "SHARED_LINK_DEACTIVATED"
  | "SHARED_LINK_DELETED"
  | "SHARED_CONTENT_DOWNLOADED";

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
  uploadedByUsername?: string | null;
  folderId?: string | null;
  originalMimeType?: string | null;
  isChatGptCompatible?: boolean;
  wasConverted?: boolean;
  aiTaggingEnabled?: boolean;
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

// Folder types
export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  path?: string;
  photoCount: number;
  children: Folder[];
}

export interface FolderListResponse {
  items: Folder[];
  total: number;
}

export interface CreateFolderRequest {
  name: string;
  parentId?: string | null;
}

export interface UpdateFolderRequest {
  name?: string;
  parentId?: string | null;
}

export interface MovePhotosRequest {
  photoIds: string[];
  folderId?: string | null;
}

// Album types
export interface Album {
  id: string;
  name: string;
  description: string | null;
  coverPhotoId: string | null;
  coverPhotoUrl: string | null;
  createdAt: string;
  updatedAt: string;
  photoCount: number;
}

export interface AlbumListResponse {
  items: Album[];
  total: number;
}

export interface CreateAlbumRequest {
  name: string;
  description?: string;
}

export interface UpdateAlbumRequest {
  name?: string;
  description?: string;
  coverPhotoId?: string;
}

export interface AlbumPhotosRequest {
  photoIds: string[];
}

// Sharing types
export type ShareType = "PHOTO" | "ALBUM" | "FOLDER";

export interface SharedLink {
  id: string;
  token: string;
  url: string;
  type: ShareType;
  targetId: string;
  targetName: string;
  targetThumbnailUrl: string | null;
  hasPassword: boolean;
  expiresAt: string | null;
  downloadAllowed: boolean;
  downloadOriginal: boolean;
  maxViews: number | null;
  requireEmail: boolean;
  isActive: boolean;
  isExpired: boolean;
  isAccessible: boolean;
  viewCount: number;
  downloadCount: number;
  lastAccessedAt: string | null;
  createdAt: string;
}

export interface SharedLinkListResponse {
  items: SharedLink[];
  total: number;
}

export interface CreateShareRequest {
  // Target - exactly one should be set
  photoId?: string;
  albumId?: string;
  folderId?: string;
  // Optional settings
  password?: string;
  downloadAllowed?: boolean;
  downloadOriginal?: boolean;
  maxViews?: number;
  requireEmail?: boolean;
  expiresIn?: "never" | "1h" | "24h" | "7d" | "30d";
  expiresAt?: string;
}

export interface UpdateShareRequest {
  downloadAllowed?: boolean;
  downloadOriginal?: boolean;
  maxViews?: number | null;
  requireEmail?: boolean;
  expiresIn?: "never" | "1h" | "24h" | "7d" | "30d";
  expiresAt?: string | null;
  isActive?: boolean;
}

export interface PublicShareResponse {
  type: ShareType;
  name: string;
  photoCount?: number;
  requiresPassword: boolean;
  requiresEmail: boolean;
  downloadAllowed: boolean;
  downloadOriginal: boolean;
  expired: boolean;
  disabled: boolean;
  accessible: boolean;
  errorMessage?: string;
  photoUrl?: string;
  thumbnailUrl?: string;
}

export interface VerifyPasswordResponse {
  valid: boolean;
  error?: string;
}

export interface PublicPhoto {
  id: string;
  filename: string;
  mimeType: string;
  photoUrl: string;
  thumbnailUrl: string;
}
