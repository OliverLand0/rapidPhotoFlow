package com.rapidphotoflow.controller;

import com.rapidphotoflow.domain.Photo;
import com.rapidphotoflow.domain.PhotoStatus;
import com.rapidphotoflow.dto.PhotoDTO;
import com.rapidphotoflow.dto.PhotoListResponse;
import com.rapidphotoflow.repository.InMemoryEventRepository;
import com.rapidphotoflow.repository.InMemoryPhotoRepository;
import com.rapidphotoflow.service.EventService;
import com.rapidphotoflow.domain.EventType;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/seed")
@RequiredArgsConstructor
@Tag(name = "Seed", description = "Demo data seeding endpoints")
public class SeedController {

    private final InMemoryPhotoRepository photoRepository;
    private final InMemoryEventRepository eventRepository;
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
    public ResponseEntity<PhotoListResponse> seedData() {
        List<Photo> photos = new ArrayList<>();

        // Create photos in various states
        for (int i = 0; i < 8; i++) {
            String filename = SAMPLE_FILENAMES[i % SAMPLE_FILENAMES.length];
            Photo photo = createSamplePhoto(filename);

            // Distribute across statuses
            PhotoStatus targetStatus = getTargetStatus(i);
            transitionToStatus(photo, targetStatus);

            photoRepository.save(photo);
            photos.add(photo);
        }

        List<PhotoDTO> dtos = photos.stream()
                .map(PhotoDTO::fromEntity)
                .collect(Collectors.toList());

        return ResponseEntity.ok(PhotoListResponse.of(dtos));
    }

    @DeleteMapping
    @Operation(summary = "Clear all data", description = "Remove all photos and events")
    public ResponseEntity<Void> clearData() {
        photoRepository.deleteAll();
        eventRepository.deleteAll();
        return ResponseEntity.ok().build();
    }

    private Photo createSamplePhoto(String filename) {
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

        String mimeType = filename.endsWith(".png") ? "image/png" : "image/jpeg";
        long size = 50000 + random.nextInt(200000); // Random size 50KB-250KB

        Instant uploadTime = Instant.now().minusSeconds(random.nextInt(3600)); // Within last hour

        return Photo.builder()
                .id(UUID.randomUUID())
                .filename(filename)
                .mimeType(mimeType)
                .sizeBytes(size)
                .content(placeholderImage)
                .status(PhotoStatus.PENDING)
                .uploadedAt(uploadTime)
                .updatedAt(uploadTime)
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

    private void transitionToStatus(Photo photo, PhotoStatus targetStatus) {
        // Log creation event
        eventService.logEvent(photo.getId(), EventType.PHOTO_CREATED,
                "Photo uploaded: " + photo.getFilename());

        if (targetStatus == PhotoStatus.PENDING) {
            return;
        }

        // Transition through states
        photo.startProcessing();
        photo.setUpdatedAt(photo.getUploadedAt().plusSeconds(2));
        eventService.logEvent(photo.getId(), EventType.PROCESSING_STARTED,
                "Processing started: " + photo.getFilename());

        if (targetStatus == PhotoStatus.PROCESSING) {
            return;
        }

        if (targetStatus == PhotoStatus.FAILED) {
            photo.markFailed("Simulated failure for demo");
            photo.setUpdatedAt(photo.getUploadedAt().plusSeconds(5));
            eventService.logEvent(photo.getId(), EventType.PROCESSING_FAILED,
                    "Processing failed: " + photo.getFilename() + " - Simulated failure for demo");
            return;
        }

        photo.markProcessed();
        photo.setUpdatedAt(photo.getUploadedAt().plusSeconds(5));
        eventService.logEvent(photo.getId(), EventType.PROCESSING_COMPLETED,
                "Processing completed: " + photo.getFilename());

        if (targetStatus == PhotoStatus.PROCESSED) {
            return;
        }

        if (targetStatus == PhotoStatus.APPROVED) {
            photo.approve();
            photo.setUpdatedAt(photo.getUploadedAt().plusSeconds(10));
            eventService.logEvent(photo.getId(), EventType.APPROVED,
                    "Photo approved: " + photo.getFilename());
        } else if (targetStatus == PhotoStatus.REJECTED) {
            photo.reject();
            photo.setUpdatedAt(photo.getUploadedAt().plusSeconds(10));
            eventService.logEvent(photo.getId(), EventType.REJECTED,
                    "Photo rejected: " + photo.getFilename());
        }
    }
}
