# External Sharing Links Plan

## Overview

Implement a secure external sharing system for RapidPhotoFlow that allows users to share photos, albums, and folders with external users via shareable links. Recipients can view shared content without requiring an account. This feature enables collaboration with clients, family members, or anyone who needs to view photos without full platform access.

## Goals

- [ ] Allow users to generate shareable links for individual photos
- [ ] Allow users to generate shareable links for albums (requires album feature)
- [ ] Allow users to generate shareable links for folders (requires folder feature)
- [ ] Support optional password protection for shared links
- [ ] Support expiration dates for time-limited access
- [ ] Enable download permissions control (view-only vs. downloadable)
- [ ] Track link access analytics (view count, last accessed)
- [ ] Allow users to revoke/disable shared links at any time
- [ ] Maintain security while providing seamless access for recipients

## Requirements

### Functional Requirements

1. **Link Generation**
   - Generate unique, secure tokens for shared links
   - Support sharing: single photo, album, or folder
   - Configure link settings: password, expiration, download permission
   - Copy link to clipboard with one click
   - QR code generation for easy mobile sharing

2. **Link Settings**
   - **Password Protection**: Optional password required to view
   - **Expiration**: Never, 1 hour, 24 hours, 7 days, 30 days, custom date
   - **Download Permission**: View only, allow download, allow download original quality
   - **Access Limit**: Unlimited views, or limit to N views
   - **Require Email**: Optionally collect viewer's email before access

3. **Link Management**
   - View all active shared links in a management dashboard
   - See link metadata: created date, expiration, view count, last accessed
   - Edit link settings after creation
   - Disable/enable links without deleting
   - Delete links permanently

4. **Viewer Experience**
   - Clean, branded viewing page (no login required)
   - Password entry page if protected
   - Gallery view for albums/folders
   - Lightbox view for individual photos
   - Download button (if permitted)
   - Mobile-responsive design
   - Optional "Request Access" for expired/disabled links

5. **Analytics & Notifications**
   - Track: views, unique visitors, downloads, geographic data (optional)
   - Optional email notification when link is accessed
   - View access log for each shared link

### Non-Functional Requirements

- Tokens must be cryptographically secure (256-bit minimum)
- Shared content must load within 2 seconds
- Support concurrent access from 1000+ viewers
- Links should be short and memorable where possible
- GDPR compliant: ability to delete all tracking data

### Security Requirements

- Tokens must be unpredictable and unguessable
- Rate limiting on link access to prevent brute force
- Password hashing for protected links (bcrypt)
- Prevent enumeration attacks
- Audit logging for all share actions
- Content served through CDN without exposing S3 directly

## Technical Design

### URL Structure

```
Public share URLs:
https://app.rapidphotoflow.com/s/{token}           # Short token
https://app.rapidphotoflow.com/share/{token}       # Alternative format

Token format options:
- Short: 8-character alphanumeric (62^8 = 218 trillion combinations)
- Long: UUID-based for maximum security
- Custom: User-defined slug (premium feature)

Examples:
https://app.rapidphotoflow.com/s/Xk9mP2nQ          # Photo or album
https://app.rapidphotoflow.com/s/Xk9mP2nQ?p=1      # Password prompt
```

### Database Schema

```sql
-- Shared links table
CREATE TABLE shared_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token VARCHAR(64) UNIQUE NOT NULL,              -- URL token

    -- What is being shared (one of these will be set)
    photo_id UUID REFERENCES photos(id) ON DELETE CASCADE,
    album_id UUID REFERENCES albums(id) ON DELETE CASCADE,
    folder_id UUID REFERENCES folders(id) ON DELETE CASCADE,

    -- Owner
    created_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Settings
    password_hash VARCHAR(255),                     -- bcrypt hash, NULL = no password
    expires_at TIMESTAMP,                           -- NULL = never expires
    download_allowed BOOLEAN NOT NULL DEFAULT false,
    download_original BOOLEAN NOT NULL DEFAULT false,
    max_views INTEGER,                              -- NULL = unlimited
    require_email BOOLEAN NOT NULL DEFAULT false,

    -- Status
    is_active BOOLEAN NOT NULL DEFAULT true,

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    -- Constraints: exactly one target must be set
    CONSTRAINT shared_link_target CHECK (
        (photo_id IS NOT NULL)::int +
        (album_id IS NOT NULL)::int +
        (folder_id IS NOT NULL)::int = 1
    )
);

CREATE INDEX idx_shared_links_token ON shared_links(token);
CREATE INDEX idx_shared_links_user ON shared_links(created_by_user_id);
CREATE INDEX idx_shared_links_photo ON shared_links(photo_id) WHERE photo_id IS NOT NULL;
CREATE INDEX idx_shared_links_album ON shared_links(album_id) WHERE album_id IS NOT NULL;
CREATE INDEX idx_shared_links_folder ON shared_links(folder_id) WHERE folder_id IS NOT NULL;

-- Link access log table
CREATE TABLE shared_link_accesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shared_link_id UUID NOT NULL REFERENCES shared_links(id) ON DELETE CASCADE,

    -- Access info
    accessed_at TIMESTAMP NOT NULL DEFAULT NOW(),
    ip_address VARCHAR(45),                         -- IPv4 or IPv6
    user_agent TEXT,
    country_code VARCHAR(2),                        -- GeoIP lookup

    -- Optional collected data
    viewer_email VARCHAR(255),                      -- If require_email was set

    -- Action
    action VARCHAR(20) NOT NULL DEFAULT 'view',     -- 'view', 'download', 'download_original'
    photo_id UUID REFERENCES photos(id)             -- Which photo was viewed/downloaded (for albums/folders)
);

CREATE INDEX idx_link_accesses_link ON shared_link_accesses(shared_link_id);
CREATE INDEX idx_link_accesses_time ON shared_link_accesses(accessed_at);
```

### Backend Implementation

#### New Domain Models

**SharedLink.java**
```java
public class SharedLink {
    private UUID id;
    private String token;

    // Target (one of these)
    private UUID photoId;
    private UUID albumId;
    private UUID folderId;

    // Owner
    private UUID createdByUserId;

    // Settings
    private String passwordHash;
    private Instant expiresAt;
    private boolean downloadAllowed;
    private boolean downloadOriginal;
    private Integer maxViews;
    private boolean requireEmail;

    // Status
    private boolean isActive;

    private Instant createdAt;
    private Instant updatedAt;

    // Domain methods
    public boolean isExpired();
    public boolean isPasswordProtected();
    public boolean hasReachedMaxViews(int currentViews);
    public boolean canAccess(String password, int currentViews);
    public void setPassword(String rawPassword);     // Hashes password
    public boolean verifyPassword(String rawPassword);
    public void deactivate();
    public void reactivate();
}
```

**SharedLinkAccess.java**
```java
public class SharedLinkAccess {
    private UUID id;
    private UUID sharedLinkId;
    private Instant accessedAt;
    private String ipAddress;
    private String userAgent;
    private String countryCode;
    private String viewerEmail;
    private AccessAction action;  // VIEW, DOWNLOAD, DOWNLOAD_ORIGINAL
    private UUID photoId;         // For tracking which photo in album/folder
}
```

#### New Event Types

Add to `EventType.java`:
```java
SHARED_LINK_CREATED,
SHARED_LINK_UPDATED,
SHARED_LINK_ACCESSED,
SHARED_LINK_DEACTIVATED,
SHARED_LINK_DELETED,
SHARED_CONTENT_DOWNLOADED
```

#### New Services

**SharedLinkService.java**
```java
public interface SharedLinkService {
    // CRUD
    SharedLink createLink(CreateSharedLinkRequest request);
    SharedLink updateLink(UUID linkId, UpdateSharedLinkRequest request);
    void deleteLink(UUID linkId);
    void deactivateLink(UUID linkId);
    void reactivateLink(UUID linkId);

    // Queries
    SharedLink getLinkByToken(String token);
    List<SharedLink> getLinksForUser(UUID userId);
    List<SharedLink> getLinksForPhoto(UUID photoId);
    List<SharedLink> getLinksForAlbum(UUID albumId);
    List<SharedLink> getLinksForFolder(UUID folderId);

    // Access
    SharedLinkAccessResult validateAccess(String token, String password);
    void recordAccess(String token, AccessDetails details);

    // Analytics
    SharedLinkStats getStats(UUID linkId);
    List<SharedLinkAccess> getAccessLog(UUID linkId, Pageable pageable);
}
```

**TokenService.java**
```java
public interface TokenService {
    String generateToken();           // Secure random token
    String generateShortToken();      // 8-char alphanumeric
    boolean isValidTokenFormat(String token);
}
```

#### New Controllers

**SharedLinkController.java** - `/api/shares` (Authenticated)
```
POST   /api/shares                    # Create shared link
GET    /api/shares                    # List user's shared links
GET    /api/shares/{id}               # Get link details
PUT    /api/shares/{id}               # Update link settings
DELETE /api/shares/{id}               # Delete link
PUT    /api/shares/{id}/deactivate    # Deactivate link
PUT    /api/shares/{id}/reactivate    # Reactivate link
GET    /api/shares/{id}/stats         # Get link analytics
GET    /api/shares/{id}/accesses      # Get access log
```

**PublicShareController.java** - `/s` (Public, no auth)
```
GET    /s/{token}                     # Get shared content metadata
POST   /s/{token}/verify              # Verify password
GET    /s/{token}/photos              # Get photos (for album/folder shares)
GET    /s/{token}/photo/{photoId}     # Get specific photo content
GET    /s/{token}/download/{photoId}  # Download photo (if allowed)
POST   /s/{token}/email               # Submit email (if required)
```

#### Security Configuration

Update `SecurityConfig.java`:
```java
// Add public share endpoints to permit list
.requestMatchers("/s/**").permitAll()
.requestMatchers("/share/**").permitAll()

// Rate limiting for public endpoints
@Bean
public RateLimiter shareRateLimiter() {
    return RateLimiter.create(100);  // 100 requests per second per IP
}
```

### Frontend Implementation

#### New Pages

**SharePage.tsx** (Public - `/s/{token}`)
- Password entry form if protected
- Email collection form if required
- Photo viewer for single photo shares
- Gallery grid for album/folder shares
- Download buttons (if permitted)
- Branded footer with "Powered by RapidPhotoFlow"
- Expired/disabled link error states

**ShareManagementPage.tsx** (Authenticated - `/shares`)
- Table/list of all user's shared links
- Filter by: active/inactive, type (photo/album/folder), expiration
- Quick actions: copy link, edit, deactivate, delete
- Bulk operations

#### New Components

**CreateShareModal.tsx**
- Target preview (photo thumbnail or album/folder name)
- Password toggle and input
- Expiration dropdown/date picker
- Download permission toggles
- Email requirement toggle
- Generated link with copy button
- QR code display

**ShareSettingsModal.tsx**
- Edit existing share settings
- View current stats (views, last accessed)
- Deactivate/reactivate toggle
- Delete confirmation

**ShareLinkCard.tsx**
- Card component for share management list
- Shows: target thumbnail, type, created date, views, status
- Quick action buttons

**ShareStatsPanel.tsx**
- View count over time chart
- Download count
- Geographic distribution (map)
- Recent access log table

**PublicGallery.tsx**
- Grid layout for album/folder photos
- Lightbox on click
- Download all button (if permitted)
- Responsive design

**PasswordGate.tsx**
- Password input form
- Error state for wrong password
- Remember password option (localStorage)

**EmailGate.tsx**
- Email input form
- Privacy notice
- Proceed button

#### State Management

**SharesContext.tsx**
```typescript
interface SharesContextType {
    shares: SharedLink[];
    loading: boolean;
    createShare: (request: CreateShareRequest) => Promise<SharedLink>;
    updateShare: (id: string, updates: UpdateShareRequest) => Promise<SharedLink>;
    deleteShare: (id: string) => Promise<void>;
    deactivateShare: (id: string) => Promise<void>;
    reactivateShare: (id: string) => Promise<void>;
    refreshShares: () => Promise<void>;
}
```

#### New API Functions

**api/sharesApi.ts**
```typescript
// Authenticated endpoints
createShare(request: CreateShareRequest): Promise<SharedLink>
getShares(): Promise<SharedLink[]>
getShare(id: string): Promise<SharedLink>
updateShare(id: string, request: UpdateShareRequest): Promise<SharedLink>
deleteShare(id: string): Promise<void>
deactivateShare(id: string): Promise<void>
reactivateShare(id: string): Promise<void>
getShareStats(id: string): Promise<ShareStats>
getShareAccessLog(id: string, page: number): Promise<ShareAccessLogResponse>

// Public endpoints (no auth)
getPublicShare(token: string): Promise<PublicShareResponse>
verifySharePassword(token: string, password: string): Promise<VerifyResponse>
submitShareEmail(token: string, email: string): Promise<void>
getPublicPhotos(token: string): Promise<Photo[]>
```

#### Types

**types/sharing.ts**
```typescript
interface SharedLink {
    id: string;
    token: string;
    url: string;  // Full URL
    type: 'photo' | 'album' | 'folder';
    targetId: string;
    targetName: string;
    targetThumbnail?: string;
    hasPassword: boolean;
    expiresAt: string | null;
    downloadAllowed: boolean;
    downloadOriginal: boolean;
    maxViews: number | null;
    requireEmail: boolean;
    isActive: boolean;
    viewCount: number;
    lastAccessedAt: string | null;
    createdAt: string;
}

interface CreateShareRequest {
    photoId?: string;
    albumId?: string;
    folderId?: string;
    password?: string;
    expiresAt?: string;
    expiresIn?: 'never' | '1h' | '24h' | '7d' | '30d';
    downloadAllowed?: boolean;
    downloadOriginal?: boolean;
    maxViews?: number;
    requireEmail?: boolean;
}

interface PublicShareResponse {
    type: 'photo' | 'album' | 'folder';
    name: string;
    photoCount?: number;
    requiresPassword: boolean;
    requiresEmail: boolean;
    downloadAllowed: boolean;
    isExpired: boolean;
    isDisabled: boolean;
    ownerName?: string;  // Optional branding
}

interface ShareStats {
    totalViews: number;
    uniqueVisitors: number;
    totalDownloads: number;
    viewsByDay: { date: string; count: number }[];
    topCountries: { country: string; count: number }[];
}
```

### Integration with Folder/Album Feature

This feature depends on the folder/album implementation for sharing albums and folders. However, photo sharing can be implemented independently first.

**Sharing UI Entry Points:**
1. Photo card context menu: "Share..."
2. Photo preview modal: Share button
3. Album card context menu: "Share album..."
4. Folder context menu: "Share folder..."
5. Bulk action toolbar: "Share selected" (creates album, then shares)

### Migration Strategy

1. **Phase 1: Photo Sharing Only**
   - Implement shared_links table with photo_id only
   - Deploy public share pages
   - No dependency on folder/album feature

2. **Phase 2: Album/Folder Sharing**
   - Add album_id, folder_id columns
   - Update public pages for gallery view
   - Requires folder/album feature to be complete

3. **Phase 3: Analytics**
   - Add shared_link_accesses table
   - Implement GeoIP lookup
   - Build analytics dashboard

## Implementation Steps

### Phase 1: Core Infrastructure
1. [ ] Create database migration for shared_links table
2. [ ] Create database migration for shared_link_accesses table
3. [ ] Create SharedLinkEntity and SharedLinkRepository
4. [ ] Create SharedLinkAccessEntity and SharedLinkAccessRepository
5. [ ] Implement TokenService for secure token generation
6. [ ] Create SharedLink domain model with password hashing
7. [ ] Add new event types to EventType enum
8. [ ] Implement SharedLinkService CRUD operations
9. [ ] Implement access validation logic
10. [ ] Write unit tests for SharedLinkService

### Phase 2: Backend API
11. [ ] Create SharedLinkController (authenticated endpoints)
12. [ ] Create PublicShareController (public endpoints)
13. [ ] Add rate limiting to public endpoints
14. [ ] Update SecurityConfig for public share routes
15. [ ] Implement access logging
16. [ ] Write integration tests for share endpoints
17. [ ] Add GeoIP lookup service (optional)

### Phase 3: Frontend - Share Creation
18. [ ] Create TypeScript types for sharing
19. [ ] Implement sharesApi.ts functions
20. [ ] Build CreateShareModal component
21. [ ] Add "Share" action to PhotoCard context menu
22. [ ] Add "Share" button to PhotoPreviewModal
23. [ ] Implement copy-to-clipboard functionality
24. [ ] Add QR code generation (using qrcode library)

### Phase 4: Frontend - Public View
25. [ ] Create SharePage route (`/s/:token`)
26. [ ] Build PasswordGate component
27. [ ] Build EmailGate component
28. [ ] Build single photo public viewer
29. [ ] Implement download functionality
30. [ ] Add error states (expired, disabled, not found)
31. [ ] Mobile responsive design

### Phase 5: Share Management
32. [ ] Create ShareManagementPage (`/shares`)
33. [ ] Build ShareLinkCard component
34. [ ] Implement ShareSettingsModal (edit)
35. [ ] Create SharesContext for state management
36. [ ] Add shares link to navigation
37. [ ] Implement deactivate/reactivate actions
38. [ ] Implement delete with confirmation

### Phase 6: Album/Folder Sharing
39. [ ] Update shared_links table for album_id, folder_id
40. [ ] Update PublicShareController for gallery endpoints
41. [ ] Build PublicGallery component
42. [ ] Add share actions to album/folder context menus
43. [ ] Implement "Download All" for album shares

### Phase 7: Analytics
44. [ ] Build ShareStatsPanel component
45. [ ] Create analytics API endpoints
46. [ ] Implement view charts (using recharts/chart.js)
47. [ ] Add geographic distribution map
48. [ ] Build access log table with pagination

### Phase 8: Polish & Testing
49. [ ] Write frontend component tests
50. [ ] Write E2E tests for share creation flow
51. [ ] Write E2E tests for public access flow
52. [ ] Security audit (token entropy, rate limiting)
53. [ ] Performance testing for high-traffic shares
54. [ ] Accessibility audit
55. [ ] Add email notifications for link access (optional)

## Technical Considerations

- **Token Security**: Use `SecureRandom` with 256 bits, encode as base62 for URL safety
- **Password Storage**: bcrypt with cost factor 12
- **Rate Limiting**: 10 password attempts per minute per IP to prevent brute force
- **CDN Integration**: Serve images through CloudFront with signed URLs for shared content
- **Cache Headers**: Set appropriate cache headers for public pages
- **SEO**: Add noindex meta tags to prevent shared content from being indexed
- **CORS**: Configure CORS for embedding shared content (optional iframe support)
- **Abuse Prevention**: Monitor for suspicious sharing patterns
- **Data Retention**: Define policy for access log retention (e.g., 90 days)

## Security Considerations

1. **Token Generation**
   - Minimum 128 bits of entropy
   - Cryptographically secure random number generator
   - No sequential or predictable patterns

2. **Access Control**
   - Validate ownership before share operations
   - Check link status (active, not expired, views remaining)
   - Verify password before content access

3. **Rate Limiting**
   - Public endpoints: 100 req/min per IP
   - Password verification: 10 attempts/min per token
   - Download: 50 downloads/hour per token

4. **Privacy**
   - Optional: Allow users to disable access logging
   - Comply with GDPR data deletion requests
   - Don't expose owner information without consent

## Open Questions

1. Should shared links be transferable (can recipient share the link)?
2. Custom branded share pages for premium users?
3. Watermarking for downloaded images?
4. Allow comments/reactions on shared content?
5. Integration with social media sharing (Open Graph tags)?
6. Webhook notifications for enterprise users?

## Notes

- Created: 2025-12-01
- Dependency: folder-album-implementation.md (for album/folder sharing)
- Photo sharing can be implemented independently as Phase 1
