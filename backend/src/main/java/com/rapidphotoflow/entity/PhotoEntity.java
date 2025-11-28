package com.rapidphotoflow.entity;

import com.rapidphotoflow.domain.PhotoStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "photos")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PhotoEntity {

    @Id
    private UUID id;

    @Column(nullable = false)
    private String filename;

    @Column(name = "mime_type", nullable = false)
    private String mimeType;

    @Column(name = "size_bytes", nullable = false)
    private long sizeBytes;

    @Column(name = "content_hash")
    private String contentHash;

    @Column(name = "s3_key")
    private String s3Key;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PhotoStatus status;

    @Column(name = "failure_reason")
    private String failureReason;

    @Column(name = "uploaded_at", nullable = false)
    private Instant uploadedAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "uploaded_by_user_id")
    private UUID uploadedByUserId;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "photo_tags", joinColumns = @JoinColumn(name = "photo_id"))
    @Column(name = "tag")
    @Builder.Default
    private Set<String> tags = new HashSet<>();

    @PrePersist
    protected void onCreate() {
        if (id == null) {
            id = UUID.randomUUID();
        }
        if (uploadedAt == null) {
            uploadedAt = Instant.now();
        }
        if (updatedAt == null) {
            updatedAt = Instant.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }
}
