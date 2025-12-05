package com.rapidphotoflow.service;

import com.rapidphotoflow.domain.EventType;
import com.rapidphotoflow.domain.PhotoStatus;
import com.rapidphotoflow.entity.PhotoEntity;
import com.rapidphotoflow.repository.PhotoRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Service
@Slf4j
public class ProcessorService {

    private final PhotoRepository photoRepository;
    private final S3StorageService s3StorageService;
    private final EventService eventService;
    private final AiTaggingService aiTaggingService;
    private final boolean autoTagOnUpload;

    private final ExecutorService executor = Executors.newFixedThreadPool(20);

    // Supported image MIME types
    private static final Set<String> SUPPORTED_MIME_TYPES = Set.of(
            // ChatGPT-compatible formats
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/gif",
            "image/webp",
            // Formats convertible via ImageIO (TwelveMonkeys)
            "image/bmp",
            "image/x-bmp",
            "image/x-ms-bmp",
            "image/tiff",
            "image/x-tiff",
            "image/x-icon",
            "image/vnd.microsoft.icon",
            "image/vnd.adobe.photoshop",
            "application/x-photoshop",
            // SVG (converted via Batik)
            "image/svg+xml",
            // HEIC/HEIF (require native libheif)
            "image/heic",
            "image/heif",
            "image/heic-sequence",
            "image/heif-sequence",
            // RAW camera formats (require native dcraw/LibRaw)
            "image/x-canon-cr2",
            "image/x-canon-cr3",
            "image/x-nikon-nef",
            "image/x-sony-arw",
            "image/x-adobe-dng",
            "image/x-olympus-orf",
            "image/x-fuji-raf",
            "image/x-panasonic-rw2",
            "image/x-dcraw",
            // Other
            "image/avif"
    );

    public ProcessorService(
            PhotoRepository photoRepository,
            S3StorageService s3StorageService,
            EventService eventService,
            AiTaggingService aiTaggingService,
            @Value("${ai.service.auto-tag-on-upload:false}") boolean autoTagOnUpload) {
        this.photoRepository = photoRepository;
        this.s3StorageService = s3StorageService;
        this.eventService = eventService;
        this.aiTaggingService = aiTaggingService;
        this.autoTagOnUpload = autoTagOnUpload;
        log.info("Auto-tagging on upload: {}", autoTagOnUpload ? "ENABLED" : "DISABLED");
    }

    @Scheduled(fixedDelay = 500)
    public void processNextBatch() {
        List<PhotoEntity> pendingPhotos = photoRepository.findByStatusOrderByUploadedAtDesc(PhotoStatus.PENDING);

        if (pendingPhotos.isEmpty()) {
            return;
        }

        log.debug("Found {} pending photos to process", pendingPhotos.size());

        pendingPhotos.stream()
                .limit(50)
                .forEach(photo -> executor.submit(() -> processPhoto(photo.getId())));
    }

    @Transactional
    public void processPhoto(UUID photoId) {
        PhotoEntity entity = photoRepository.findById(photoId).orElse(null);
        if (entity == null) {
            log.warn("Photo not found for processing: {}", photoId);
            return;
        }

        // Skip if not pending (may have been processed by another thread)
        if (entity.getStatus() != PhotoStatus.PENDING) {
            return;
        }

        try {
            // Start processing
            entity.setStatus(PhotoStatus.PROCESSING);
            photoRepository.save(entity);
            eventService.logEvent(photoId, EventType.PROCESSING_STARTED,
                    "Processing started: " + entity.getFilename());
            log.info("Processing started: {} ({})", entity.getFilename(), photoId);

            // Download content from S3 for validation
            byte[] content = s3StorageService.downloadPhoto(photoId);

            // Validate the photo
            String validationError = validatePhoto(entity, content);

            if (validationError == null) {
                entity.setStatus(PhotoStatus.PROCESSED);
                entity.setFailureReason(null);
                photoRepository.save(entity);
                eventService.logEvent(photoId, EventType.PROCESSING_COMPLETED,
                        "Processing completed: " + entity.getFilename());
                log.info("Processing completed: {} ({})", entity.getFilename(), photoId);

                // Trigger auto-tagging asynchronously (non-blocking)
                triggerAutoTagging(photoId, entity.getFilename());
            } else {
                entity.setStatus(PhotoStatus.FAILED);
                entity.setFailureReason(validationError);
                photoRepository.save(entity);
                eventService.logEvent(photoId, EventType.PROCESSING_FAILED,
                        "Processing failed: " + entity.getFilename() + " - " + validationError);
                log.warn("Processing failed: {} ({}) - {}", entity.getFilename(), photoId, validationError);
            }

        } catch (Exception e) {
            entity.setStatus(PhotoStatus.FAILED);
            entity.setFailureReason("Unexpected error: " + e.getMessage());
            photoRepository.save(entity);
            log.error("Error processing photo: {}", photoId, e);
        }
    }

    /**
     * Trigger auto-tagging for a photo via the AI service.
     * This runs asynchronously and does not block photo processing.
     * Only runs if auto-tagging is enabled in configuration.
     */
    private void triggerAutoTagging(UUID photoId, String filename) {
        if (!autoTagOnUpload) {
            log.debug("Auto-tagging disabled, skipping for photo {}", photoId);
            return;
        }

        executor.submit(() -> {
            try {
                if (!aiTaggingService.isAvailable()) {
                    log.debug("AI service not available, skipping auto-tagging for photo {}", photoId);
                    return;
                }

                List<String> tags = aiTaggingService.autoTagPhoto(photoId);
                if (!tags.isEmpty()) {
                    eventService.logEvent(photoId, EventType.AUTO_TAGGED,
                            "Auto-tagged with: " + String.join(", ", tags));
                }
            } catch (Exception e) {
                log.error("Error during auto-tagging for photo {}: {}", photoId, e.getMessage());
            }
        });
    }

    /**
     * Validate the photo and return an error message if invalid, or null if valid.
     */
    private String validatePhoto(PhotoEntity entity, byte[] content) {
        // Check if content exists
        if (content == null || content.length == 0) {
            return "File content is empty or corrupted";
        }

        // Check MIME type
        String mimeType = entity.getMimeType();
        if (mimeType == null || !SUPPORTED_MIME_TYPES.contains(mimeType.toLowerCase())) {
            return "Unsupported image format: " + (mimeType != null ? mimeType : "unknown");
        }

        // Check file size (reject files over 150MB)
        if (entity.getSizeBytes() > 150 * 1024 * 1024) {
            return "File size exceeds 150MB limit";
        }

        // All validations passed
        return null;
    }
}
