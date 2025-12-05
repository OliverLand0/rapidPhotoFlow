# Image Conversion & AI Tagging Compatibility Implementation Plan

## Overview

Implement image format conversion in the upload pipeline to ensure ChatGPT API compatibility for AI tagging. The feature adds a toggle to convert incompatible formats (HEIC/HEIF/TIFF/BMP) to compatible formats (JPEG/PNG/WebP).

## User's Design Decisions

1. **HEIC Support**: Full conversion with native library support (TwelveMonkeys + libheif)
2. **Toggle Location**: Alongside existing AI Auto-Tagging toggle in upload modal
3. **Disabled Button Behavior**: Disabled auto-tag button with hover tooltip for incompatible photos

---

## Phase 1: Backend - Database & Entity Changes

### 1.1 Database Migration
Create new migration file: `V{next}_add_image_conversion_fields.sql`

```sql
ALTER TABLE photos ADD COLUMN original_mime_type VARCHAR(100);
ALTER TABLE photos ADD COLUMN is_chatgpt_compatible BOOLEAN DEFAULT true;
ALTER TABLE photos ADD COLUMN was_converted BOOLEAN DEFAULT false;
ALTER TABLE photos ADD COLUMN ai_tagging_enabled BOOLEAN DEFAULT true;

-- Backfill existing photos
UPDATE photos SET
  original_mime_type = mime_type,
  is_chatgpt_compatible = CASE
    WHEN mime_type IN ('image/jpeg', 'image/png', 'image/webp', 'image/gif') THEN true
    ELSE false
  END,
  ai_tagging_enabled = CASE
    WHEN mime_type IN ('image/jpeg', 'image/png', 'image/webp', 'image/gif') THEN true
    ELSE false
  END;
```

### 1.2 Update PhotoEntity.java
Add new fields:
- `originalMimeType` (String)
- `isChatGptCompatible` (Boolean)
- `wasConverted` (Boolean)
- `aiTaggingEnabled` (Boolean)

### 1.3 Update Photo Domain Object
Mirror the new fields in the domain object.

### 1.4 Update PhotoDTO
Add corresponding DTO fields for API responses.

---

## Phase 2: Backend - Image Conversion Service

### 2.1 Add Dependencies to pom.xml

```xml
<!-- TwelveMonkeys ImageIO for extended format support -->
<dependency>
    <groupId>com.twelvemonkeys.imageio</groupId>
    <artifactId>imageio-core</artifactId>
    <version>3.10.1</version>
</dependency>
<dependency>
    <groupId>com.twelvemonkeys.imageio</groupId>
    <artifactId>imageio-jpeg</artifactId>
    <version>3.10.1</version>
</dependency>
<dependency>
    <groupId>com.twelvemonkeys.imageio</groupId>
    <artifactId>imageio-tiff</artifactId>
    <version>3.10.1</version>
</dependency>
<dependency>
    <groupId>com.twelvemonkeys.imageio</groupId>
    <artifactId>imageio-bmp</artifactId>
    <version>3.10.1</version>
</dependency>

<!-- HEIC/HEIF support via jheif -->
<dependency>
    <groupId>com.github.nickhudkins</groupId>
    <artifactId>jheif</artifactId>
    <version>1.0.0</version>
</dependency>
```

**Note**: HEIC support requires native libheif library installed on the system:
- Local dev: `brew install libheif`
- Docker: Add to Dockerfile: `RUN apt-get update && apt-get install -y libheif-dev`

### 2.2 Create ImageConversionService.java

Location: `backend/src/main/java/com/rapidphotoflow/service/ImageConversionService.java`

```java
@Service
@Slf4j
public class ImageConversionService {

    private static final Set<String> CHATGPT_COMPATIBLE_TYPES = Set.of(
        "image/jpeg", "image/png", "image/webp", "image/gif"
    );

    private static final Set<String> CONVERTIBLE_TYPES = Set.of(
        "image/heic", "image/heif", "image/tiff", "image/bmp",
        "image/x-tiff", "image/x-bmp"
    );

    public boolean isChatGptCompatible(String mimeType);
    public boolean isConvertible(String mimeType);
    public ConversionResult convert(byte[] imageData, String originalMimeType);
}

public class ConversionResult {
    byte[] data;
    String newMimeType;
    String newExtension;
    boolean success;
    String errorMessage;
}
```

Key implementation details:
- Convert to JPEG by default (best compression for photos)
- Preserve transparency by converting to PNG when alpha channel detected
- Handle EXIF orientation during conversion
- Max file size validation (50MB input limit)
- Graceful fallback if conversion fails

---

## Phase 3: Backend - Upload Endpoint Modifications

### 3.1 Update PhotoController.java

Modify upload endpoint to accept `convertToCompatible` parameter:

```java
@PostMapping("/upload")
public ResponseEntity<List<PhotoDTO>> uploadPhotos(
    @RequestParam("files") List<MultipartFile> files,
    @RequestParam(value = "convertToCompatible", defaultValue = "true") boolean convertToCompatible
) {
    List<Photo> photos = photoService.uploadPhotos(files, convertToCompatible);
    return ResponseEntity.ok(photos.stream().map(this::toDTO).collect(toList()));
}
```

### 3.2 Update PhotoService.uploadPhotos()

Modify the upload method signature and logic:

```java
@Transactional
public List<Photo> uploadPhotos(List<MultipartFile> files, boolean convertToCompatible) {
    for (MultipartFile file : files) {
        String originalMimeType = file.getContentType();
        byte[] content = file.getBytes();
        boolean isCompatible = imageConversionService.isChatGptCompatible(originalMimeType);
        boolean wasConverted = false;
        String finalMimeType = originalMimeType;

        if (!isCompatible && convertToCompatible && imageConversionService.isConvertible(originalMimeType)) {
            ConversionResult result = imageConversionService.convert(content, originalMimeType);
            if (result.isSuccess()) {
                content = result.getData();
                finalMimeType = result.getNewMimeType();
                wasConverted = true;
                isCompatible = true;
            }
        }

        boolean aiTaggingEnabled = isCompatible;

        // Save with new metadata fields
        PhotoEntity entity = PhotoEntity.builder()
            // ... existing fields ...
            .mimeType(finalMimeType)
            .originalMimeType(originalMimeType)
            .isChatGptCompatible(isCompatible)
            .wasConverted(wasConverted)
            .aiTaggingEnabled(aiTaggingEnabled)
            .build();
    }
}
```

### 3.3 Add AI Tagging Guard Rails

In any AI tagging endpoint/service:

```java
public void tagPhoto(UUID photoId) {
    PhotoEntity photo = photoRepository.findById(photoId)
        .orElseThrow(() -> new IllegalArgumentException("Photo not found"));

    if (!photo.getAiTaggingEnabled() || !photo.getIsChatGptCompatible()) {
        throw new IllegalStateException(
            "AI tagging unavailable: image not stored in a ChatGPT-compatible format"
        );
    }

    // Proceed with tagging...
}
```

---

## Phase 4: Frontend - Upload UI Changes

### 4.1 Update Upload Modal/Component

File: `frontend/src/components/upload/UploadModal.tsx` (or similar)

Add conversion toggle alongside existing AI Auto-Tagging toggle:

```tsx
const [convertToCompatible, setConvertToCompatible] = useState(true);

// In the form, near the AI auto-tagging toggle:
<div className="flex items-center gap-2">
  <Switch
    checked={convertToCompatible}
    onCheckedChange={setConvertToCompatible}
  />
  <label>Convert images for AI compatibility</label>
  <Tooltip content="Converts HEIC, TIFF, BMP files to JPEG for AI tagging support">
    <InfoIcon className="h-4 w-4 text-gray-400" />
  </Tooltip>
</div>
```

### 4.2 Update Upload API Call

Pass the new parameter to the upload endpoint:

```tsx
const formData = new FormData();
files.forEach(file => formData.append('files', file));
formData.append('convertToCompatible', String(convertToCompatible));

await api.post('/photos/upload', formData);
```

### 4.3 Show Compatibility Warnings

Before upload, detect incompatible files and show warning:

```tsx
const COMPATIBLE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const incompatibleFiles = files.filter(f => !COMPATIBLE_TYPES.includes(f.type));

{incompatibleFiles.length > 0 && !convertToCompatible && (
  <Alert variant="warning">
    {incompatibleFiles.length} file(s) are not compatible with AI tagging.
    Enable conversion or AI tagging will be disabled for these files.
  </Alert>
)}
```

---

## Phase 5: Frontend - Photo Preview/Detail Changes

### 5.1 Update PhotoDTO Type

File: `frontend/src/lib/api/types.ts`

```typescript
interface PhotoDTO {
  // ... existing fields ...
  originalMimeType: string;
  isChatGptCompatible: boolean;
  wasConverted: boolean;
  aiTaggingEnabled: boolean;
}
```

### 5.2 Disable AI Tagging Button with Tooltip

In photo preview/detail component:

```tsx
<Tooltip
  content={
    !photo.aiTaggingEnabled
      ? "AI tagging unavailable: image format not compatible with ChatGPT. Re-upload with conversion enabled."
      : "Generate AI tags for this photo"
  }
>
  <Button
    onClick={handleAutoTag}
    disabled={!photo.aiTaggingEnabled}
    className={!photo.aiTaggingEnabled ? "opacity-50 cursor-not-allowed" : ""}
  >
    <SparklesIcon className="h-4 w-4 mr-2" />
    Auto-tag
  </Button>
</Tooltip>
```

---

## Phase 6: Docker Configuration

### 6.1 Update Dockerfile

Add libheif for HEIC support:

```dockerfile
FROM eclipse-temurin:21-jdk-alpine as builder
# ... build stage ...

FROM eclipse-temurin:21-jre-alpine
RUN apk add --no-cache libheif-dev
# ... rest of runtime config ...
```

---

## Critical Files to Modify

### Backend
1. `backend/src/main/resources/db/migration/V{next}__add_image_conversion_fields.sql` (new)
2. `backend/src/main/java/com/rapidphotoflow/entity/PhotoEntity.java`
3. `backend/src/main/java/com/rapidphotoflow/domain/Photo.java`
4. `backend/src/main/java/com/rapidphotoflow/dto/PhotoDTO.java`
5. `backend/src/main/java/com/rapidphotoflow/service/ImageConversionService.java` (new)
6. `backend/src/main/java/com/rapidphotoflow/service/PhotoService.java`
7. `backend/src/main/java/com/rapidphotoflow/controller/PhotoController.java`
8. `backend/pom.xml`
9. `backend/Dockerfile`

### Frontend
1. `frontend/src/lib/api/types.ts`
2. `frontend/src/components/upload/UploadModal.tsx` (or equivalent)
3. Photo preview/detail component (wherever auto-tag button exists)

---

## Testing Requirements

### Unit Tests
- `ImageConversionService`: Test conversion for each supported format
- `PhotoService`: Test upload with/without conversion flag
- Compatibility detection logic

### Integration Tests
- Upload HEIC file with conversion ON → verify JPEG stored, aiTaggingEnabled=true
- Upload HEIC file with conversion OFF → verify HEIC stored, aiTaggingEnabled=false
- Upload JPEG file → verify no conversion, aiTaggingEnabled=true
- AI tagging endpoint rejects incompatible photos

### Manual Tests
- Verify toggle appears next to AI toggle in upload modal
- Verify tooltip on disabled auto-tag button
- Verify conversion works end-to-end with actual HEIC/TIFF/BMP files

---

## Implementation Order

1. Database migration & entity updates
2. Add Maven dependencies
3. Create ImageConversionService
4. Update PhotoService.uploadPhotos()
5. Update PhotoController
6. Frontend: Update types
7. Frontend: Add toggle to upload UI
8. Frontend: Update photo preview with disabled button + tooltip
9. Update Dockerfile
10. Write tests
11. Deploy and test

---

## Edge Cases to Handle

- **Conversion failure**: Store original file, set aiTaggingEnabled=false, log warning
- **Large files**: Reject files >50MB before conversion attempt
- **Mixed uploads**: Process each file independently, some may convert while others don't
- **Corrupted images**: Graceful error handling, store original if possible
- **Animated GIFs**: Skip conversion (already compatible, preserve animation)
