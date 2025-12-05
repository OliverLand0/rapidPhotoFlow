# RapidPhotoFlow API Documentation

This document provides comprehensive API documentation for the RapidPhotoFlow backend services.

## Base URLs

| Environment | URL |
|-------------|-----|
| Production | `https://api.basedsecurity.net` |
| Local Development | `http://localhost:8080` |

## Authentication

All authenticated endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

Tokens are issued by AWS Cognito. Public endpoints (share access, health checks) do not require authentication.

---

## Photo Management

### Upload Photos

Upload one or more photos with optional format conversion.

```http
POST /api/photos
Content-Type: multipart/form-data
```

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `files` | File[] | Yes | Image files to upload (max 30 per request) |
| `autoConvert` | boolean | No | Convert TIFF/BMP to JPEG/PNG for AI compatibility |

**Response:**
```json
{
  "items": [
    {
      "id": "uuid",
      "filename": "photo.jpg",
      "status": "PENDING",
      "mimeType": "image/jpeg",
      "sizeBytes": 1234567,
      "uploadedAt": "2025-01-15T10:30:00Z",
      "tags": [],
      "hasPreview": false
    }
  ],
  "total": 1
}
```

### List Photos

Retrieve photos with optional filtering.

```http
GET /api/photos
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | Filter by status (PENDING, PROCESSING, PROCESSED, FAILED, APPROVED, REJECTED) |
| `tag` | string | Filter by tag (can be repeated for multiple tags) |
| `folderId` | uuid | Filter by folder ID |
| `rootOnly` | boolean | Show only root-level photos (no folder) |

**Response:**
```json
{
  "items": [
    {
      "id": "uuid",
      "filename": "photo.jpg",
      "status": "PROCESSED",
      "mimeType": "image/jpeg",
      "sizeBytes": 1234567,
      "uploadedAt": "2025-01-15T10:30:00Z",
      "updatedAt": "2025-01-15T10:31:00Z",
      "tags": ["landscape", "sunset", "nature"],
      "thumbnailUrl": "/api/photos/uuid/thumbnail",
      "folderId": null,
      "hasPreview": false
    }
  ],
  "total": 50
}
```

### Get Photo

Retrieve metadata for a specific photo.

```http
GET /api/photos/{id}
```

**Response:**
```json
{
  "id": "uuid",
  "filename": "photo.jpg",
  "status": "APPROVED",
  "mimeType": "image/jpeg",
  "sizeBytes": 1234567,
  "uploadedAt": "2025-01-15T10:30:00Z",
  "updatedAt": "2025-01-15T10:35:00Z",
  "tags": ["portrait", "indoor"],
  "thumbnailUrl": "/api/photos/uuid/thumbnail",
  "folderId": "folder-uuid",
  "hasPreview": false,
  "failureReason": null
}
```

### Get Photo Content

Download the original photo file.

```http
GET /api/photos/{id}/content
```

**Response:** Binary image file with appropriate Content-Type header.

### Get Photo Preview

Get a JPEG preview for non-browser-displayable formats (RAW, HEIC).

```http
GET /api/photos/{id}/preview
```

**Response:** JPEG image file. Returns 404 if no preview is needed (native format).

### Delete Photo

Delete a photo and its associated data.

```http
DELETE /api/photos/{id}
```

**Response:** 204 No Content

### Photo Actions

Perform actions on a photo (approve, reject, retry).

```http
POST /api/photos/{id}/action
Content-Type: application/json
```

**Request Body:**
```json
{
  "action": "approve"  // or "reject", "retry"
}
```

**Response:** Updated photo object

### Bulk Actions

Perform actions on multiple photos.

```http
POST /api/photos/bulk-action
Content-Type: application/json
```

**Request Body:**
```json
{
  "photoIds": ["uuid1", "uuid2", "uuid3"],
  "action": "approve"  // or "reject", "retry"
}
```

**Response:**
```json
{
  "processed": 3,
  "succeeded": 3,
  "failed": 0
}
```

### Bulk Delete

Delete multiple photos.

```http
POST /api/photos/bulk-delete
Content-Type: application/json
```

**Request Body:**
```json
{
  "photoIds": ["uuid1", "uuid2", "uuid3"]
}
```

**Response:**
```json
{
  "deleted": 3
}
```

### Add Tag

Add a tag to a photo.

```http
POST /api/photos/{id}/tags
Content-Type: application/json
```

**Request Body:**
```json
{
  "tag": "vacation"
}
```

**Response:** Updated photo object

### Remove Tag

Remove a tag from a photo.

```http
DELETE /api/photos/{id}/tags/{tag}
```

**Response:** Updated photo object

### Get Photo Counts

Get count of photos by status.

```http
GET /api/photos/counts
```

**Response:**
```json
{
  "PENDING": 5,
  "PROCESSING": 2,
  "PROCESSED": 100,
  "FAILED": 3,
  "APPROVED": 85,
  "REJECTED": 10
}
```

### Remove Duplicates

Remove duplicate photos based on content hash.

```http
DELETE /api/photos/duplicates
```

**Response:**
```json
{
  "removed": 5
}
```

---

## Folder Management

### Get Folder Tree

Retrieve the hierarchical folder structure.

```http
GET /api/folders
```

**Response:**
```json
{
  "items": [
    {
      "id": "uuid",
      "name": "Vacation 2024",
      "parentId": null,
      "photoCount": 50,
      "children": [
        {
          "id": "child-uuid",
          "name": "Beach",
          "parentId": "uuid",
          "photoCount": 25,
          "children": []
        }
      ]
    }
  ]
}
```

### Create Folder

Create a new folder.

```http
POST /api/folders
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "New Folder",
  "parentId": "parent-uuid"  // optional, null for root
}
```

**Response:** Created folder object

### Get Folder

Get folder details.

```http
GET /api/folders/{id}
```

**Response:**
```json
{
  "id": "uuid",
  "name": "Vacation 2024",
  "parentId": null,
  "photoCount": 50,
  "createdAt": "2025-01-15T10:30:00Z"
}
```

### Rename Folder

Rename a folder.

```http
PUT /api/folders/{id}
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "New Name"
}
```

**Response:** Updated folder object

### Move Folder

Move folder to a new parent.

```http
PUT /api/folders/{id}/move
Content-Type: application/json
```

**Request Body:**
```json
{
  "parentId": "new-parent-uuid"  // null for root
}
```

**Response:** Updated folder object

### Delete Folder

Delete a folder.

```http
DELETE /api/folders/{id}
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `deleteContents` | boolean | If true, delete photos inside. If false, move to root. |

**Response:** 204 No Content

### Get Folder Path

Get breadcrumb path to folder.

```http
GET /api/folders/{id}/path
```

**Response:**
```json
[
  { "id": "root-uuid", "name": "Photos" },
  { "id": "parent-uuid", "name": "Vacation" },
  { "id": "uuid", "name": "Beach" }
]
```

### Move Photos to Folder

Move photos into a folder.

```http
POST /api/folders/{id}/photos
Content-Type: application/json
```

**Request Body:**
```json
{
  "photoIds": ["uuid1", "uuid2"]
}
```

**Response:**
```json
{
  "moved": 2
}
```

### Move Photos to Root

Move photos out of folders to root level.

```http
POST /api/folders/root/photos
Content-Type: application/json
```

**Request Body:**
```json
{
  "photoIds": ["uuid1", "uuid2"]
}
```

**Response:**
```json
{
  "moved": 2
}
```

---

## Album Management

### List Albums

Get all albums for the current user.

```http
GET /api/albums
```

**Response:**
```json
{
  "items": [
    {
      "id": "uuid",
      "name": "Best Of 2024",
      "description": "My favorite photos",
      "coverPhotoId": "photo-uuid",
      "coverThumbnailUrl": "/api/photos/photo-uuid/thumbnail",
      "photoCount": 25,
      "createdAt": "2025-01-15T10:30:00Z"
    }
  ]
}
```

### Create Album

Create a new album.

```http
POST /api/albums
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Summer 2024",
  "description": "Beach vacation photos"
}
```

**Response:** Created album object

### Get Album

Get album details.

```http
GET /api/albums/{id}
```

**Response:** Album object

### Update Album

Update album name or description.

```http
PUT /api/albums/{id}
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Updated Name",
  "description": "Updated description"
}
```

**Response:** Updated album object

### Delete Album

Delete an album (photos are not deleted).

```http
DELETE /api/albums/{id}
```

**Response:** 204 No Content

### Get Album Photos

Get all photos in an album.

```http
GET /api/albums/{id}/photos
```

**Response:**
```json
{
  "items": [/* photo objects */],
  "total": 25
}
```

### Add Photos to Album

Add photos to an album.

```http
POST /api/albums/{id}/photos
Content-Type: application/json
```

**Request Body:**
```json
{
  "photoIds": ["uuid1", "uuid2"]
}
```

**Response:**
```json
{
  "added": 2
}
```

### Remove Photos from Album

Remove photos from an album.

```http
DELETE /api/albums/{id}/photos
Content-Type: application/json
```

**Request Body:**
```json
{
  "photoIds": ["uuid1", "uuid2"]
}
```

**Response:**
```json
{
  "removed": 2
}
```

### Set Album Cover

Set the cover photo for an album.

```http
PUT /api/albums/{id}/cover
Content-Type: application/json
```

**Request Body:**
```json
{
  "photoId": "cover-photo-uuid"
}
```

**Response:** Updated album object

---

## Photo Sharing

### List Shares

Get all share links created by the current user.

```http
GET /api/shares
```

**Response:**
```json
{
  "items": [
    {
      "id": "uuid",
      "token": "abc123xyz",
      "url": "/s/abc123xyz",
      "targetType": "PHOTO",
      "targetId": "photo-uuid",
      "targetName": "sunset.jpg",
      "targetThumbnailUrl": "/api/photos/photo-uuid/thumbnail",
      "hasPassword": true,
      "downloadAllowed": true,
      "maxViews": 100,
      "viewCount": 45,
      "downloadCount": 12,
      "expiresAt": "2025-02-15T10:30:00Z",
      "isExpired": false,
      "isActive": true,
      "lastAccessedAt": "2025-01-20T15:00:00Z",
      "createdAt": "2025-01-15T10:30:00Z"
    }
  ]
}
```

### Create Share

Create a new share link.

```http
POST /api/shares
Content-Type: application/json
```

**Request Body:**
```json
{
  "targetType": "PHOTO",  // PHOTO, ALBUM, or FOLDER
  "targetId": "photo-uuid",
  "password": "optional-password",
  "downloadAllowed": true,
  "maxViews": 100,  // null for unlimited
  "expiresAt": "2025-02-15T10:30:00Z"  // null for never
}
```

**Response:** Created share object with token

### Get Share

Get share details.

```http
GET /api/shares/{id}
```

**Response:** Share object

### Update Share

Update share settings.

```http
PUT /api/shares/{id}
Content-Type: application/json
```

**Request Body:**
```json
{
  "password": "new-password",  // null to remove
  "downloadAllowed": false,
  "maxViews": 50,
  "expiresAt": "2025-03-01T00:00:00Z"
}
```

**Response:** Updated share object

### Delete Share

Delete a share link.

```http
DELETE /api/shares/{id}
```

**Response:** 204 No Content

### Activate Share

Reactivate a deactivated share.

```http
PUT /api/shares/{id}/activate
```

**Response:** Updated share object

### Deactivate Share

Temporarily disable a share without deleting.

```http
PUT /api/shares/{id}/deactivate
```

**Response:** Updated share object

### Get Shares for Photo

Get all shares for a specific photo.

```http
GET /api/shares/photo/{photoId}
```

**Response:**
```json
{
  "items": [/* share objects */]
}
```

---

## Public Share Access

These endpoints do not require authentication.

### Get Share Info

Get public information about a share.

```http
GET /s/{token}
```

**Response:**
```json
{
  "targetType": "PHOTO",
  "targetName": "sunset.jpg",
  "hasPassword": true,
  "downloadAllowed": true
}
```

### Verify Password

Verify password for a protected share.

```http
POST /s/{token}/verify
Content-Type: application/json
```

**Request Body:**
```json
{
  "password": "user-entered-password"
}
```

**Response:**
```json
{
  "valid": true,
  "accessToken": "temporary-access-token"
}
```

### Get Shared Photo

Get the shared photo content.

```http
GET /s/{token}/photo
```

**Headers (for password-protected shares):**
```
X-Share-Access: temporary-access-token
```

**Response:** Binary image file

### Get Thumbnail

Get thumbnail for shared photo.

```http
GET /s/{token}/thumbnail
```

**Response:** Thumbnail image

### Download Shared Photo

Download the photo (if downloads enabled).

```http
GET /s/{token}/download
```

**Response:** Binary file with Content-Disposition header

### Get Shared Folder/Album Photos

Get all photos in a shared folder or album.

```http
GET /s/{token}/photos
```

**Response:**
```json
{
  "items": [/* photo objects with limited info */],
  "total": 25
}
```

### Get Specific Photo from Shared Collection

Get a specific photo from a shared folder/album.

```http
GET /s/{token}/photos/{photoId}
```

**Response:** Binary image file

---

## Event Log

### Get Events

Get event history.

```http
GET /api/events
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `photoId` | uuid | Filter by photo ID |
| `type` | string | Filter by event type |
| `limit` | int | Max results (default 50) |

**Event Types:**
- `PHOTO_UPLOADED`
- `TAG_ADDED`
- `TAG_REMOVED`
- `PHOTO_APPROVED`
- `PHOTO_REJECTED`
- `PHOTO_DELETED`
- `PHOTO_PROCESSING`
- `PHOTO_PROCESSED`
- `PHOTO_FAILED`

**Response:**
```json
{
  "items": [
    {
      "id": "uuid",
      "photoId": "photo-uuid",
      "type": "TAG_ADDED",
      "message": "Tag 'sunset' added to photo",
      "timestamp": "2025-01-15T10:35:00Z"
    }
  ]
}
```

---

## Admin Endpoints

These endpoints require admin role.

### Dashboard

Get system statistics.

```http
GET /api/admin/dashboard
```

**Response:**
```json
{
  "totalUsers": 150,
  "activeUsers": 142,
  "suspendedUsers": 8,
  "totalPhotos": 25000,
  "totalStorageBytes": 5368709120,
  "uploadsToday": 150,
  "uploadsThisWeek": 850,
  "uploadsThisMonth": 3200
}
```

### List Users

Get all users with statistics.

```http
GET /api/admin/users
```

**Response:**
```json
{
  "items": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "username": "johndoe",
      "role": "USER",
      "status": "ACTIVE",
      "photoCount": 250,
      "storageUsedBytes": 536870912,
      "aiTaggingEnabled": true,
      "aiTaggingEventsCount": 180,
      "lastLoginAt": "2025-01-20T15:00:00Z",
      "createdAt": "2024-06-15T10:30:00Z"
    }
  ]
}
```

### Get User Details

Get detailed information about a user.

```http
GET /api/admin/users/{userId}
```

**Response:** Detailed user object

### Update User Settings

Update settings for a user.

```http
PUT /api/admin/users/{userId}/settings
Content-Type: application/json
```

**Request Body:**
```json
{
  "aiTaggingEnabled": false
}
```

**Response:** Updated user object

### Suspend User

Suspend a user account.

```http
POST /api/admin/users/{userId}/suspend
Content-Type: application/json
```

**Request Body:**
```json
{
  "reason": "Violation of terms of service"
}
```

**Response:** Updated user object

### Reactivate User

Reactivate a suspended user.

```http
POST /api/admin/users/{userId}/reactivate
```

**Response:** Updated user object

### Get Audit Log

Get admin action history.

```http
GET /api/admin/audit-log
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | int | Page number (0-indexed) |
| `size` | int | Page size (default 50) |

**Response:**
```json
{
  "items": [
    {
      "id": "uuid",
      "actionType": "USER_SUSPENDED",
      "adminEmail": "admin@example.com",
      "targetUserEmail": "user@example.com",
      "description": "User suspended for ToS violation",
      "reason": "Violation of terms of service",
      "timestamp": "2025-01-15T10:30:00Z"
    }
  ],
  "page": 0,
  "size": 50,
  "totalElements": 125,
  "totalPages": 3
}
```

### Get User Audit Log

Get audit log for a specific user.

```http
GET /api/admin/users/{userId}/audit-log
```

**Response:** Audit entries related to specified user

---

## Authentication

### Sync User

Sync user data after Cognito authentication.

```http
POST /api/auth/sync
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "username": "johndoe"
}
```

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "username": "johndoe",
  "role": "USER",
  "status": "ACTIVE",
  "aiTaggingEnabled": true,
  "lastLoginAt": "2025-01-20T15:00:00Z",
  "createdAt": "2024-06-15T10:30:00Z"
}
```

### Get Current User

Get current user profile.

```http
GET /api/users/me
```

**Response:** Current user object

### Update Profile

Update current user profile.

```http
PUT /api/users/me
Content-Type: application/json
```

**Request Body:**
```json
{
  "username": "newusername"
}
```

**Response:** Updated user object

---

## AI Service

The AI service runs on a separate port/container.

### Health Check

```http
GET /ai/health
```

**Response:**
```json
{
  "status": "healthy",
  "openaiConfigured": true
}
```

### Analyze Image

Analyze a single image and return tags.

```http
POST /ai/analyze
Content-Type: application/json
```

**Request Body:**
```json
{
  "photoId": "photo-uuid"
}
```

**Response:**
```json
{
  "success": true,
  "photoId": "photo-uuid",
  "tags": ["landscape", "mountain", "sunset", "nature", "outdoor"]
}
```

### Analyze and Apply

Analyze and automatically apply tags to the photo.

```http
POST /ai/analyze-and-apply
Content-Type: application/json
```

**Request Body:**
```json
{
  "photoId": "photo-uuid"
}
```

**Response:**
```json
{
  "success": true,
  "photoId": "photo-uuid",
  "tags": ["landscape", "mountain", "sunset"],
  "applied": true,
  "failedTags": []
}
```

### Batch Analyze

Analyze multiple images efficiently.

```http
POST /ai/batch-analyze-and-apply
Content-Type: application/json
```

**Request Body:**
```json
{
  "photoIds": ["uuid1", "uuid2", "uuid3"],
  "imagesPerRequest": 5  // optional, 1-10
}
```

**Response:**
```json
{
  "success": true,
  "total": 3,
  "processed": 3,
  "succeeded": 3,
  "failed": 0,
  "results": [
    {
      "photoId": "uuid1",
      "success": true,
      "tags": ["portrait", "indoor"]
    },
    {
      "photoId": "uuid2",
      "success": true,
      "tags": ["landscape", "outdoor"]
    },
    {
      "photoId": "uuid3",
      "success": true,
      "tags": ["food", "restaurant"]
    }
  ]
}
```

---

## Error Responses

All endpoints return standard error responses:

```json
{
  "error": "Error type",
  "message": "Human-readable error message",
  "status": 400,
  "timestamp": "2025-01-15T10:30:00Z"
}
```

**Common Status Codes:**
| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Missing or invalid token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 409 | Conflict - Resource already exists |
| 413 | Payload Too Large - File too big |
| 429 | Too Many Requests - Rate limited |
| 500 | Internal Server Error |

---

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| Photo upload | 30 files per request |
| AI batch tagging | 100 photos per request |
| General API | 1000 requests/minute |

---

## Internal Endpoints

These endpoints are used for service-to-service communication.

### Apply Tags (AI Service to Backend)

```http
POST /api/internal/photos/{id}/tags
Content-Type: application/json
```

**Request Body:**
```json
{
  "tags": ["tag1", "tag2", "tag3"]
}
```

**Note:** This endpoint does not require authentication and is intended for the AI service only.
