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

    @Transactional
    public List<Photo> uploadPhotos(List<MultipartFile> files) {
        List<Photo> uploadedPhotos = new ArrayList<>();

        // Get current user from security context
        UUID currentUserId = getCurrentUserId();

        for (MultipartFile file : files) {
            try {
                byte[] content = file.getBytes();
                String contentHash = computeHash(content);
                UUID photoId = UUID.randomUUID();
                Instant now = Instant.now();

                // Upload to S3
                String s3Key = s3StorageService.uploadPhoto(photoId, content, file.getContentType());

                // Save metadata to database
                PhotoEntity entity = PhotoEntity.builder()
                        .id(photoId)
                        .filename(file.getOriginalFilename())
                        .mimeType(file.getContentType())
                        .sizeBytes(file.getSize())
                        .contentHash(contentHash)
                        .s3Key(s3Key)
                        .status(PhotoStatus.PENDING)
                        .uploadedAt(now)
                        .updatedAt(now)
                        .uploadedByUserId(currentUserId)
                        .tags(new HashSet<>())
                        .build();

                photoRepository.save(entity);
                eventService.logEvent(photoId, EventType.PHOTO_CREATED,
                        "Photo uploaded: " + entity.getFilename());

                uploadedPhotos.add(entityToPhoto(entity, null));
                log.info("Photo uploaded: {} ({})", entity.getFilename(), photoId);
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
}
