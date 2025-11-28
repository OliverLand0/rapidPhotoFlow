package com.rapidphotoflow.controller;

import com.rapidphotoflow.domain.PhotoStatus;
import com.rapidphotoflow.dto.PhotoDTO;
import com.rapidphotoflow.dto.PhotoListResponse;
import com.rapidphotoflow.entity.PhotoEntity;
import com.rapidphotoflow.repository.EventLogRepository;
import com.rapidphotoflow.repository.PhotoRepository;
import com.rapidphotoflow.service.EventService;
import com.rapidphotoflow.service.S3StorageService;
import com.rapidphotoflow.domain.EventType;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Random;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/seed")
@RequiredArgsConstructor
@Tag(name = "Seed", description = "Demo data seeding endpoints")
public class SeedController {

    private final PhotoRepository photoRepository;
    private final EventLogRepository eventLogRepository;
    private final S3StorageService s3StorageService;
    private final EventService eventService;

    private final Random random = new Random();

    private static final String[] SAMPLE_FILENAMES = {
            "vacation_photo.jpg",
            "product_shot.png",
            "landscape.jpg",
            "portrait.png",
            "document_scan.jpg",
            "receipt.png",
            "screenshot.png",
            "architecture.jpg",
            "nature.jpg",
            "food_photo.png"
    };

    @PostMapping
    @Operation(summary = "Seed demo data", description = "Create sample photos in various states for demo")
    @Transactional
    public ResponseEntity<PhotoListResponse> seedData() {
        List<PhotoEntity> photos = new ArrayList<>();

        // Create photos in various states
        for (int i = 0; i < 8; i++) {
            String filename = SAMPLE_FILENAMES[i % SAMPLE_FILENAMES.length];
            PhotoEntity entity = createSamplePhoto(filename);

            // Distribute across statuses
            PhotoStatus targetStatus = getTargetStatus(i);
            transitionToStatus(entity, targetStatus);

            photoRepository.save(entity);
            photos.add(entity);
        }

        List<PhotoDTO> dtos = photos.stream()
                .map(this::entityToDto)
                .collect(Collectors.toList());

        return ResponseEntity.ok(PhotoListResponse.of(dtos));
    }

    @DeleteMapping
    @Operation(summary = "Clear all data", description = "Remove all photos and events")
    @Transactional
    public ResponseEntity<Void> clearData() {
        // Delete all photos from S3
        photoRepository.findAll().forEach(photo -> {
            try {
                s3StorageService.deletePhoto(photo.getId());
            } catch (Exception e) {
                // Ignore S3 errors during cleanup
            }
        });

        eventLogRepository.deleteAll();
        photoRepository.deleteAll();
        return ResponseEntity.ok().build();
    }

    private PhotoEntity createSamplePhoto(String filename) {
        // Create a small placeholder image (1x1 pixel PNG)
        byte[] placeholderImage = new byte[]{
                (byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
                0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
                0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
                0x08, 0x02, 0x00, 0x00, 0x00, (byte) 0x90, 0x77, 0x53,
                (byte) 0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41,
                0x54, 0x08, (byte) 0xD7, 0x63, (byte) 0xF8, (byte) 0xFF, (byte) 0xFF, 0x3F,
                0x00, 0x05, (byte) 0xFE, 0x02, (byte) 0xFE, (byte) 0xDC, (byte) 0xCC, 0x59,
                (byte) 0xE7, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E,
                0x44, (byte) 0xAE, 0x42, 0x60, (byte) 0x82
        };

        UUID photoId = UUID.randomUUID();
        String mimeType = filename.endsWith(".png") ? "image/png" : "image/jpeg";
        long size = 50000 + random.nextInt(200000); // Random size 50KB-250KB

        Instant uploadTime = Instant.now().minusSeconds(random.nextInt(3600)); // Within last hour

        // Upload placeholder to S3
        String s3Key = s3StorageService.uploadPhoto(photoId, placeholderImage, mimeType);

        return PhotoEntity.builder()
                .id(photoId)
                .filename(filename)
                .mimeType(mimeType)
                .sizeBytes(size)
                .s3Key(s3Key)
                .status(PhotoStatus.PENDING)
                .uploadedAt(uploadTime)
                .updatedAt(uploadTime)
                .tags(new HashSet<>())
                .build();
    }

    private PhotoStatus getTargetStatus(int index) {
        // Distribute: 2 pending, 1 processing, 2 processed, 1 failed, 1 approved, 1 rejected
        return switch (index % 8) {
            case 0, 1 -> PhotoStatus.PENDING;
            case 2 -> PhotoStatus.PROCESSING;
            case 3, 4 -> PhotoStatus.PROCESSED;
            case 5 -> PhotoStatus.FAILED;
            case 6 -> PhotoStatus.APPROVED;
            case 7 -> PhotoStatus.REJECTED;
            default -> PhotoStatus.PENDING;
        };
    }

    private void transitionToStatus(PhotoEntity entity, PhotoStatus targetStatus) {
        // Log creation event
        eventService.logEvent(entity.getId(), EventType.PHOTO_CREATED,
                "Photo uploaded: " + entity.getFilename());

        if (targetStatus == PhotoStatus.PENDING) {
            return;
        }

        // Transition through states
        entity.setStatus(PhotoStatus.PROCESSING);
        entity.setUpdatedAt(entity.getUploadedAt().plusSeconds(2));
        eventService.logEvent(entity.getId(), EventType.PROCESSING_STARTED,
                "Processing started: " + entity.getFilename());

        if (targetStatus == PhotoStatus.PROCESSING) {
            return;
        }

        if (targetStatus == PhotoStatus.FAILED) {
            entity.setStatus(PhotoStatus.FAILED);
            entity.setFailureReason("Simulated failure for demo");
            entity.setUpdatedAt(entity.getUploadedAt().plusSeconds(5));
            eventService.logEvent(entity.getId(), EventType.PROCESSING_FAILED,
                    "Processing failed: " + entity.getFilename() + " - Simulated failure for demo");
            return;
        }

        entity.setStatus(PhotoStatus.PROCESSED);
        entity.setFailureReason(null);
        entity.setUpdatedAt(entity.getUploadedAt().plusSeconds(5));
        eventService.logEvent(entity.getId(), EventType.PROCESSING_COMPLETED,
                "Processing completed: " + entity.getFilename());

        if (targetStatus == PhotoStatus.PROCESSED) {
            return;
        }

        if (targetStatus == PhotoStatus.APPROVED) {
            entity.setStatus(PhotoStatus.APPROVED);
            entity.setUpdatedAt(entity.getUploadedAt().plusSeconds(10));
            eventService.logEvent(entity.getId(), EventType.APPROVED,
                    "Photo approved: " + entity.getFilename());
        } else if (targetStatus == PhotoStatus.REJECTED) {
            entity.setStatus(PhotoStatus.REJECTED);
            entity.setUpdatedAt(entity.getUploadedAt().plusSeconds(10));
            eventService.logEvent(entity.getId(), EventType.REJECTED,
                    "Photo rejected: " + entity.getFilename());
        }
    }

    private PhotoDTO entityToDto(PhotoEntity entity) {
        return PhotoDTO.builder()
                .id(entity.getId())
                .filename(entity.getFilename())
                .mimeType(entity.getMimeType())
                .sizeBytes(entity.getSizeBytes())
                .status(entity.getStatus())
                .failureReason(entity.getFailureReason())
                .uploadedAt(entity.getUploadedAt())
                .updatedAt(entity.getUpdatedAt())
                .tags(entity.getTags() != null ? new ArrayList<>(entity.getTags()) : new ArrayList<>())
                .build();
    }
}
