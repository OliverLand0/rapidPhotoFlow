package com.rapidphotoflow.domain;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Data
@Builder
public class Album {
    private UUID id;
    private String name;
    private String description;
    private UUID coverPhotoId;
    private UUID userId;
    private Instant createdAt;
    private Instant updatedAt;

    // Computed fields
    @Builder.Default
    private Set<UUID> photoIds = new HashSet<>();
    private int photoCount;
    private String coverPhotoUrl;

    public static Album create(String name, String description, UUID userId) {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Album name cannot be empty");
        }

        String normalizedName = name.trim();
        if (normalizedName.length() > 255) {
            throw new IllegalArgumentException("Album name cannot exceed 255 characters");
        }

        Instant now = Instant.now();
        return Album.builder()
                .id(UUID.randomUUID())
                .name(normalizedName)
                .description(description != null ? description.trim() : null)
                .userId(userId)
                .createdAt(now)
                .updatedAt(now)
                .photoIds(new HashSet<>())
                .build();
    }

    public void update(String newName, String newDescription) {
        if (newName != null) {
            if (newName.isBlank()) {
                throw new IllegalArgumentException("Album name cannot be empty");
            }
            String normalizedName = newName.trim();
            if (normalizedName.length() > 255) {
                throw new IllegalArgumentException("Album name cannot exceed 255 characters");
            }
            this.name = normalizedName;
        }

        if (newDescription != null) {
            this.description = newDescription.trim();
        }

        this.updatedAt = Instant.now();
    }

    public void setCoverPhoto(UUID photoId) {
        this.coverPhotoId = photoId;
        this.updatedAt = Instant.now();
    }

    public boolean addPhoto(UUID photoId) {
        if (photoId == null) {
            return false;
        }
        if (this.photoIds == null) {
            this.photoIds = new HashSet<>();
        }
        boolean added = this.photoIds.add(photoId);
        if (added) {
            this.updatedAt = Instant.now();
        }
        return added;
    }

    public boolean removePhoto(UUID photoId) {
        if (photoId == null || this.photoIds == null) {
            return false;
        }
        boolean removed = this.photoIds.remove(photoId);
        if (removed) {
            // If the removed photo was the cover, clear the cover
            if (photoId.equals(this.coverPhotoId)) {
                this.coverPhotoId = null;
            }
            this.updatedAt = Instant.now();
        }
        return removed;
    }

    public boolean containsPhoto(UUID photoId) {
        return this.photoIds != null && this.photoIds.contains(photoId);
    }
}
