package com.rapidphotoflow.dto;

import com.rapidphotoflow.domain.Album;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class AlbumDTO {
    private UUID id;
    private String name;
    private String description;
    private UUID coverPhotoId;
    private String coverPhotoUrl;
    private Instant createdAt;
    private Instant updatedAt;
    private int photoCount;

    public static AlbumDTO fromDomain(Album album) {
        return AlbumDTO.builder()
                .id(album.getId())
                .name(album.getName())
                .description(album.getDescription())
                .coverPhotoId(album.getCoverPhotoId())
                .coverPhotoUrl(album.getCoverPhotoUrl())
                .createdAt(album.getCreatedAt())
                .updatedAt(album.getUpdatedAt())
                .photoCount(album.getPhotoCount())
                .build();
    }
}
