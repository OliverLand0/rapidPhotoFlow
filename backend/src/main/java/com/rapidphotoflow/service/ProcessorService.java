package com.rapidphotoflow.service;

import com.rapidphotoflow.domain.EventType;
import com.rapidphotoflow.domain.Photo;
import com.rapidphotoflow.domain.PhotoStatus;
import com.rapidphotoflow.repository.InMemoryPhotoRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Set;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Service
@Slf4j
public class ProcessorService {

    private final InMemoryPhotoRepository photoRepository;
    private final EventService eventService;
    private final AiTaggingService aiTaggingService;
    private final boolean autoTagOnUpload;

    private final ExecutorService executor = Executors.newFixedThreadPool(20);

    public ProcessorService(
            InMemoryPhotoRepository photoRepository,
            EventService eventService,
            AiTaggingService aiTaggingService,
            @Value("${ai.service.auto-tag-on-upload:false}") boolean autoTagOnUpload) {
        this.photoRepository = photoRepository;
        this.eventService = eventService;
        this.aiTaggingService = aiTaggingService;
        this.autoTagOnUpload = autoTagOnUpload;
        log.info("Auto-tagging on upload: {}", autoTagOnUpload ? "ENABLED" : "DISABLED");
    }

    // Supported image MIME types
    private static final Set<String> SUPPORTED_MIME_TYPES = Set.of(
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/gif",
            "image/webp",
            "image/bmp",
            "image/tiff"
    );

    @Scheduled(fixedDelay = 500)
    public void processNextBatch() {
        List<Photo> pendingPhotos = photoRepository.findByStatus(PhotoStatus.PENDING);

        if (pendingPhotos.isEmpty()) {
            return;
        }

        log.debug("Found {} pending photos to process", pendingPhotos.size());

        pendingPhotos.stream()
                .limit(50)
                .forEach(photo -> executor.submit(() -> processPhoto(photo)));
    }

    private void processPhoto(Photo photo) {
        try {
            // Start processing
            photo.startProcessing();
            photoRepository.save(photo);
            eventService.logEvent(photo.getId(), EventType.PROCESSING_STARTED,
                    "Processing started: " + photo.getFilename());
            log.info("Processing started: {} ({})", photo.getFilename(), photo.getId());

            // Validate the photo
            String validationError = validatePhoto(photo);

            if (validationError == null) {
                photo.markProcessed();
                photoRepository.save(photo);
                eventService.logEvent(photo.getId(), EventType.PROCESSING_COMPLETED,
                        "Processing completed: " + photo.getFilename());
                log.info("Processing completed: {} ({})", photo.getFilename(), photo.getId());

                // Trigger auto-tagging asynchronously (non-blocking)
                triggerAutoTagging(photo);
            } else {
                photo.markFailed(validationError);
                photoRepository.save(photo);
                eventService.logEvent(photo.getId(), EventType.PROCESSING_FAILED,
                        "Processing failed: " + photo.getFilename() + " - " + validationError);
                log.warn("Processing failed: {} ({}) - {}", photo.getFilename(), photo.getId(), validationError);
            }

        } catch (Exception e) {
            photo.markFailed("Unexpected error: " + e.getMessage());
            photoRepository.save(photo);
            log.error("Error processing photo: {}", photo.getId(), e);
        }
    }

    /**
     * Trigger auto-tagging for a photo via the AI service.
     * This runs asynchronously and does not block photo processing.
     * Only runs if auto-tagging is enabled in configuration.
     */
    private void triggerAutoTagging(Photo photo) {
        if (!autoTagOnUpload) {
            log.debug("Auto-tagging disabled, skipping for photo {}", photo.getId());
            return;
        }

        executor.submit(() -> {
            try {
                if (!aiTaggingService.isAvailable()) {
                    log.debug("AI service not available, skipping auto-tagging for photo {}", photo.getId());
                    return;
                }

                List<String> tags = aiTaggingService.autoTagPhoto(photo.getId());
                if (!tags.isEmpty()) {
                    eventService.logEvent(photo.getId(), EventType.AUTO_TAGGED,
                            "Auto-tagged with: " + String.join(", ", tags));
                }
            } catch (Exception e) {
                log.error("Error during auto-tagging for photo {}: {}", photo.getId(), e.getMessage());
            }
        });
    }

    /**
     * Validate the photo and return an error message if invalid, or null if valid.
     */
    private String validatePhoto(Photo photo) {
        // Check if content exists
        if (photo.getContent() == null || photo.getContent().length == 0) {
            return "File content is empty or corrupted";
        }

        // Check MIME type
        String mimeType = photo.getMimeType();
        if (mimeType == null || !SUPPORTED_MIME_TYPES.contains(mimeType.toLowerCase())) {
            return "Unsupported image format: " + (mimeType != null ? mimeType : "unknown");
        }

        // Check file size (reject files over 50MB)
        if (photo.getSizeBytes() > 50 * 1024 * 1024) {
            return "File size exceeds 50MB limit";
        }

        // All validations passed
        return null;
    }

}
