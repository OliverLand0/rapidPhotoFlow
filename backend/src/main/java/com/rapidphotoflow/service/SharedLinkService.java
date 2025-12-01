package com.rapidphotoflow.service;

import com.rapidphotoflow.domain.EventType;
import com.rapidphotoflow.domain.SharedLink;
import com.rapidphotoflow.entity.PhotoEntity;
import com.rapidphotoflow.entity.SharedLinkEntity;
import com.rapidphotoflow.repository.PhotoRepository;
import com.rapidphotoflow.repository.SharedLinkRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SharedLinkService {

    private final SharedLinkRepository sharedLinkRepository;
    private final PhotoRepository photoRepository;
    private final CurrentUserService currentUserService;
    private final TokenService tokenService;
    private final EventService eventService;

    @Value("${app.share.base-url:}")
    private String shareBaseUrl;

    /**
     * Create a share link for a photo
     */
    @Transactional
    public SharedLink createPhotoShare(UUID photoId) {
        UUID userId = getCurrentUserId();
        if (userId == null) {
            throw new IllegalStateException("User not authenticated");
        }

        // Verify photo exists and belongs to user
        PhotoEntity photo = photoRepository.findById(photoId)
                .orElseThrow(() -> new IllegalArgumentException("Photo not found"));

        if (!userId.equals(photo.getUploadedByUserId())) {
            throw new IllegalArgumentException("Photo not found");
        }

        // Generate unique token
        String token = generateUniqueToken();

        SharedLink sharedLink = SharedLink.createForPhoto(photoId, userId, token);

        SharedLinkEntity entity = domainToEntity(sharedLink);
        sharedLinkRepository.save(entity);

        eventService.logEvent(photoId, EventType.SHARED_LINK_CREATED,
                "Share link created: " + token);

        log.info("Share link created for photo {} by user {}: {}", photoId, userId, token);

        return entityToDomain(entity, photo.getFilename());
    }

    /**
     * Create a share link with custom settings
     */
    @Transactional
    public SharedLink createShareWithSettings(UUID photoId, Boolean downloadAllowed,
                                               Boolean downloadOriginal, Integer maxViews,
                                               Boolean requireEmail, Instant expiresAt,
                                               String password) {
        UUID userId = getCurrentUserId();
        if (userId == null) {
            throw new IllegalStateException("User not authenticated");
        }

        // Verify photo exists and belongs to user
        PhotoEntity photo = photoRepository.findById(photoId)
                .orElseThrow(() -> new IllegalArgumentException("Photo not found"));

        if (!userId.equals(photo.getUploadedByUserId())) {
            throw new IllegalArgumentException("Photo not found");
        }

        // Generate unique token
        String token = generateUniqueToken();

        SharedLink sharedLink = SharedLink.createForPhoto(photoId, userId, token);

        // Apply settings
        if (downloadAllowed != null) {
            sharedLink.setDownloadAllowed(downloadAllowed);
        }
        if (downloadOriginal != null) {
            sharedLink.setDownloadOriginal(downloadOriginal);
        }
        sharedLink.setMaxViews(maxViews);
        if (requireEmail != null) {
            sharedLink.setRequireEmail(requireEmail);
        }
        sharedLink.setExpiresAt(expiresAt);

        SharedLinkEntity entity = domainToEntity(sharedLink);

        // Handle password (would need PasswordService for proper hashing in production)
        if (password != null && !password.isEmpty()) {
            // For MVP, store hashed - in production use BCrypt
            entity.setPasswordHash(hashPassword(password));
        }

        sharedLinkRepository.save(entity);

        eventService.logEvent(photoId, EventType.SHARED_LINK_CREATED,
                "Share link created with custom settings: " + token);

        log.info("Share link created for photo {} with settings by user {}: {}", photoId, userId, token);

        return entityToDomain(entity, photo.getFilename());
    }

    /**
     * Get all share links for the current user
     */
    public List<SharedLink> getSharesByUser() {
        UUID userId = getCurrentUserId();
        if (userId == null) {
            return Collections.emptyList();
        }

        List<SharedLinkEntity> entities = sharedLinkRepository
                .findByCreatedByUserIdOrderByCreatedAtDesc(userId);

        return entities.stream()
                .map(entity -> {
                    String targetName = getTargetName(entity);
                    return entityToDomain(entity, targetName);
                })
                .collect(Collectors.toList());
    }

    /**
     * Get a share link by ID (for authenticated user)
     */
    public Optional<SharedLink> getShareById(UUID shareId) {
        UUID userId = getCurrentUserId();
        if (userId == null) {
            return Optional.empty();
        }

        return sharedLinkRepository.findByIdAndCreatedByUserId(shareId, userId)
                .map(entity -> {
                    String targetName = getTargetName(entity);
                    return entityToDomain(entity, targetName);
                });
    }

    /**
     * Get a share link by token (for public access - no auth check)
     */
    public Optional<SharedLink> getShareByToken(String token) {
        if (token == null || token.isBlank()) {
            return Optional.empty();
        }

        return sharedLinkRepository.findByToken(token)
                .map(entity -> {
                    String targetName = getTargetName(entity);
                    return entityToDomain(entity, targetName);
                });
    }

    /**
     * Update share settings
     */
    @Transactional
    public SharedLink updateShare(UUID shareId, Boolean downloadAllowed, Boolean downloadOriginal,
                                   Integer maxViews, Boolean requireEmail, Instant expiresAt,
                                   Boolean isActive) {
        UUID userId = getCurrentUserId();
        if (userId == null) {
            throw new IllegalStateException("User not authenticated");
        }

        SharedLinkEntity entity = sharedLinkRepository.findByIdAndCreatedByUserId(shareId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Share link not found"));

        if (downloadAllowed != null) {
            entity.setDownloadAllowed(downloadAllowed);
        }
        if (downloadOriginal != null) {
            entity.setDownloadOriginal(downloadOriginal);
        }
        entity.setMaxViews(maxViews);
        if (requireEmail != null) {
            entity.setRequireEmail(requireEmail);
        }
        entity.setExpiresAt(expiresAt);
        if (isActive != null) {
            entity.setIsActive(isActive);
        }

        entity.setUpdatedAt(Instant.now());
        sharedLinkRepository.save(entity);

        UUID targetId = entity.getPhotoId() != null ? entity.getPhotoId() :
                        entity.getAlbumId() != null ? entity.getAlbumId() : entity.getFolderId();
        eventService.logEvent(targetId, EventType.SHARED_LINK_UPDATED,
                "Share link updated: " + entity.getToken());

        log.info("Share link updated: {}", entity.getToken());

        String targetName = getTargetName(entity);
        return entityToDomain(entity, targetName);
    }

    /**
     * Deactivate a share link
     */
    @Transactional
    public void deactivateShare(UUID shareId) {
        UUID userId = getCurrentUserId();
        if (userId == null) {
            throw new IllegalStateException("User not authenticated");
        }

        SharedLinkEntity entity = sharedLinkRepository.findByIdAndCreatedByUserId(shareId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Share link not found"));

        entity.setIsActive(false);
        entity.setUpdatedAt(Instant.now());
        sharedLinkRepository.save(entity);

        UUID targetId = entity.getPhotoId() != null ? entity.getPhotoId() :
                        entity.getAlbumId() != null ? entity.getAlbumId() : entity.getFolderId();
        eventService.logEvent(targetId, EventType.SHARED_LINK_DEACTIVATED,
                "Share link deactivated: " + entity.getToken());

        log.info("Share link deactivated: {}", entity.getToken());
    }

    /**
     * Reactivate a share link
     */
    @Transactional
    public void reactivateShare(UUID shareId) {
        UUID userId = getCurrentUserId();
        if (userId == null) {
            throw new IllegalStateException("User not authenticated");
        }

        SharedLinkEntity entity = sharedLinkRepository.findByIdAndCreatedByUserId(shareId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Share link not found"));

        entity.setIsActive(true);
        entity.setUpdatedAt(Instant.now());
        sharedLinkRepository.save(entity);

        log.info("Share link reactivated: {}", entity.getToken());
    }

    /**
     * Delete a share link
     */
    @Transactional
    public void deleteShare(UUID shareId) {
        UUID userId = getCurrentUserId();
        if (userId == null) {
            throw new IllegalStateException("User not authenticated");
        }

        SharedLinkEntity entity = sharedLinkRepository.findByIdAndCreatedByUserId(shareId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Share link not found"));

        UUID targetId = entity.getPhotoId() != null ? entity.getPhotoId() :
                        entity.getAlbumId() != null ? entity.getAlbumId() : entity.getFolderId();

        sharedLinkRepository.delete(entity);

        eventService.logEvent(targetId, EventType.SHARED_LINK_DELETED,
                "Share link deleted: " + entity.getToken());

        log.info("Share link deleted: {}", entity.getToken());
    }

    /**
     * Record a view access (public endpoint)
     */
    @Transactional
    public void recordView(String token) {
        sharedLinkRepository.findByToken(token).ifPresent(entity -> {
            sharedLinkRepository.incrementViewCount(entity.getId());

            UUID targetId = entity.getPhotoId() != null ? entity.getPhotoId() :
                            entity.getAlbumId() != null ? entity.getAlbumId() : entity.getFolderId();
            eventService.logEvent(targetId, EventType.SHARED_LINK_ACCESSED,
                    "Share link accessed: " + token);
        });
    }

    /**
     * Record a download (public endpoint)
     */
    @Transactional
    public void recordDownload(String token) {
        sharedLinkRepository.findByToken(token).ifPresent(entity -> {
            sharedLinkRepository.incrementDownloadCount(entity.getId());

            UUID targetId = entity.getPhotoId() != null ? entity.getPhotoId() :
                            entity.getAlbumId() != null ? entity.getAlbumId() : entity.getFolderId();
            eventService.logEvent(targetId, EventType.SHARED_CONTENT_DOWNLOADED,
                    "Shared content downloaded via: " + token);
        });
    }

    /**
     * Verify password for protected share
     */
    public boolean verifyPassword(String token, String password) {
        Optional<SharedLinkEntity> entityOpt = sharedLinkRepository.findByToken(token);
        if (entityOpt.isEmpty()) {
            return false;
        }

        SharedLinkEntity entity = entityOpt.get();
        if (entity.getPasswordHash() == null) {
            return true; // No password required
        }

        return checkPassword(password, entity.getPasswordHash());
    }

    /**
     * Get shares for a specific photo
     */
    public List<SharedLink> getSharesForPhoto(UUID photoId) {
        UUID userId = getCurrentUserId();
        if (userId == null) {
            return Collections.emptyList();
        }

        // Verify photo belongs to user
        PhotoEntity photo = photoRepository.findById(photoId).orElse(null);
        if (photo == null || !userId.equals(photo.getUploadedByUserId())) {
            return Collections.emptyList();
        }

        return sharedLinkRepository.findByPhotoId(photoId).stream()
                .map(entity -> entityToDomain(entity, photo.getFilename()))
                .collect(Collectors.toList());
    }

    private String generateUniqueToken() {
        String token;
        int attempts = 0;
        do {
            token = tokenService.generateSecureToken();
            attempts++;
            if (attempts > 10) {
                throw new RuntimeException("Failed to generate unique token");
            }
        } while (sharedLinkRepository.existsByToken(token));
        return token;
    }

    private UUID getCurrentUserId() {
        return currentUserService.getCurrentUserId();
    }

    private String getTargetName(SharedLinkEntity entity) {
        if (entity.getPhotoId() != null) {
            return photoRepository.findById(entity.getPhotoId())
                    .map(PhotoEntity::getFilename)
                    .orElse("Unknown Photo");
        }
        // TODO: Add album and folder name lookups
        return "Unknown";
    }

    private SharedLinkEntity domainToEntity(SharedLink domain) {
        return SharedLinkEntity.builder()
                .id(domain.getId())
                .token(domain.getToken())
                .photoId(domain.getPhotoId())
                .albumId(domain.getAlbumId())
                .folderId(domain.getFolderId())
                .createdByUserId(domain.getCreatedByUserId())
                .passwordHash(domain.getPasswordHash())
                .expiresAt(domain.getExpiresAt())
                .downloadAllowed(domain.isDownloadAllowed())
                .downloadOriginal(domain.isDownloadOriginal())
                .maxViews(domain.getMaxViews())
                .requireEmail(domain.isRequireEmail())
                .isActive(domain.isActive())
                .viewCount(domain.getViewCount())
                .downloadCount(domain.getDownloadCount())
                .lastAccessedAt(domain.getLastAccessedAt())
                .createdAt(domain.getCreatedAt())
                .updatedAt(domain.getUpdatedAt())
                .build();
    }

    private SharedLink entityToDomain(SharedLinkEntity entity, String targetName) {
        String url = buildShareUrl(entity.getToken());

        return SharedLink.builder()
                .id(entity.getId())
                .token(entity.getToken())
                .photoId(entity.getPhotoId())
                .albumId(entity.getAlbumId())
                .folderId(entity.getFolderId())
                .createdByUserId(entity.getCreatedByUserId())
                .passwordHash(entity.getPasswordHash())
                .expiresAt(entity.getExpiresAt())
                .downloadAllowed(entity.getDownloadAllowed())
                .downloadOriginal(entity.getDownloadOriginal())
                .maxViews(entity.getMaxViews())
                .requireEmail(entity.getRequireEmail())
                .isActive(entity.getIsActive())
                .viewCount(entity.getViewCount())
                .downloadCount(entity.getDownloadCount())
                .lastAccessedAt(entity.getLastAccessedAt())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .url(url)
                .targetName(targetName)
                .build();
    }

    private String buildShareUrl(String token) {
        if (shareBaseUrl != null && !shareBaseUrl.isEmpty()) {
            return shareBaseUrl + "/s/" + token;
        }
        return "/s/" + token;
    }

    // Simple password hashing for MVP - in production use BCrypt via PasswordService
    private String hashPassword(String password) {
        // Simple hash for MVP - replace with BCrypt in production
        return Integer.toHexString(password.hashCode());
    }

    private boolean checkPassword(String password, String hash) {
        // Simple check for MVP - replace with BCrypt in production
        return hash.equals(Integer.toHexString(password.hashCode()));
    }
}
