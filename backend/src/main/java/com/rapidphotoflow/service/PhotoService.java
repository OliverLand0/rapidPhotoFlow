package com.rapidphotoflow.service;

import com.rapidphotoflow.domain.EventType;
import com.rapidphotoflow.domain.Photo;
import com.rapidphotoflow.domain.PhotoStatus;
import com.rapidphotoflow.repository.InMemoryPhotoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PhotoService {

    private final InMemoryPhotoRepository photoRepository;
    private final EventService eventService;

    public List<Photo> uploadPhotos(List<MultipartFile> files) {
        List<Photo> uploadedPhotos = new ArrayList<>();

        for (MultipartFile file : files) {
            try {
                Photo photo = Photo.createPending(
                        file.getOriginalFilename(),
                        file.getContentType(),
                        file.getSize(),
                        file.getBytes()
                );
                photoRepository.save(photo);
                eventService.logEvent(photo.getId(), EventType.PHOTO_CREATED,
                        "Photo uploaded: " + photo.getFilename());
                uploadedPhotos.add(photo);
                log.info("Photo uploaded: {} ({})", photo.getFilename(), photo.getId());
            } catch (IOException e) {
                log.error("Failed to upload photo: {}", file.getOriginalFilename(), e);
            }
        }

        return uploadedPhotos;
    }

    public Optional<Photo> getPhotoById(UUID id) {
        return photoRepository.findById(id);
    }

    public List<Photo> getAllPhotos() {
        return photoRepository.findAll();
    }

    public List<Photo> getPhotosByStatus(PhotoStatus status) {
        return photoRepository.findByStatus(status);
    }

    public List<Photo> getPhotosByStatuses(List<PhotoStatus> statuses) {
        return photoRepository.findByStatusIn(statuses);
    }

    public Photo approve(UUID photoId) {
        Photo photo = photoRepository.findById(photoId)
                .orElseThrow(() -> new IllegalArgumentException("Photo not found: " + photoId));

        photo.approve();
        photoRepository.save(photo);
        eventService.logEvent(photoId, EventType.APPROVED,
                "Photo approved: " + photo.getFilename());
        log.info("Photo approved: {} ({})", photo.getFilename(), photoId);

        return photo;
    }

    public Photo reject(UUID photoId) {
        Photo photo = photoRepository.findById(photoId)
                .orElseThrow(() -> new IllegalArgumentException("Photo not found: " + photoId));

        photo.reject();
        photoRepository.save(photo);
        eventService.logEvent(photoId, EventType.REJECTED,
                "Photo rejected: " + photo.getFilename());
        log.info("Photo rejected: {} ({})", photo.getFilename(), photoId);

        return photo;
    }

    public Photo retry(UUID photoId) {
        Photo photo = photoRepository.findById(photoId)
                .orElseThrow(() -> new IllegalArgumentException("Photo not found: " + photoId));

        photo.retry();
        photoRepository.save(photo);
        eventService.logEvent(photoId, EventType.RETRY_REQUESTED,
                "Retry requested: " + photo.getFilename());
        log.info("Photo retry requested: {} ({})", photo.getFilename(), photoId);

        return photo;
    }

    public long getPhotoCount() {
        return photoRepository.count();
    }

    public long getPhotoCountByStatus(PhotoStatus status) {
        return photoRepository.countByStatus(status);
    }

    public void delete(UUID photoId) {
        Photo photo = photoRepository.findById(photoId)
                .orElseThrow(() -> new IllegalArgumentException("Photo not found: " + photoId));

        String filename = photo.getFilename();
        eventService.logEvent(photoId, EventType.DELETED,
                "Photo deleted: " + filename);
        photoRepository.deleteById(photoId);
        log.info("Photo deleted: {} ({})", filename, photoId);
    }

    /**
     * Returns a priority score for a photo status. Higher score = higher priority to keep.
     * Priority order (highest to lowest):
     * - APPROVED: User has approved this photo, always keep
     * - PROCESSED: Ready for review
     * - PROCESSING: Currently being processed
     * - PENDING: Waiting to be processed
     * - FAILED: Processing failed
     * - REJECTED: User rejected this photo, lowest priority
     */
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

    public List<Photo> deleteDuplicates() {
        List<Photo> allPhotos = photoRepository.findAll();
        Map<String, Photo> bestByHash = new HashMap<>();
        List<Photo> duplicates = new ArrayList<>();

        // Ensure all photos have content hashes
        for (Photo photo : allPhotos) {
            if (photo.getContentHash() == null) {
                String hash = Photo.computeHash(photo.getContent());
                photo.setContentHash(hash);
                photoRepository.save(photo);
            }
        }

        // Find the best photo for each content hash based on status priority
        // If same priority, keep the one uploaded first (oldest)
        for (Photo photo : allPhotos) {
            String hash = photo.getContentHash();
            Photo existing = bestByHash.get(hash);

            if (existing == null) {
                bestByHash.put(hash, photo);
            } else {
                int currentPriority = getStatusPriority(photo.getStatus());
                int existingPriority = getStatusPriority(existing.getStatus());

                if (currentPriority > existingPriority) {
                    // Current photo has higher priority - it becomes the one to keep
                    bestByHash.put(hash, photo);
                } else if (currentPriority == existingPriority) {
                    // Same priority - keep the older one
                    if (photo.getUploadedAt().isBefore(existing.getUploadedAt())) {
                        bestByHash.put(hash, photo);
                    }
                }
                // Otherwise, existing photo has higher priority - keep it
            }
        }

        // Delete all photos that are not the "best" for their hash
        for (Photo photo : allPhotos) {
            String hash = photo.getContentHash();
            Photo best = bestByHash.get(hash);

            if (!photo.getId().equals(best.getId())) {
                duplicates.add(photo);
                eventService.logEvent(photo.getId(), EventType.DELETED,
                        "Duplicate removed: " + photo.getFilename() + " (kept " + best.getStatus() + " version)");
                photoRepository.deleteById(photo.getId());
                log.info("Duplicate photo removed: {} ({}) [{}], kept {} ({}) [{}]",
                        photo.getFilename(), photo.getId(), photo.getStatus(),
                        best.getFilename(), best.getId(), best.getStatus());
            }
        }

        return duplicates;
    }

    public Photo addTag(UUID photoId, String tag) {
        Photo photo = photoRepository.findById(photoId)
                .orElseThrow(() -> new IllegalArgumentException("Photo not found: " + photoId));

        boolean added = photo.addTag(tag);
        if (added) {
            photoRepository.save(photo);
            String normalizedTag = tag.toLowerCase().trim();
            eventService.logEvent(photoId, EventType.TAG_ADDED,
                    "Tag '" + normalizedTag + "' added to " + photo.getFilename());
            log.info("Tag '{}' added to photo: {} ({})", normalizedTag, photo.getFilename(), photoId);
        }

        return photo;
    }

    public Photo removeTag(UUID photoId, String tag) {
        Photo photo = photoRepository.findById(photoId)
                .orElseThrow(() -> new IllegalArgumentException("Photo not found: " + photoId));

        boolean removed = photo.removeTag(tag);
        if (removed) {
            photoRepository.save(photo);
            String normalizedTag = tag.toLowerCase().trim();
            eventService.logEvent(photoId, EventType.TAG_REMOVED,
                    "Tag '" + normalizedTag + "' removed from " + photo.getFilename());
            log.info("Tag '{}' removed from photo: {} ({})", normalizedTag, photo.getFilename(), photoId);
        }

        return photo;
    }

    public List<Photo> getPhotosByTag(String tag) {
        String normalizedTag = tag.toLowerCase().trim();
        return photoRepository.findAll().stream()
                .filter(photo -> photo.getTags() != null && photo.getTags().contains(normalizedTag))
                .toList();
    }
}
