package com.rapidphotoflow.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "album_photos")
@IdClass(AlbumPhotoId.class)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AlbumPhotoEntity {

    @Id
    @Column(name = "album_id", nullable = false)
    private UUID albumId;

    @Id
    @Column(name = "photo_id", nullable = false)
    private UUID photoId;

    @Column(name = "added_at", nullable = false)
    private Instant addedAt;

    @PrePersist
    protected void onCreate() {
        if (addedAt == null) {
            addedAt = Instant.now();
        }
    }
}
