package com.rapidphotoflow.domain;

import lombok.Builder;
import lombok.Data;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Data
@Builder
public class Photo {
    private UUID id;
    private String filename;
    private String mimeType;
    private long sizeBytes;
    private byte[] content;
    private String contentHash;
    private PhotoStatus status;
    private String failureReason;
    private Instant uploadedAt;
    private Instant updatedAt;
    @Builder.Default
    private Set<String> tags = new HashSet<>();

    public static String computeHash(byte[] content) {
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

    public static Photo createPending(String filename, String mimeType, long sizeBytes, byte[] content) {
        Instant now = Instant.now();
        return Photo.builder()
                .id(UUID.randomUUID())
                .filename(filename)
                .mimeType(mimeType)
                .sizeBytes(sizeBytes)
                .content(content)
                .contentHash(computeHash(content))
                .status(PhotoStatus.PENDING)
                .uploadedAt(now)
                .updatedAt(now)
                .build();
    }

    public void startProcessing() {
        if (status != PhotoStatus.PENDING) {
            throw new IllegalStateException("Can only start processing from PENDING state. Current: " + status);
        }
        this.status = PhotoStatus.PROCESSING;
        this.updatedAt = Instant.now();
    }

    public void markProcessed() {
        if (status != PhotoStatus.PROCESSING) {
            throw new IllegalStateException("Can only mark processed from PROCESSING state. Current: " + status);
        }
        this.status = PhotoStatus.PROCESSED;
        this.failureReason = null;
        this.updatedAt = Instant.now();
    }

    public void markFailed(String reason) {
        if (status != PhotoStatus.PROCESSING) {
            throw new IllegalStateException("Can only mark failed from PROCESSING state. Current: " + status);
        }
        this.status = PhotoStatus.FAILED;
        this.failureReason = reason;
        this.updatedAt = Instant.now();
    }

    public void approve() {
        if (status != PhotoStatus.PROCESSED && status != PhotoStatus.REJECTED) {
            throw new IllegalStateException("Can only approve from PROCESSED or REJECTED state. Current: " + status);
        }
        this.status = PhotoStatus.APPROVED;
        this.updatedAt = Instant.now();
    }

    public void reject() {
        if (status != PhotoStatus.PROCESSED && status != PhotoStatus.FAILED && status != PhotoStatus.APPROVED) {
            throw new IllegalStateException("Can only reject from PROCESSED, FAILED, or APPROVED state. Current: " + status);
        }
        this.status = PhotoStatus.REJECTED;
        this.updatedAt = Instant.now();
    }

    public void retry() {
        if (status != PhotoStatus.FAILED) {
            throw new IllegalStateException("Can only retry from FAILED state. Current: " + status);
        }
        this.status = PhotoStatus.PENDING;
        this.failureReason = null;
        this.updatedAt = Instant.now();
    }

    public boolean addTag(String tag) {
        if (tag == null || tag.isBlank()) {
            return false;
        }
        String normalizedTag = tag.toLowerCase().trim();
        if (normalizedTag.isEmpty()) {
            return false;
        }
        if (this.tags == null) {
            this.tags = new HashSet<>();
        }
        boolean added = this.tags.add(normalizedTag);
        if (added) {
            this.updatedAt = Instant.now();
        }
        return added;
    }

    public boolean removeTag(String tag) {
        if (tag == null || this.tags == null) {
            return false;
        }
        String normalizedTag = tag.toLowerCase().trim();
        boolean removed = this.tags.remove(normalizedTag);
        if (removed) {
            this.updatedAt = Instant.now();
        }
        return removed;
    }

    public void clearTags() {
        if (this.tags != null && !this.tags.isEmpty()) {
            this.tags.clear();
            this.updatedAt = Instant.now();
        }
    }
}
