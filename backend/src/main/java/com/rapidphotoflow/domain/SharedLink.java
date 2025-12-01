package com.rapidphotoflow.domain;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Data
@Builder
public class SharedLink {
    private UUID id;
    private String token;

    // Target - exactly one should be set
    private UUID photoId;
    private UUID albumId;
    private UUID folderId;

    // Owner
    private UUID createdByUserId;

    // Settings
    private String passwordHash;
    private Instant expiresAt;
    @Builder.Default
    private boolean downloadAllowed = true;
    @Builder.Default
    private boolean downloadOriginal = false;
    private Integer maxViews;
    @Builder.Default
    private boolean requireEmail = false;

    // Status
    @Builder.Default
    private boolean isActive = true;

    // Analytics
    @Builder.Default
    private int viewCount = 0;
    @Builder.Default
    private int downloadCount = 0;
    private Instant lastAccessedAt;

    private Instant createdAt;
    private Instant updatedAt;

    // Computed fields for API responses
    private String url;
    private String targetName;
    private String targetThumbnailUrl;

    public enum ShareType {
        PHOTO, ALBUM, FOLDER
    }

    public enum ExpirationOption {
        NEVER(null),
        ONE_HOUR(1L),
        ONE_DAY(24L),
        SEVEN_DAYS(168L),
        THIRTY_DAYS(720L);

        private final Long hours;

        ExpirationOption(Long hours) {
            this.hours = hours;
        }

        public Instant toExpiresAt() {
            if (hours == null) {
                return null;
            }
            return Instant.now().plus(hours, ChronoUnit.HOURS);
        }
    }

    /**
     * Create a new share link for a photo
     */
    public static SharedLink createForPhoto(UUID photoId, UUID userId, String token) {
        if (photoId == null) {
            throw new IllegalArgumentException("Photo ID cannot be null");
        }
        if (userId == null) {
            throw new IllegalArgumentException("User ID cannot be null");
        }
        if (token == null || token.isBlank()) {
            throw new IllegalArgumentException("Token cannot be empty");
        }

        Instant now = Instant.now();
        return SharedLink.builder()
                .id(UUID.randomUUID())
                .token(token)
                .photoId(photoId)
                .createdByUserId(userId)
                .downloadAllowed(true)
                .downloadOriginal(false)
                .requireEmail(false)
                .isActive(true)
                .viewCount(0)
                .downloadCount(0)
                .createdAt(now)
                .updatedAt(now)
                .build();
    }

    /**
     * Create a new share link for an album
     */
    public static SharedLink createForAlbum(UUID albumId, UUID userId, String token) {
        if (albumId == null) {
            throw new IllegalArgumentException("Album ID cannot be null");
        }
        if (userId == null) {
            throw new IllegalArgumentException("User ID cannot be null");
        }
        if (token == null || token.isBlank()) {
            throw new IllegalArgumentException("Token cannot be empty");
        }

        Instant now = Instant.now();
        return SharedLink.builder()
                .id(UUID.randomUUID())
                .token(token)
                .albumId(albumId)
                .createdByUserId(userId)
                .downloadAllowed(true)
                .downloadOriginal(false)
                .requireEmail(false)
                .isActive(true)
                .viewCount(0)
                .downloadCount(0)
                .createdAt(now)
                .updatedAt(now)
                .build();
    }

    /**
     * Create a new share link for a folder
     */
    public static SharedLink createForFolder(UUID folderId, UUID userId, String token) {
        if (folderId == null) {
            throw new IllegalArgumentException("Folder ID cannot be null");
        }
        if (userId == null) {
            throw new IllegalArgumentException("User ID cannot be null");
        }
        if (token == null || token.isBlank()) {
            throw new IllegalArgumentException("Token cannot be empty");
        }

        Instant now = Instant.now();
        return SharedLink.builder()
                .id(UUID.randomUUID())
                .token(token)
                .folderId(folderId)
                .createdByUserId(userId)
                .downloadAllowed(true)
                .downloadOriginal(false)
                .requireEmail(false)
                .isActive(true)
                .viewCount(0)
                .downloadCount(0)
                .createdAt(now)
                .updatedAt(now)
                .build();
    }

    public ShareType getType() {
        if (photoId != null) return ShareType.PHOTO;
        if (albumId != null) return ShareType.ALBUM;
        if (folderId != null) return ShareType.FOLDER;
        throw new IllegalStateException("SharedLink has no target set");
    }

    public UUID getTargetId() {
        if (photoId != null) return photoId;
        if (albumId != null) return albumId;
        if (folderId != null) return folderId;
        throw new IllegalStateException("SharedLink has no target set");
    }

    public boolean isExpired() {
        return expiresAt != null && Instant.now().isAfter(expiresAt);
    }

    public boolean isPasswordProtected() {
        return passwordHash != null && !passwordHash.isEmpty();
    }

    public boolean hasReachedMaxViews() {
        return maxViews != null && viewCount >= maxViews;
    }

    public boolean isAccessible() {
        return isActive && !isExpired() && !hasReachedMaxViews();
    }

    public void setExpiration(ExpirationOption option) {
        this.expiresAt = option.toExpiresAt();
        this.updatedAt = Instant.now();
    }

    public void setCustomExpiration(Instant expiresAt) {
        this.expiresAt = expiresAt;
        this.updatedAt = Instant.now();
    }

    public void deactivate() {
        this.isActive = false;
        this.updatedAt = Instant.now();
    }

    public void activate() {
        this.isActive = true;
        this.updatedAt = Instant.now();
    }

    public void recordView() {
        this.viewCount++;
        this.lastAccessedAt = Instant.now();
    }

    public void recordDownload() {
        this.downloadCount++;
        this.lastAccessedAt = Instant.now();
    }

    public void updateSettings(Boolean downloadAllowed, Boolean downloadOriginal,
                               Integer maxViews, Boolean requireEmail, Instant expiresAt) {
        if (downloadAllowed != null) {
            this.downloadAllowed = downloadAllowed;
        }
        if (downloadOriginal != null) {
            this.downloadOriginal = downloadOriginal;
        }
        this.maxViews = maxViews;
        if (requireEmail != null) {
            this.requireEmail = requireEmail;
        }
        this.expiresAt = expiresAt;
        this.updatedAt = Instant.now();
    }
}
