# External Sharing Links Implementation Plan

## Overview

Implement a complete external sharing system for RapidPhotoFlow allowing users to share photos, albums, and folders via secure links with full settings (password, expiration, download controls), a management dashboard, and detailed analytics.

## Implementation Phases

The implementation is divided into 4 phases, each delivering usable functionality:

| Phase | Deliverable | Effort |
|-------|-------------|--------|
| **1** | Basic Photo Sharing (MVP) | 2-3 days |
| **2** | Share Settings & Protection | 2 days |
| **3** | Management Dashboard | 2-3 days |
| **4** | Analytics & Album/Folder Sharing | 3-4 days |

---

## Database Schema

Design upfront to support all phases without breaking migrations:

```sql
CREATE TABLE shared_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token VARCHAR(32) UNIQUE NOT NULL,

    -- Target (exactly one must be non-null)
    photo_id UUID REFERENCES photos(id) ON DELETE CASCADE,
    album_id UUID REFERENCES albums(id) ON DELETE CASCADE,
    folder_id UUID REFERENCES folders(id) ON DELETE CASCADE,

    -- Owner
    created_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Settings (nullable for Phase 1)
    password_hash VARCHAR(60),
    expires_at TIMESTAMP WITH TIME ZONE,
    download_allowed BOOLEAN NOT NULL DEFAULT true,
    download_original BOOLEAN NOT NULL DEFAULT false,
    max_views INTEGER,
    require_email BOOLEAN NOT NULL DEFAULT false,

    -- Status
    is_active BOOLEAN NOT NULL DEFAULT true,

    -- Denormalized analytics
    view_count INTEGER NOT NULL DEFAULT 0,
    download_count INTEGER NOT NULL DEFAULT 0,
    last_accessed_at TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT shared_links_single_target CHECK (
        (CASE WHEN photo_id IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN album_id IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN folder_id IS NOT NULL THEN 1 ELSE 0 END) = 1
    )
);

CREATE TABLE shared_link_accesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shared_link_id UUID NOT NULL REFERENCES shared_links(id) ON DELETE CASCADE,
    accessed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    country_code CHAR(2),
    session_fingerprint VARCHAR(64),
    viewer_email VARCHAR(255),
    action VARCHAR(20) NOT NULL DEFAULT 'VIEW',
    photo_id UUID REFERENCES photos(id)
);

-- Indexes
CREATE UNIQUE INDEX idx_shared_links_token ON shared_links(token);
CREATE INDEX idx_shared_links_user ON shared_links(created_by_user_id, is_active, created_at DESC);
CREATE INDEX idx_shared_links_photo ON shared_links(photo_id) WHERE photo_id IS NOT NULL;
CREATE INDEX idx_accesses_link_time ON shared_link_accesses(shared_link_id, accessed_at DESC);
```

---

## Phase 1: Basic Photo Sharing (MVP)

### Backend Tasks

1. **Create SharedLinkEntity** (`/backend/src/main/java/com/rapidphotoflow/entity/SharedLinkEntity.java`)
   - UUID id, String token, UUID photoId, UUID createdByUserId
   - Boolean downloadAllowed, Boolean isActive, Instant createdAt/updatedAt
   - Pattern: Follow `AlbumEntity.java`

2. **Create SharedLinkRepository** (`/backend/src/main/java/com/rapidphotoflow/repository/SharedLinkRepository.java`)
   - `findByToken(String token)`
   - `findByCreatedByUserIdOrderByCreatedAtDesc(UUID userId)`
   - `findByPhotoId(UUID photoId)`

3. **Create SharedLink Domain Model** (`/backend/src/main/java/com/rapidphotoflow/domain/SharedLink.java`)
   - Include `generateToken()` using SecureRandom (128-bit, base62 encoded)
   - `isAccessible()` method

4. **Create TokenService** (`/backend/src/main/java/com/rapidphotoflow/service/TokenService.java`)
   ```java
   String generateSecureToken();  // 22-char base62 (128-bit entropy)
   String generateSessionFingerprint(String ip, String userAgent);
   ```

5. **Create SharedLinkService** (`/backend/src/main/java/com/rapidphotoflow/service/SharedLinkService.java`)
   - `createShareLink(UUID photoId)` - validate ownership via CurrentUserService
   - `getSharesByUser()` - list all shares for current user
   - `getShareByToken(String token)` - public access (no user check)
   - `deleteShare(UUID shareId)` - validate ownership

6. **Create SharedLinkController** (`/backend/src/main/java/com/rapidphotoflow/controller/SharedLinkController.java`)
   - `POST /api/shares` - create share
   - `GET /api/shares` - list user's shares
   - `DELETE /api/shares/{id}` - delete share

7. **Create PublicShareController** (`/backend/src/main/java/com/rapidphotoflow/controller/PublicShareController.java`)
   - `GET /s/{token}` - get share metadata
   - `GET /s/{token}/photo` - get photo content

8. **Update SecurityConfig** - Add `/s/**` to permitAll()

9. **Create DTOs**
   - `CreateShareRequest`, `SharedLinkDTO`, `SharedLinkListResponse`, `PublicShareResponse`

### Frontend Tasks

10. **Add TypeScript types** (`/frontend/src/lib/api/types.ts`)
    ```typescript
    interface SharedLink { id, token, url, photoId, photoName, thumbnailUrl, downloadAllowed, isActive, createdAt }
    interface PublicShareResponse { photoName, thumbnailUrl, photoUrl, downloadAllowed }
    ```

11. **Add shareClient** (`/frontend/src/lib/api/client.ts`)
    - `createShare(photoId)`, `getShares()`, `deleteShare(id)`, `getPublicShare(token)`

12. **Create CreateShareModal** (`/frontend/src/components/shares/CreateShareModal.tsx`)
    - Photo preview, generated link, copy button
    - Pattern: Follow `CreateFolderModal.tsx`

13. **Add Share button to PhotoPreviewModal** (`/frontend/src/components/shared/PhotoPreviewModal.tsx`)
    - Add Share2 icon button in actions area

14. **Create SharePage** (`/frontend/src/pages/SharePage.tsx`)
    - Public viewer at `/s/:token`
    - Full-screen photo, download button, error states

15. **Update App.tsx** - Add route `/s/:token` (outside ProtectedRoute)

---

## Phase 2: Share Settings & Protection

### Backend Tasks

1. **Create PasswordService** (`/backend/src/main/java/com/rapidphotoflow/service/PasswordService.java`)
   - `hashPassword(String raw)` - BCrypt cost factor 12
   - `verifyPassword(String raw, String hash)`

2. **Extend SharedLinkEntity** - Activate: passwordHash, expiresAt, downloadOriginal, maxViews, requireEmail

3. **Extend SharedLinkService**
   - `createShareWithSettings(CreateShareRequest request)`
   - `updateShare(UUID id, UpdateShareRequest request)`
   - `verifyPassword(String token, String password)`
   - `isExpired(SharedLink)`, `hasReachedMaxViews(SharedLink, int views)`

4. **Update PublicShareController**
   - `POST /s/{token}/verify` - verify password
   - Update `GET /s/{token}` to include `requiresPassword: boolean`

5. **Create Rate Limiting** for password attempts (5/min per token+IP)

### Frontend Tasks

6. **Extend CreateShareModal** - Add settings panel:
   - Password input (show/hide toggle)
   - Expiration dropdown (Never, 1h, 24h, 7d, 30d, Custom)
   - Download allowed toggle, max views input

7. **Create PasswordGate** (`/frontend/src/components/shares/PasswordGate.tsx`)
   - Password form, error handling, session storage for verified tokens

8. **Update SharePage** - Check `requiresPassword`, show PasswordGate if needed

9. **Create EditShareModal** (`/frontend/src/components/shares/EditShareModal.tsx`)

---

## Phase 3: Management Dashboard

### Backend Tasks

1. **Extend SharedLinkController**
   - `PUT /api/shares/{id}` - update settings
   - `PUT /api/shares/{id}/deactivate`, `PUT /api/shares/{id}/activate`
   - `GET /api/shares?status={active|expired|disabled}`

2. **Extend SharedLinkDTO** - Add `status`, `viewCount`, `lastAccessedAt`

### Frontend Tasks

3. **Create ShareManagementPage** (`/frontend/src/pages/ShareManagementPage.tsx`)
   - Table view of all shares, filter by status
   - Route: `/shares`

4. **Create ShareLinkCard** (`/frontend/src/components/shares/ShareLinkCard.tsx`)
   - Thumbnail, link info, quick actions (Copy, Edit, Deactivate, Delete)

5. **Create SharesContext** (`/frontend/src/lib/SharesContext.tsx`)
   - Pattern: Follow `FoldersContext.tsx`

6. **Update Layout.tsx** - Add "Shares" to navigation

7. **Update App.tsx** - Add protected route `/shares`

---

## Phase 4: Analytics & Album/Folder Sharing

### Backend Tasks

1. **Create SharedLinkAccessEntity** (`/backend/src/main/java/com/rapidphotoflow/entity/SharedLinkAccessEntity.java`)

2. **Create AccessTrackingService** (`/backend/src/main/java/com/rapidphotoflow/service/AccessTrackingService.java`)
   - `recordAccess(UUID linkId, AccessDetails details)`
   - Async GeoIP enrichment

3. **Create GeoIpService** (`/backend/src/main/java/com/rapidphotoflow/service/GeoIpService.java`)
   - Local: Use IP-API.com (free, 45 req/min) - full feature parity
   - Production: MaxMind GeoLite2 database for better performance/privacy

4. **Extend SharedLinkEntity** - Enable album_id, folder_id columns

5. **Add Analytics Endpoints**
   - `GET /api/shares/{id}/stats` - aggregated stats
   - `GET /api/shares/{id}/accesses` - paginated access log

6. **Extend PublicShareController**
   - `GET /s/{token}/photos` - list photos for album/folder shares
   - Add access logging to all GET endpoints

### Frontend Tasks

7. **Create PublicGallery** (`/frontend/src/components/shares/PublicGallery.tsx`)
   - Grid of photos for album/folder shares

8. **Create ShareStatsPanel** (`/frontend/src/components/shares/ShareStatsPanel.tsx`)
   - View/download counts, views over time chart, top countries

9. **Update SharePage** - Detect share type, render gallery for collections

10. **Add Share to Folder context menu** (`/frontend/src/components/folders/FolderTree.tsx`)

---

## Security Considerations

1. **Token Security**: 128-bit entropy via SecureRandom, base62 encoded (22 chars)
2. **Password Hashing**: BCrypt with cost factor 12
3. **Rate Limiting**:
   - Public endpoints: 100 req/min per IP
   - Password verification: 5 attempts/min per token+IP
4. **Validation**: Always verify ownership via CurrentUserService before mutations
5. **Public Endpoints**: Add `/s/**` to SecurityConfig permitAll()

---

## Critical Files to Modify

### Backend (Create)
- `/backend/src/main/java/com/rapidphotoflow/entity/SharedLinkEntity.java`
- `/backend/src/main/java/com/rapidphotoflow/entity/SharedLinkAccessEntity.java`
- `/backend/src/main/java/com/rapidphotoflow/repository/SharedLinkRepository.java`
- `/backend/src/main/java/com/rapidphotoflow/service/SharedLinkService.java`
- `/backend/src/main/java/com/rapidphotoflow/service/TokenService.java`
- `/backend/src/main/java/com/rapidphotoflow/service/PasswordService.java`
- `/backend/src/main/java/com/rapidphotoflow/service/AccessTrackingService.java`
- `/backend/src/main/java/com/rapidphotoflow/controller/SharedLinkController.java`
- `/backend/src/main/java/com/rapidphotoflow/controller/PublicShareController.java`
- DTOs: `CreateShareRequest`, `UpdateShareRequest`, `SharedLinkDTO`, `PublicShareResponse`, etc.

### Backend (Modify)
- `/backend/src/main/java/com/rapidphotoflow/config/SecurityConfig.java` - Add `/s/**` to permitAll
- `/backend/src/main/java/com/rapidphotoflow/config/LocalSecurityConfig.java` - Same
- `/backend/src/main/java/com/rapidphotoflow/domain/EventType.java` - Add SHARED_LINK_* events

### Frontend (Create)
- `/frontend/src/pages/SharePage.tsx` - Public viewer
- `/frontend/src/pages/ShareManagementPage.tsx` - Dashboard
- `/frontend/src/components/shares/CreateShareModal.tsx`
- `/frontend/src/components/shares/EditShareModal.tsx`
- `/frontend/src/components/shares/PasswordGate.tsx`
- `/frontend/src/components/shares/ShareLinkCard.tsx`
- `/frontend/src/components/shares/ShareStatsPanel.tsx`
- `/frontend/src/components/shares/PublicGallery.tsx`
- `/frontend/src/lib/SharesContext.tsx`

### Frontend (Modify)
- `/frontend/src/lib/api/types.ts` - Add share types
- `/frontend/src/lib/api/client.ts` - Add shareClient
- `/frontend/src/App.tsx` - Add routes `/s/:token` and `/shares`
- `/frontend/src/components/shared/PhotoPreviewModal.tsx` - Add Share button
- `/frontend/src/components/Layout.tsx` - Add Shares nav link

---

## Definition of Done

- [ ] Phase 1: User can share photo, recipient can view without auth
- [ ] Phase 2: Password protection and expiration work end-to-end
- [ ] Phase 3: /shares dashboard lists all shares with management actions
- [ ] Phase 4: Access analytics displayed, album/folder sharing works
