package com.rapidphotoflow.service;

import com.rapidphotoflow.domain.EventType;
import com.rapidphotoflow.domain.Photo;
import com.rapidphotoflow.domain.PhotoStatus;
import com.rapidphotoflow.entity.PhotoEntity;
import com.rapidphotoflow.entity.UserEntity;
import com.rapidphotoflow.repository.PhotoRepository;
import com.rapidphotoflow.repository.SharedLinkRepository;
import com.rapidphotoflow.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.*;
import java.util.Locale;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PhotoService {

    private final PhotoRepository photoRepository;
    private final S3StorageService s3StorageService;
    private final EventService eventService;
    private final UserRepository userRepository;
    private final CurrentUserService currentUserService;
    private final SharedLinkRepository sharedLinkRepository;
    private final ImageConversionService imageConversionService;

    /**
     * Upload photos with default conversion enabled
     */
    @Transactional
    public List<Photo> uploadPhotos(List<MultipartFile> files) {
        return uploadPhotos(files, true);
    }

    /**
     * Upload photos with optional image conversion for AI compatibility
     *
     * @param files List of files to upload
     * @param convertToCompatible If true, convert incompatible formats to JPEG/PNG for AI tagging
     */
    @Transactional
    public List<Photo> uploadPhotos(List<MultipartFile> files, boolean convertToCompatible) {
        List<Photo> uploadedPhotos = new ArrayList<>();

        // Get current user from security context
        UUID currentUserId = getCurrentUserId();

        for (MultipartFile file : files) {
            try {
                byte[] content = file.getBytes();
                // Detect MIME type from file extension if browser sends generic type
                String originalMimeType = detectMimeType(file.getOriginalFilename(), file.getContentType());
                String finalMimeType = originalMimeType;
                long finalSize = file.getSize();
                boolean wasConverted = false;
                boolean isChatGptCompatible = imageConversionService.isChatGptCompatible(originalMimeType);

                // Attempt conversion if needed and requested
                String finalFilename = file.getOriginalFilename();
                if (!isChatGptCompatible && convertToCompatible && imageConversionService.isConvertible(originalMimeType)) {
                    ImageConversionService.ConversionResult result = imageConversionService.convert(content, originalMimeType);
                    if (result.isSuccess()) {
                        content = result.getData();
                        finalMimeType = result.getNewMimeType();
                        finalSize = content.length;
                        wasConverted = true;
                        isChatGptCompatible = true;
                        // Update filename extension to match converted format
                        if (finalFilename != null && result.getNewExtension() != null) {
                            int lastDot = finalFilename.lastIndexOf('.');
                            if (lastDot > 0) {
                                finalFilename = finalFilename.substring(0, lastDot + 1) + result.getNewExtension();
                            } else {
                                finalFilename = finalFilename + "." + result.getNewExtension();
                            }
                        }
                        log.info("Converted {} from {} to {} (new filename: {})", file.getOriginalFilename(), originalMimeType, finalMimeType, finalFilename);
                    } else {
                        log.warn("Conversion failed for {}: {}", file.getOriginalFilename(), result.getErrorMessage());
                    }
                }

                // AI tagging is enabled only if the stored format is compatible
                boolean aiTaggingEnabled = isChatGptCompatible;

                String contentHash = computeHash(content);
                UUID photoId = UUID.randomUUID();
                Instant now = Instant.now();

                // Upload to S3
                String s3Key = s3StorageService.uploadPhoto(photoId, content, finalMimeType);

                // Generate preview for non-browser-displayable formats (even when not converting the main file)
                String previewS3Key = null;
                if (!wasConverted && !isBrowserDisplayable(finalMimeType) && imageConversionService.isConvertible(originalMimeType)) {
                    try {
                        // Generate preview from original content
                        ImageConversionService.ConversionResult previewResult = imageConversionService.convert(file.getBytes(), originalMimeType);
                        if (previewResult.isSuccess()) {
                            previewS3Key = s3StorageService.uploadPreview(photoId, previewResult.getData());
                            log.info("Generated preview for {} (original format: {})", file.getOriginalFilename(), originalMimeType);
                        }
                    } catch (Exception e) {
                        log.warn("Failed to generate preview for {}: {}", file.getOriginalFilename(), e.getMessage());
                    }
                }

                // Save metadata to database
                PhotoEntity entity = PhotoEntity.builder()
                        .id(photoId)
                        .filename(finalFilename)
                        .mimeType(finalMimeType)
                        .originalMimeType(originalMimeType)
                        .sizeBytes(finalSize)
                        .contentHash(contentHash)
                        .s3Key(s3Key)
                        .status(PhotoStatus.PENDING)
                        .uploadedAt(now)
                        .updatedAt(now)
                        .uploadedByUserId(currentUserId)
                        .isChatGptCompatible(isChatGptCompatible)
                        .wasConverted(wasConverted)
                        .aiTaggingEnabled(aiTaggingEnabled)
                        .previewS3Key(previewS3Key)
                        .tags(new HashSet<>())
                        .build();

                photoRepository.save(entity);

                String eventMessage = wasConverted
                        ? String.format("Photo uploaded and converted: %s (%s -> %s)", entity.getFilename(), originalMimeType, finalMimeType)
                        : "Photo uploaded: " + entity.getFilename();
                eventService.logEvent(photoId, EventType.PHOTO_CREATED, eventMessage);

                uploadedPhotos.add(entityToPhoto(entity, null));
                log.info("Photo uploaded: {} ({}) - compatible: {}, converted: {}",
                        entity.getFilename(), photoId, isChatGptCompatible, wasConverted);
            } catch (IOException e) {
                log.error("Failed to upload photo: {}", file.getOriginalFilename(), e);
            }
        }

        return uploadedPhotos;
    }

    private UUID getCurrentUserId() {
        return currentUserService.getCurrentUserId();
    }

    public Optional<Photo> getPhotoById(UUID id) {
        return photoRepository.findById(id).map(e -> entityToPhoto(e, null));
    }

    public byte[] getPhotoContent(UUID id) {
        return s3StorageService.downloadPhoto(id);
    }

    public List<Photo> getAllPhotos() {
        return photoRepository.findAllByOrderByUploadedAtDesc().stream()
                .map(e -> entityToPhoto(e, null))
                .collect(Collectors.toList());
    }

    public List<Photo> getPhotosByStatus(PhotoStatus status) {
        return photoRepository.findByStatusOrderByUploadedAtDesc(status).stream()
                .map(e -> entityToPhoto(e, null))
                .collect(Collectors.toList());
    }

    public List<Photo> getPhotosByStatuses(List<PhotoStatus> statuses) {
        return photoRepository.findByStatusInOrderByUploadedAtDesc(statuses).stream()
                .map(e -> entityToPhoto(e, null))
                .collect(Collectors.toList());
    }

    public List<Photo> getPhotosByIds(List<UUID> ids) {
        if (ids == null || ids.isEmpty()) {
            return Collections.emptyList();
        }
        return photoRepository.findAllById(ids).stream()
                .map(e -> entityToPhoto(e, null))
                .collect(Collectors.toList());
    }

    public List<Photo> getPhotosByFolderId(UUID folderId) {
        List<PhotoEntity> entities;
        if (folderId == null) {
            entities = photoRepository.findByFolderIdIsNullOrderByUploadedAtDesc();
        } else {
            entities = photoRepository.findByFolderIdOrderByUploadedAtDesc(folderId);
        }
        return entities.stream()
                .map(e -> entityToPhoto(e, null))
                .collect(Collectors.toList());
    }

    public List<Photo> getPhotosByFolderIdAndStatus(UUID folderId, PhotoStatus status) {
        List<PhotoEntity> entities;
        if (folderId == null) {
            entities = photoRepository.findByFolderIdIsNullAndStatusOrderByUploadedAtDesc(status);
        } else {
            entities = photoRepository.findByFolderIdAndStatusOrderByUploadedAtDesc(folderId, status);
        }
        return entities.stream()
                .map(e -> entityToPhoto(e, null))
                .collect(Collectors.toList());
    }

    @Transactional
    public Photo approve(UUID photoId) {
        PhotoEntity entity = photoRepository.findById(photoId)
                .orElseThrow(() -> new IllegalArgumentException("Photo not found: " + photoId));

        // Already approved - return without error (idempotent)
        if (entity.getStatus() == PhotoStatus.APPROVED) {
            return entityToPhoto(entity, null);
        }

        if (entity.getStatus() != PhotoStatus.PROCESSED && entity.getStatus() != PhotoStatus.REJECTED) {
            throw new IllegalStateException("Can only approve from PROCESSED or REJECTED state");
        }

        entity.setStatus(PhotoStatus.APPROVED);
        entity.setUpdatedAt(Instant.now());
        photoRepository.save(entity);

        eventService.logEvent(photoId, EventType.APPROVED,
                "Photo approved: " + entity.getFilename());
        log.info("Photo approved: {} ({})", entity.getFilename(), photoId);

        return entityToPhoto(entity, null);
    }

    @Transactional
    public Photo reject(UUID photoId) {
        PhotoEntity entity = photoRepository.findById(photoId)
                .orElseThrow(() -> new IllegalArgumentException("Photo not found: " + photoId));

        // Already rejected - return without error (idempotent)
        if (entity.getStatus() == PhotoStatus.REJECTED) {
            return entityToPhoto(entity, null);
        }

        if (entity.getStatus() != PhotoStatus.PROCESSED && entity.getStatus() != PhotoStatus.FAILED && entity.getStatus() != PhotoStatus.APPROVED) {
            throw new IllegalStateException("Can only reject from PROCESSED, FAILED, or APPROVED state");
        }

        entity.setStatus(PhotoStatus.REJECTED);
        entity.setUpdatedAt(Instant.now());
        photoRepository.save(entity);

        eventService.logEvent(photoId, EventType.REJECTED,
                "Photo rejected: " + entity.getFilename());
        log.info("Photo rejected: {} ({})", entity.getFilename(), photoId);

        return entityToPhoto(entity, null);
    }

    @Transactional
    public Photo retry(UUID photoId) {
        PhotoEntity entity = photoRepository.findById(photoId)
                .orElseThrow(() -> new IllegalArgumentException("Photo not found: " + photoId));

        if (entity.getStatus() != PhotoStatus.FAILED) {
            throw new IllegalStateException("Can only retry from FAILED state");
        }

        entity.setStatus(PhotoStatus.PENDING);
        entity.setFailureReason(null);
        entity.setUpdatedAt(Instant.now());
        photoRepository.save(entity);

        eventService.logEvent(photoId, EventType.RETRY_REQUESTED,
                "Retry requested: " + entity.getFilename());
        log.info("Photo retry requested: {} ({})", entity.getFilename(), photoId);

        return entityToPhoto(entity, null);
    }

    public long getPhotoCount() {
        return photoRepository.count();
    }

    public long getPhotoCountByStatus(PhotoStatus status) {
        return photoRepository.countByStatus(status);
    }

    @Transactional
    public void delete(UUID photoId) {
        PhotoEntity entity = photoRepository.findById(photoId)
                .orElseThrow(() -> new IllegalArgumentException("Photo not found: " + photoId));

        String filename = entity.getFilename();

        // Delete associated share links first
        sharedLinkRepository.deleteByPhotoId(photoId);

        // Delete from S3
        s3StorageService.deletePhoto(photoId);

        // Log event before deleting
        eventService.logEvent(photoId, EventType.DELETED, "Photo deleted: " + filename);

        // Delete from database
        photoRepository.deleteById(photoId);
        log.info("Photo deleted: {} ({})", filename, photoId);
    }

    @Transactional
    public List<Photo> deleteDuplicates() {
        List<PhotoEntity> allPhotos = photoRepository.findAllByOrderByUploadedAtDesc();
        Map<String, PhotoEntity> bestByHash = new HashMap<>();
        List<Photo> duplicates = new ArrayList<>();

        // Find the best photo for each content hash based on status priority
        for (PhotoEntity entity : allPhotos) {
            String hash = entity.getContentHash();
            if (hash == null) continue;

            PhotoEntity existing = bestByHash.get(hash);

            if (existing == null) {
                bestByHash.put(hash, entity);
            } else {
                int currentPriority = getStatusPriority(entity.getStatus());
                int existingPriority = getStatusPriority(existing.getStatus());

                if (currentPriority > existingPriority) {
                    bestByHash.put(hash, entity);
                } else if (currentPriority == existingPriority) {
                    if (entity.getUploadedAt().isBefore(existing.getUploadedAt())) {
                        bestByHash.put(hash, entity);
                    }
                }
            }
        }

        // Delete all photos that are not the "best" for their hash
        for (PhotoEntity entity : allPhotos) {
            String hash = entity.getContentHash();
            if (hash == null) continue;

            PhotoEntity best = bestByHash.get(hash);

            if (!entity.getId().equals(best.getId())) {
                duplicates.add(entityToPhoto(entity, null));
                // Delete associated share links first
                sharedLinkRepository.deleteByPhotoId(entity.getId());
                s3StorageService.deletePhoto(entity.getId());
                eventService.logEvent(entity.getId(), EventType.DELETED,
                        "Duplicate removed: " + entity.getFilename() + " (kept " + best.getStatus() + " version)");
                photoRepository.deleteById(entity.getId());
                log.info("Duplicate photo removed: {} ({})", entity.getFilename(), entity.getId());
            }
        }

        return duplicates;
    }

    private int getStatusPriority(PhotoStatus status) {
        return switch (status) {
            case APPROVED -> 6;
            case PROCESSED -> 5;
            case PROCESSING -> 4;
            case PENDING -> 3;
            case FAILED -> 2;
            case REJECTED -> 1;
        };
    }

    @Transactional
    public Photo addTag(UUID photoId, String tag) {
        PhotoEntity entity = photoRepository.findById(photoId)
                .orElseThrow(() -> new IllegalArgumentException("Photo not found: " + photoId));

        String normalizedTag = tag.toLowerCase().trim();
        if (entity.getTags().add(normalizedTag)) {
            entity.setUpdatedAt(Instant.now());
            photoRepository.save(entity);
            eventService.logEvent(photoId, EventType.TAG_ADDED,
                    "Tag '" + normalizedTag + "' added to " + entity.getFilename());
            log.info("Tag '{}' added to photo: {} ({})", normalizedTag, entity.getFilename(), photoId);
        }

        return entityToPhoto(entity, null);
    }

    @Transactional
    public Photo removeTag(UUID photoId, String tag) {
        PhotoEntity entity = photoRepository.findById(photoId)
                .orElseThrow(() -> new IllegalArgumentException("Photo not found: " + photoId));

        String normalizedTag = tag.toLowerCase().trim();
        if (entity.getTags().remove(normalizedTag)) {
            entity.setUpdatedAt(Instant.now());
            photoRepository.save(entity);
            eventService.logEvent(photoId, EventType.TAG_REMOVED,
                    "Tag '" + normalizedTag + "' removed from " + entity.getFilename());
            log.info("Tag '{}' removed from photo: {} ({})", normalizedTag, entity.getFilename(), photoId);
        }

        return entityToPhoto(entity, null);
    }

    // Convert entity to domain object
    private Photo entityToPhoto(PhotoEntity entity, byte[] content) {
        String username = null;
        if (entity.getUploadedByUserId() != null) {
            username = userRepository.findById(entity.getUploadedByUserId())
                    .map(UserEntity::getUsername)
                    .orElse(null);
        }

        return Photo.builder()
                .id(entity.getId())
                .filename(entity.getFilename())
                .mimeType(entity.getMimeType())
                .sizeBytes(entity.getSizeBytes())
                .content(content)
                .contentHash(entity.getContentHash())
                .status(entity.getStatus())
                .failureReason(entity.getFailureReason())
                .uploadedAt(entity.getUploadedAt())
                .updatedAt(entity.getUpdatedAt())
                .uploadedByUserId(entity.getUploadedByUserId())
                .uploadedByUsername(username)
                .folderId(entity.getFolderId())
                .originalMimeType(entity.getOriginalMimeType())
                .isChatGptCompatible(entity.getIsChatGptCompatible())
                .wasConverted(entity.getWasConverted())
                .aiTaggingEnabled(entity.getAiTaggingEnabled())
                .hasPreview(entity.getPreviewS3Key() != null)
                .tags(entity.getTags() != null ? new HashSet<>(entity.getTags()) : new HashSet<>())
                .build();
    }

    private String computeHash(byte[] content) {
        try {
            MessageDigest md = MessageDigest.getInstance("MD5");
            byte[] hashBytes = md.digest(content);
            StringBuilder sb = new StringBuilder();
            for (byte b : hashBytes) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("MD5 algorithm not available", e);
        }
    }

    /**
     * Map of file extensions to MIME types for formats that browsers don't recognize.
     * These are primarily RAW camera formats and HEIC/HEIF.
     */
    private static final Map<String, String> EXTENSION_TO_MIME_TYPE = Map.ofEntries(
            // RAW camera formats
            Map.entry("cr2", "image/x-canon-cr2"),
            Map.entry("cr3", "image/x-canon-cr3"),
            Map.entry("nef", "image/x-nikon-nef"),
            Map.entry("arw", "image/x-sony-arw"),
            Map.entry("dng", "image/x-adobe-dng"),
            Map.entry("orf", "image/x-olympus-orf"),
            Map.entry("raf", "image/x-fuji-raf"),
            Map.entry("rw2", "image/x-panasonic-rw2"),
            // HEIC/HEIF
            Map.entry("heic", "image/heic"),
            Map.entry("heif", "image/heif"),
            // Other formats browsers might not recognize
            Map.entry("psd", "image/vnd.adobe.photoshop"),
            Map.entry("ico", "image/x-icon"),
            Map.entry("svg", "image/svg+xml"),
            Map.entry("avif", "image/avif")
    );

    /**
     * Detect MIME type from file extension when browser sends application/octet-stream
     * or an unrecognized type. Returns the detected MIME type or the original if no
     * better match found.
     */
    private String detectMimeType(String filename, String browserMimeType) {
        // If browser detected a specific image type, trust it
        if (browserMimeType != null &&
            !browserMimeType.equals("application/octet-stream") &&
            browserMimeType.startsWith("image/")) {
            return browserMimeType;
        }

        // Try to detect from file extension
        if (filename != null) {
            int lastDot = filename.lastIndexOf('.');
            if (lastDot > 0 && lastDot < filename.length() - 1) {
                String extension = filename.substring(lastDot + 1).toLowerCase(Locale.ROOT);
                String detectedMimeType = EXTENSION_TO_MIME_TYPE.get(extension);
                if (detectedMimeType != null) {
                    log.debug("Detected MIME type {} from extension {} (browser sent: {})",
                            detectedMimeType, extension, browserMimeType);
                    return detectedMimeType;
                }
            }
        }

        // Return browser's MIME type if no better match found
        return browserMimeType;
    }

    /**
     * MIME types that browsers can display natively.
     */
    private static final Set<String> BROWSER_DISPLAYABLE_MIME_TYPES = Set.of(
            "image/jpeg",
            "image/png",
            "image/gif",
            "image/webp",
            "image/svg+xml",
            "image/bmp",
            "image/x-icon",
            "image/vnd.microsoft.icon"
    );

    /**
     * Check if a MIME type can be displayed natively by web browsers.
     */
    private boolean isBrowserDisplayable(String mimeType) {
        return mimeType != null && BROWSER_DISPLAYABLE_MIME_TYPES.contains(mimeType.toLowerCase());
    }

    /**
     * Get preview content for a photo. Previews are generated for non-browser-displayable formats.
     * Returns null if no preview exists.
     */
    public byte[] getPreviewContent(UUID id) {
        return s3StorageService.downloadPreview(id);
    }

    /**
     * Check if a photo has a preview available.
     */
    public boolean hasPreview(UUID id) {
        return photoRepository.findById(id)
                .map(entity -> entity.getPreviewS3Key() != null)
                .orElse(false);
    }
}
