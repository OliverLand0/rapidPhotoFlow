# Folder/Album Implementation Plan

## Overview

Implement a hierarchical folder and album organization system for RapidPhotoFlow. This feature will allow users to organize their photos into nested folders and create albums (virtual collections that don't affect folder structure). Currently, all photos exist in a flat collection filtered only by status, tags, and search.

## Goals

- [ ] Allow users to create, rename, and delete folders
- [ ] Support nested folder hierarchy (folders within folders)
- [ ] Allow users to move photos between folders
- [ ] Enable album creation as virtual collections of photos
- [ ] Photos can belong to multiple albums but only one folder
- [ ] Maintain full audit trail via event logging
- [ ] Preserve existing filtering and search capabilities within folder/album context

## Requirements

### Functional Requirements

1. **Folder Management**
   - Create folders with custom names
   - Rename existing folders
   - Delete empty folders (with confirmation)
   - Delete folders with contents (move to trash or cascade delete with confirmation)
   - Nested folder support (unlimited depth, recommend max 10 levels)
   - Root folder is implicit (no parent)

2. **Album Management**
   - Create albums with custom names and optional description
   - Add/remove photos to/from albums
   - Photos can belong to multiple albums
   - Albums are flat (no nesting) to differentiate from folders
   - Delete albums (photos remain in their folders)

3. **Photo Organization**
   - Move single or multiple photos to a folder
   - Copy photos to albums (not move)
   - Bulk operations: move selected photos to folder, add to album
   - Drag-and-drop support in UI

4. **Navigation & Display**
   - Folder tree sidebar navigation
   - Breadcrumb navigation showing current folder path
   - Album list/grid view
   - Filter photos within current folder or album context
   - "All Photos" view that shows everything regardless of folder

### Non-Functional Requirements

- Folder/album operations should complete in < 500ms for typical use
- Support folders with up to 10,000 photos
- Maintain backward compatibility (existing photos go to root folder)

## Technical Design

### Database Schema Changes

#### New Tables

```sql
-- Folders table (hierarchical)
CREATE TABLE folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    parent_id UUID REFERENCES folders(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(name, parent_id, user_id)  -- No duplicate folder names in same parent
);

CREATE INDEX idx_folders_parent ON folders(parent_id);
CREATE INDEX idx_folders_user ON folders(user_id);

-- Albums table (flat collections)
CREATE TABLE albums (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    cover_photo_id UUID REFERENCES photos(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(name, user_id)  -- No duplicate album names per user
);

CREATE INDEX idx_albums_user ON albums(user_id);

-- Album-Photo junction table (many-to-many)
CREATE TABLE album_photos (
    album_id UUID NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
    photo_id UUID NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
    added_at TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (album_id, photo_id)
);

CREATE INDEX idx_album_photos_photo ON album_photos(photo_id);
```

#### Schema Modifications

```sql
-- Add folder_id to photos table
ALTER TABLE photos ADD COLUMN folder_id UUID REFERENCES folders(id) ON DELETE SET NULL;
CREATE INDEX idx_photos_folder ON photos(folder_id);
```

### Backend Implementation

#### New Domain Models

**Folder.java**
```java
public class Folder {
    private UUID id;
    private String name;
    private UUID parentId;
    private UUID userId;
    private Instant createdAt;
    private Instant updatedAt;

    // Domain methods
    public void rename(String newName);
    public void moveTo(UUID newParentId);
    public String getPath(); // e.g., "/Vacation/2024/Summer"
}
```

**Album.java**
```java
public class Album {
    private UUID id;
    private String name;
    private String description;
    private UUID coverPhotoId;
    private UUID userId;
    private Set<UUID> photoIds;
    private Instant createdAt;
    private Instant updatedAt;

    // Domain methods
    public void addPhoto(UUID photoId);
    public void removePhoto(UUID photoId);
    public void setCoverPhoto(UUID photoId);
}
```

#### New Event Types

Add to `EventType.java`:
```java
FOLDER_CREATED,
FOLDER_RENAMED,
FOLDER_MOVED,
FOLDER_DELETED,
ALBUM_CREATED,
ALBUM_UPDATED,
ALBUM_DELETED,
PHOTO_MOVED_TO_FOLDER,
PHOTO_ADDED_TO_ALBUM,
PHOTO_REMOVED_FROM_ALBUM
```

#### New Services

**FolderService.java**
- `createFolder(name, parentId, userId)`
- `renameFolder(folderId, newName)`
- `moveFolder(folderId, newParentId)`
- `deleteFolder(folderId, deleteContents)`
- `getFolderTree(userId)` - returns hierarchical structure
- `getFolderPath(folderId)` - returns breadcrumb path
- `getPhotosInFolder(folderId, pageable, filters)`

**AlbumService.java**
- `createAlbum(name, description, userId)`
- `updateAlbum(albumId, name, description)`
- `deleteAlbum(albumId)`
- `addPhotosToAlbum(albumId, photoIds)`
- `removePhotosFromAlbum(albumId, photoIds)`
- `setCoverPhoto(albumId, photoId)`
- `getAlbums(userId)`
- `getPhotosInAlbum(albumId, pageable, filters)`

#### New Controllers

**FolderController.java** - `/api/folders`
```
GET    /api/folders                 # Get folder tree for current user
POST   /api/folders                 # Create folder
GET    /api/folders/{id}            # Get folder details
PUT    /api/folders/{id}            # Update folder (rename)
DELETE /api/folders/{id}            # Delete folder
PUT    /api/folders/{id}/move       # Move folder to new parent
GET    /api/folders/{id}/photos     # Get photos in folder (paginated)
POST   /api/folders/{id}/photos     # Move photos to folder
```

**AlbumController.java** - `/api/albums`
```
GET    /api/albums                  # Get all albums for current user
POST   /api/albums                  # Create album
GET    /api/albums/{id}             # Get album details
PUT    /api/albums/{id}             # Update album
DELETE /api/albums/{id}             # Delete album
GET    /api/albums/{id}/photos      # Get photos in album (paginated)
POST   /api/albums/{id}/photos      # Add photos to album
DELETE /api/albums/{id}/photos      # Remove photos from album
PUT    /api/albums/{id}/cover       # Set cover photo
```

#### Photo Updates

Modify `PhotoService.java`:
- `movePhotoToFolder(photoId, folderId)`
- `movePhotosToFolder(photoIds, folderId)` - bulk operation
- Update `getPhotos()` to filter by `folderId` parameter

Modify `PhotoController.java`:
- Add `folderId` query parameter to `GET /api/photos`
- Add `PUT /api/photos/{id}/folder` endpoint

### Frontend Implementation

#### New Components

**FolderTree.tsx**
- Collapsible tree view sidebar
- Shows folder hierarchy with icons
- Click to navigate, right-click context menu
- Drag-and-drop targets for moving photos
- "New Folder" button at bottom

**FolderBreadcrumbs.tsx**
- Shows current path: Home > Vacation > 2024 > Summer
- Each segment is clickable
- Displayed above photo grid

**AlbumGrid.tsx**
- Grid of album cards with cover photos
- Shows photo count, creation date
- Click to view album contents

**CreateFolderModal.tsx**
- Input for folder name
- Parent folder selector (optional)

**CreateAlbumModal.tsx**
- Input for album name
- Optional description textarea
- Optional cover photo selector

**MoveToFolderModal.tsx**
- Folder tree for selection
- Used when moving photos via toolbar action

**AddToAlbumModal.tsx**
- Checkbox list of existing albums
- Option to create new album inline

#### State Management Updates

**FoldersContext.tsx**
```typescript
interface FoldersContextType {
    folders: Folder[];
    currentFolderId: string | null;
    folderPath: Folder[];
    loading: boolean;
    createFolder: (name: string, parentId?: string) => Promise<Folder>;
    renameFolder: (id: string, name: string) => Promise<void>;
    deleteFolder: (id: string) => Promise<void>;
    moveFolder: (id: string, parentId: string | null) => Promise<void>;
    setCurrentFolder: (id: string | null) => void;
}
```

**AlbumsContext.tsx**
```typescript
interface AlbumsContextType {
    albums: Album[];
    currentAlbumId: string | null;
    loading: boolean;
    createAlbum: (name: string, description?: string) => Promise<Album>;
    updateAlbum: (id: string, updates: Partial<Album>) => Promise<void>;
    deleteAlbum: (id: string) => Promise<void>;
    addPhotosToAlbum: (albumId: string, photoIds: string[]) => Promise<void>;
    removePhotosFromAlbum: (albumId: string, photoIds: string[]) => Promise<void>;
    setCurrentAlbum: (id: string | null) => void;
}
```

**Update PhotosContext.tsx**
- Add `folderId` and `albumId` filter parameters
- Refresh photos when folder/album context changes

#### New API Functions

**api/foldersApi.ts**
```typescript
getFolderTree(): Promise<FolderTreeResponse>
createFolder(name: string, parentId?: string): Promise<Folder>
renameFolder(id: string, name: string): Promise<Folder>
deleteFolder(id: string): Promise<void>
moveFolder(id: string, parentId: string | null): Promise<Folder>
movePhotosToFolder(folderId: string, photoIds: string[]): Promise<void>
```

**api/albumsApi.ts**
```typescript
getAlbums(): Promise<Album[]>
createAlbum(name: string, description?: string): Promise<Album>
updateAlbum(id: string, data: Partial<Album>): Promise<Album>
deleteAlbum(id: string): Promise<void>
addPhotosToAlbum(albumId: string, photoIds: string[]): Promise<void>
removePhotosFromAlbum(albumId: string, photoIds: string[]): Promise<void>
setCoverPhoto(albumId: string, photoId: string): Promise<void>
```

#### UI Layout Changes

**Updated Layout.tsx**
```
+------------------+------------------------+
|  Logo            |  Header (search, user) |
+------------------+------------------------+
|  Folder Tree     |                        |
|  - All Photos    |    Photo Grid          |
|  - Folder 1      |    (with breadcrumbs)  |
|    - Subfolder   |                        |
|  - Folder 2      |                        |
|  --------------- |                        |
|  Albums          |                        |
|  - Album 1       |                        |
|  - Album 2       |                        |
+------------------+------------------------+
```

#### Keyboard Shortcuts

Add to `useKeyboardShortcuts.ts`:
- `Shift+N` - New folder in current location
- `Shift+A` - New album
- `M` - Move selected photos (opens modal)
- `A` - Add selected photos to album (opens modal)

### Migration Strategy

1. **Database Migration**
   - Create new tables (folders, albums, album_photos)
   - Add folder_id column to photos (nullable, defaults to NULL = root)
   - Existing photos remain at root level

2. **Backend Deployment**
   - Deploy new endpoints alongside existing ones
   - No breaking changes to existing `/api/photos` endpoints
   - folder_id filter is optional

3. **Frontend Deployment**
   - Feature flag for folder/album UI (optional)
   - Gradually roll out to users
   - "All Photos" default view maintains current behavior

## Implementation Steps

### Phase 1: Backend Foundation
1. [ ] Create database migration for folders table
2. [ ] Create database migration for albums and album_photos tables
3. [ ] Add folder_id column to photos table
4. [ ] Create FolderEntity, FolderRepository
5. [ ] Create AlbumEntity, AlbumRepository, AlbumPhotoEntity
6. [ ] Create Folder and Album domain models
7. [ ] Add new event types to EventType enum
8. [ ] Implement FolderService with CRUD operations
9. [ ] Implement AlbumService with CRUD operations
10. [ ] Create FolderController REST endpoints
11. [ ] Create AlbumController REST endpoints
12. [ ] Update PhotoService for folder operations
13. [ ] Update PhotoController with folder filter parameter
14. [ ] Write unit tests for new services
15. [ ] Write integration tests for new endpoints

### Phase 2: Frontend - Folders
16. [ ] Create TypeScript types for Folder, Album
17. [ ] Implement foldersApi.ts API functions
18. [ ] Create FoldersContext with state management
19. [ ] Build FolderTree component
20. [ ] Build FolderBreadcrumbs component
21. [ ] Build CreateFolderModal component
22. [ ] Build MoveToFolderModal component
23. [ ] Update Layout to include folder sidebar
24. [ ] Update PhotosContext to filter by folder
25. [ ] Add folder keyboard shortcuts
26. [ ] Implement drag-and-drop for photos to folders

### Phase 3: Frontend - Albums
27. [ ] Implement albumsApi.ts API functions
28. [ ] Create AlbumsContext with state management
29. [ ] Build AlbumGrid component
30. [ ] Build CreateAlbumModal component
31. [ ] Build AddToAlbumModal component
32. [ ] Add album section to sidebar
33. [ ] Add album view page/mode
34. [ ] Implement bulk "Add to Album" action
35. [ ] Add album keyboard shortcuts

### Phase 4: Polish & Testing
36. [ ] Write frontend component tests
37. [ ] Write E2E tests for folder workflows
38. [ ] Write E2E tests for album workflows
39. [ ] Performance testing with large folders
40. [ ] Accessibility audit (keyboard nav, screen readers)
41. [ ] Mobile responsiveness for sidebar

## Technical Considerations

- **Circular References**: Prevent folder from being moved into its own descendant
- **Soft Delete**: Consider soft delete for folders/albums for recovery
- **Caching**: Cache folder tree structure, invalidate on changes
- **Pagination**: Large folders need efficient pagination
- **Concurrent Edits**: Handle race conditions when multiple users (future multi-user sharing)
- **S3 Structure**: Photos in S3 remain flat; folder structure is metadata only

## Open Questions

1. Should deleting a folder with photos move them to root or trash?
2. Maximum folder nesting depth limit?
3. Should albums have a sort order for photos?
4. Allow duplicate photo in same album? (Currently prevented by primary key)

## Notes

- Created: 2025-12-01
- Related Plan: external-sharing-links.md (sharing will reference albums/folders)
