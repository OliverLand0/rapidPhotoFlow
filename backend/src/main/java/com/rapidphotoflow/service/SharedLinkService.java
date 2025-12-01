package com.rapidphotoflow.service;

import com.rapidphotoflow.domain.EventType;
import com.rapidphotoflow.domain.SharedLink;
import com.rapidphotoflow.dto.PublicPhotoDTO;
import com.rapidphotoflow.entity.AlbumEntity;
import com.rapidphotoflow.entity.FolderEntity;
import com.rapidphotoflow.entity.PhotoEntity;
import com.rapidphotoflow.entity.SharedLinkEntity;
import com.rapidphotoflow.repository.AlbumPhotoRepository;
import com.rapidphotoflow.repository.AlbumRepository;
import com.rapidphotoflow.repository.FolderRepository;
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
    private final AlbumRepository albumRepository;
    private final AlbumPhotoRepository albumPhotoRepository;
    private final FolderRepository folderRepository;
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
     * Create a share link for an album
     */
    @Transactional
    public SharedLink createAlbumShare(UUID albumId) {
        UUID userId = getCurrentUserId();
        if (userId == null) {
            throw new IllegalStateException("User not authenticated");
        }

        // Verify album exists and belongs to user
        AlbumEntity album = albumRepository.findByIdAndUserId(albumId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Album not found"));

        // Generate unique token
        String token = generateUniqueToken();

        SharedLink sharedLink = SharedLink.createForAlbum(albumId, userId, token);

        SharedLinkEntity entity = domainToEntity(sharedLink);
        sharedLinkRepository.save(entity);

        eventService.logEvent(albumId, EventType.SHARED_LINK_CREATED,
                "Share link created for album: " + token);

        log.info("Share link created for album {} by user {}: {}", albumId, userId, token);

        return entityToDomain(entity, album.getName());
    }

    /**
     * Create a share link for a folder
     */
    @Transactional
    public SharedLink createFolderShare(UUID folderId) {
        UUID userId = getCurrentUserId();
        if (userId == null) {
            throw new IllegalStateException("User not authenticated");
        }

        // Verify folder exists and belongs to user
        FolderEntity folder = folderRepository.findByIdAndUserId(folderId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Folder not found"));

        // Generate unique token
        String token = generateUniqueToken();

        SharedLink sharedLink = SharedLink.createForFolder(folderId, userId, token);

        SharedLinkEntity entity = domainToEntity(sharedLink);
        sharedLinkRepository.save(entity);

        eventService.logEvent(folderId, EventType.SHARED_LINK_CREATED,
                "Share link created for folder: " + token);

        log.info("Share link created for folder {} by user {}: {}", folderId, userId, token);

        return entityToDomain(entity, folder.getName());
    }

    /**
     * Create a share link with custom settings for photo
     */
    @Transactional
    public SharedLink createShareWithSettings(UUID photoId, Boolean downloadAllowed,
                                               Boolean downloadOriginal, Integer maxViews,
                                               Boolean requireEmail, Instant expiresAt,
                                               String password) {
        UUID userId = getCurrentUserId();
        log.info("createShareWithSettings: userId={}, photoId={}", userId, photoId);
        if (userId == null) {
            throw new IllegalStateException("User not authenticated");
        }

        // Verify photo exists and belongs to user
        PhotoEntity photo = photoRepository.findById(photoId)
                .orElseThrow(() -> new IllegalArgumentException("Photo not found"));

        log.info("Photo found: uploadedByUserId={}", photo.getUploadedByUserId());
        if (!userId.equals(photo.getUploadedByUserId())) {
            log.error("User ID mismatch: currentUserId={}, photoUploadedBy={}", userId, photo.getUploadedByUserId());
            throw new IllegalArgumentException("Photo not found");
        }

        // Generate unique token
        String token = generateUniqueToken();

        SharedLink sharedLink = SharedLink.createForPhoto(photoId, userId, token);

        // Apply settings
        applySettings(sharedLink, downloadAllowed, downloadOriginal, maxViews, requireEmail, expiresAt);

        SharedLinkEntity entity = domainToEntity(sharedLink);

        // Handle password
        if (password != null && !password.isEmpty()) {
            entity.setPasswordHash(hashPassword(password));
        }

        sharedLinkRepository.save(entity);

        eventService.logEvent(photoId, EventType.SHARED_LINK_CREATED,
                "Share link created with custom settings: " + token);

        log.info("Share link created for photo {} with settings by user {}: {}", photoId, userId, token);

        return entityToDomain(entity, photo.getFilename());
    }

    /**
     * Create a share link with custom settings for album
     */
    @Transactional
    public SharedLink createAlbumShareWithSettings(UUID albumId, Boolean downloadAllowed,
                                                    Boolean downloadOriginal, Integer maxViews,
                                                    Boolean requireEmail, Instant expiresAt,
                                                    String password) {
        UUID userId = getCurrentUserId();
        if (userId == null) {
            throw new IllegalStateException("User not authenticated");
        }

        // Verify album exists and belongs to user
        AlbumEntity album = albumRepository.findByIdAndUserId(albumId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Album not found"));

        // Generate unique token
        String token = generateUniqueToken();

        SharedLink sharedLink = SharedLink.createForAlbum(albumId, userId, token);

        // Apply settings
        applySettings(sharedLink, downloadAllowed, downloadOriginal, maxViews, requireEmail, expiresAt);

        SharedLinkEntity entity = domainToEntity(sharedLink);

        // Handle password
        if (password != null && !password.isEmpty()) {
            entity.setPasswordHash(hashPassword(password));
        }

        sharedLinkRepository.save(entity);

        eventService.logEvent(albumId, EventType.SHARED_LINK_CREATED,
                "Share link created for album with custom settings: " + token);

        log.info("Share link created for album {} with settings by user {}: {}", albumId, userId, token);

        return entityToDomain(entity, album.getName());
    }

    /**
     * Create a share link with custom settings for folder
     */
    @Transactional
    public SharedLink createFolderShareWithSettings(UUID folderId, Boolean downloadAllowed,
                                                     Boolean downloadOriginal, Integer maxViews,
                                                     Boolean requireEmail, Instant expiresAt,
                                                     String password) {
        UUID userId = getCurrentUserId();
        if (userId == null) {
            throw new IllegalStateException("User not authenticated");
        }

        // Verify folder exists and belongs to user
        FolderEntity folder = folderRepository.findByIdAndUserId(folderId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Folder not found"));

        // Generate unique token
        String token = generateUniqueToken();

        SharedLink sharedLink = SharedLink.createForFolder(folderId, userId, token);

        // Apply settings
        applySettings(sharedLink, downloadAllowed, downloadOriginal, maxViews, requireEmail, expiresAt);

        SharedLinkEntity entity = domainToEntity(sharedLink);

        // Handle password
        if (password != null && !password.isEmpty()) {
            entity.setPasswordHash(hashPassword(password));
        }

        sharedLinkRepository.save(entity);

        eventService.logEvent(folderId, EventType.SHARED_LINK_CREATED,
                "Share link created for folder with custom settings: " + token);

        log.info("Share link created for folder {} with settings by user {}: {}", folderId, userId, token);

        return entityToDomain(entity, folder.getName());
    }

    private void applySettings(SharedLink sharedLink, Boolean downloadAllowed,
                                Boolean downloadOriginal, Integer maxViews,
                                Boolean requireEmail, Instant expiresAt) {
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

        // Convert to domain model
        String targetName = getTargetName(entity);
        SharedLink sharedLink = entityToDomain(entity, targetName);

        // Use domain methods to update settings
        sharedLink.updateSettings(downloadAllowed, downloadOriginal, maxViews, requireEmail, expiresAt);

        // Handle activation/deactivation through domain methods
        if (isActive != null) {
            if (isActive) {
                sharedLink.activate();
            } else {
                sharedLink.deactivate();
            }
        }

        // Convert back to entity and save
        SharedLinkEntity updatedEntity = domainToEntity(sharedLink);
        sharedLinkRepository.save(updatedEntity);

        eventService.logEvent(sharedLink.getTargetId(), EventType.SHARED_LINK_UPDATED,
                "Share link updated: " + sharedLink.getToken());

        log.info("Share link updated: {}", sharedLink.getToken());

        return sharedLink;
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

        // Convert to domain model and use domain method
        String targetName = getTargetName(entity);
        SharedLink sharedLink = entityToDomain(entity, targetName);
        sharedLink.deactivate();

        // Convert back and save
        SharedLinkEntity updatedEntity = domainToEntity(sharedLink);
        sharedLinkRepository.save(updatedEntity);

        eventService.logEvent(sharedLink.getTargetId(), EventType.SHARED_LINK_DEACTIVATED,
                "Share link deactivated: " + sharedLink.getToken());

        log.info("Share link deactivated: {}", sharedLink.getToken());
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

        // Convert to domain model and use domain method
        String targetName = getTargetName(entity);
        SharedLink sharedLink = entityToDomain(entity, targetName);
        sharedLink.activate();

        // Convert back and save
        SharedLinkEntity updatedEntity = domainToEntity(sharedLink);
        sharedLinkRepository.save(updatedEntity);

        log.info("Share link reactivated: {}", sharedLink.getToken());
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

    /**
     * Get the photo count for a shared album
     */
    public int getAlbumPhotoCount(UUID albumId) {
        return (int) albumPhotoRepository.countByAlbumId(albumId);
    }

    /**
     * Get a thumbnail photo ID for a share link (for album/folder shares, returns the first photo)
     */
    public UUID getThumbnailPhotoId(SharedLink share) {
        // For photo shares, return the photo ID directly
        if (share.getPhotoId() != null) {
            return share.getPhotoId();
        }

        // For album shares, get the cover photo or first photo
        if (share.getAlbumId() != null) {
            AlbumEntity album = albumRepository.findById(share.getAlbumId()).orElse(null);
            if (album != null && album.getCoverPhotoId() != null) {
                return album.getCoverPhotoId();
            }
            // Get first photo from album
            return albumPhotoRepository.findByAlbumIdOrderByAddedAtDesc(share.getAlbumId()).stream()
                    .map(ap -> ap.getPhotoId())
                    .findFirst()
                    .orElse(null);
        }

        // For folder shares, get first photo from folder
        if (share.getFolderId() != null) {
            return photoRepository.findByFolderId(share.getFolderId()).stream()
                    .map(PhotoEntity::getId)
                    .findFirst()
                    .orElse(null);
        }

        return null;
    }

    /**
     * Get the photo count for a shared folder
     */
    public int getFolderPhotoCount(UUID folderId) {
        return (int) photoRepository.countByFolderId(folderId);
    }

    /**
     * Get photos for a shared folder or album (public access)
     */
    public List<PublicPhotoDTO> getPhotosForShare(UUID shareId) {
        SharedLinkEntity entity = sharedLinkRepository.findById(shareId).orElse(null);
        if (entity == null) {
            return Collections.emptyList();
        }

        List<PhotoEntity> photos;
        if (entity.getFolderId() != null) {
            photos = photoRepository.findByFolderId(entity.getFolderId());
        } else if (entity.getAlbumId() != null) {
            photos = albumPhotoRepository.findByAlbumIdOrderByAddedAtDesc(entity.getAlbumId()).stream()
                    .map(ap -> photoRepository.findById(ap.getPhotoId()).orElse(null))
                    .filter(p -> p != null)
                    .collect(Collectors.toList());
        } else if (entity.getPhotoId() != null) {
            // Single photo share
            photos = photoRepository.findById(entity.getPhotoId())
                    .map(Collections::singletonList)
                    .orElse(Collections.emptyList());
        } else {
            return Collections.emptyList();
        }

        return photos.stream()
                .map(photo -> PublicPhotoDTO.create(photo.getId(), photo.getFilename(), photo.getMimeType(), entity.getToken()))
                .collect(Collectors.toList());
    }

    /**
     * Check if a photo exists in a share (for folder/album shares)
     */
    public boolean photoExistsInShare(UUID shareId, UUID photoId) {
        SharedLinkEntity entity = sharedLinkRepository.findById(shareId).orElse(null);
        if (entity == null) {
            return false;
        }

        if (entity.getPhotoId() != null) {
            return entity.getPhotoId().equals(photoId);
        }

        if (entity.getFolderId() != null) {
            return photoRepository.findById(photoId)
                    .map(photo -> entity.getFolderId().equals(photo.getFolderId()))
                    .orElse(false);
        }

        if (entity.getAlbumId() != null) {
            return albumPhotoRepository.existsByAlbumIdAndPhotoId(entity.getAlbumId(), photoId);
        }

        return false;
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
        if (entity.getAlbumId() != null) {
            return albumRepository.findById(entity.getAlbumId())
                    .map(AlbumEntity::getName)
                    .orElse("Unknown Album");
        }
        if (entity.getFolderId() != null) {
            return folderRepository.findById(entity.getFolderId())
                    .map(FolderEntity::getName)
                    .orElse("Unknown Folder");
        }
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
            return shareBaseUrl + "/share/" + token;
        }
        return "/share/" + token;
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
