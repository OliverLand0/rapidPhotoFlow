package com.rapidphotoflow.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "shared_links", indexes = {
    @Index(name = "idx_shared_links_token", columnList = "token", unique = true),
    @Index(name = "idx_shared_links_user", columnList = "created_by_user_id, is_active, created_at"),
    @Index(name = "idx_shared_links_photo", columnList = "photo_id")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SharedLinkEntity {

    @Id
    private UUID id;

    @Column(nullable = false, unique = true, length = 32)
    private String token;

    // Target - exactly one must be non-null
    @Column(name = "photo_id")
    private UUID photoId;

    @Column(name = "album_id")
    private UUID albumId;

    @Column(name = "folder_id")
    private UUID folderId;

    // Owner
    @Column(name = "created_by_user_id", nullable = false)
    private UUID createdByUserId;

    // Settings
    @Column(name = "password_hash", length = 60)
    private String passwordHash;

    @Column(name = "expires_at")
    private Instant expiresAt;

    @Column(name = "download_allowed", nullable = false)
    @Builder.Default
    private Boolean downloadAllowed = true;

    @Column(name = "download_original", nullable = false)
    @Builder.Default
    private Boolean downloadOriginal = false;

    @Column(name = "max_views")
    private Integer maxViews;

    @Column(name = "require_email", nullable = false)
    @Builder.Default
    private Boolean requireEmail = false;

    // Status
    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    // Denormalized analytics
    @Column(name = "view_count", nullable = false)
    @Builder.Default
    private Integer viewCount = 0;

    @Column(name = "download_count", nullable = false)
    @Builder.Default
    private Integer downloadCount = 0;

    @Column(name = "last_accessed_at")
    private Instant lastAccessedAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        if (id == null) {
            id = UUID.randomUUID();
        }
        if (createdAt == null) {
            createdAt = Instant.now();
        }
        if (updatedAt == null) {
            updatedAt = Instant.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }

    // Helper methods
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

    public void incrementViewCount() {
        this.viewCount++;
        this.lastAccessedAt = Instant.now();
    }

    public void incrementDownloadCount() {
        this.downloadCount++;
        this.lastAccessedAt = Instant.now();
    }
}
