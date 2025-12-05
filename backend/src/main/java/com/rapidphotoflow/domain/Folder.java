package com.rapidphotoflow.domain;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class Folder {
    private UUID id;
    private String name;
    private UUID parentId;
    private UUID userId;
    private Instant createdAt;
    private Instant updatedAt;

    // Computed fields for tree structure
    @Builder.Default
    private List<Folder> children = new ArrayList<>();
    private String path;
    private int photoCount;

    public static Folder create(String name, UUID parentId, UUID userId) {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Folder name cannot be empty");
        }

        String normalizedName = name.trim();
        if (normalizedName.length() > 255) {
            throw new IllegalArgumentException("Folder name cannot exceed 255 characters");
        }

        Instant now = Instant.now();
        return Folder.builder()
                .id(UUID.randomUUID())
                .name(normalizedName)
                .parentId(parentId)
                .userId(userId)
                .createdAt(now)
                .updatedAt(now)
                .build();
    }

    public void rename(String newName) {
        if (newName == null || newName.isBlank()) {
            throw new IllegalArgumentException("Folder name cannot be empty");
        }

        String normalizedName = newName.trim();
        if (normalizedName.length() > 255) {
            throw new IllegalArgumentException("Folder name cannot exceed 255 characters");
        }

        this.name = normalizedName;
        this.updatedAt = Instant.now();
    }

    public void moveTo(UUID newParentId) {
        // Prevent moving folder into itself
        if (newParentId != null && newParentId.equals(this.id)) {
            throw new IllegalArgumentException("Cannot move folder into itself");
        }

        this.parentId = newParentId;
        this.updatedAt = Instant.now();
    }

    public boolean isRoot() {
        return parentId == null;
    }
}
