package com.rapidphotoflow.service;

import com.rapidphotoflow.domain.Album;
import com.rapidphotoflow.domain.EventType;
import com.rapidphotoflow.entity.AlbumEntity;
import com.rapidphotoflow.entity.AlbumPhotoEntity;
import com.rapidphotoflow.entity.PhotoEntity;
import com.rapidphotoflow.repository.AlbumPhotoRepository;
import com.rapidphotoflow.repository.AlbumRepository;
import com.rapidphotoflow.repository.PhotoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AlbumService {

    private final AlbumRepository albumRepository;
    private final AlbumPhotoRepository albumPhotoRepository;
    private final PhotoRepository photoRepository;
    private final CurrentUserService currentUserService;
    private final EventService eventService;

    @Transactional
    public Album createAlbum(String name, String description) {
        UUID userId = getCurrentUserId();
        if (userId == null) {
            throw new IllegalStateException("User not authenticated");
        }

        // Check for duplicate name
        if (albumRepository.existsByNameAndUserId(name.trim(), userId)) {
            throw new IllegalArgumentException("An album with this name already exists");
        }

        Album album = Album.create(name, description, userId);

        AlbumEntity entity = AlbumEntity.builder()
                .id(album.getId())
                .name(album.getName())
                .description(album.getDescription())
                .userId(album.getUserId())
                .createdAt(album.getCreatedAt())
                .updatedAt(album.getUpdatedAt())
                .build();

        albumRepository.save(entity);
        log.info("Album created: {} ({})", album.getName(), album.getId());

        return entityToAlbum(entity, 0);
    }

    @Transactional
    public Album updateAlbum(UUID albumId, String name, String description, UUID coverPhotoId) {
        UUID userId = getCurrentUserId();
        if (userId == null) {
            throw new IllegalStateException("User not authenticated");
        }

        AlbumEntity entity = albumRepository.findByIdAndUserId(albumId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Album not found"));

        if (name != null && !name.isBlank()) {
            String trimmedName = name.trim();
            // Check for duplicate name (excluding current album)
            Optional<AlbumEntity> existing = albumRepository.findByNameAndUserId(trimmedName, userId);
            if (existing.isPresent() && !existing.get().getId().equals(albumId)) {
                throw new IllegalArgumentException("An album with this name already exists");
            }
            entity.setName(trimmedName);
        }

        if (description != null) {
            entity.setDescription(description.trim());
        }

        if (coverPhotoId != null) {
            // Verify photo exists and is in album
            if (!albumPhotoRepository.existsByAlbumIdAndPhotoId(albumId, coverPhotoId)) {
                throw new IllegalArgumentException("Cover photo must be in the album");
            }
            entity.setCoverPhotoId(coverPhotoId);
        }

        entity.setUpdatedAt(Instant.now());
        albumRepository.save(entity);

        long photoCount = albumPhotoRepository.countByAlbumId(albumId);
        log.info("Album updated: {} ({})", entity.getName(), albumId);

        return entityToAlbum(entity, (int) photoCount);
    }

    @Transactional
    public void deleteAlbum(UUID albumId) {
        UUID userId = getCurrentUserId();
        if (userId == null) {
            throw new IllegalStateException("User not authenticated");
        }

        AlbumEntity entity = albumRepository.findByIdAndUserId(albumId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Album not found"));

        // Delete all album-photo associations
        albumPhotoRepository.deleteByAlbumId(albumId);

        albumRepository.delete(entity);
        log.info("Album deleted: {} ({})", entity.getName(), albumId);
    }

    public Optional<Album> getAlbumById(UUID albumId) {
        UUID userId = getCurrentUserId();
        if (userId == null) {
            return Optional.empty();
        }

        return albumRepository.findByIdAndUserId(albumId, userId)
                .map(entity -> {
                    long photoCount = albumPhotoRepository.countByAlbumId(albumId);
                    return entityToAlbum(entity, (int) photoCount);
                });
    }

    public List<Album> getAlbums() {
        UUID userId = getCurrentUserId();
        if (userId == null) {
            return Collections.emptyList();
        }

        List<AlbumEntity> entities = albumRepository.findByUserIdOrderByNameAsc(userId);

        return entities.stream()
                .map(entity -> {
                    long photoCount = albumPhotoRepository.countByAlbumId(entity.getId());
                    return entityToAlbum(entity, (int) photoCount);
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public void addPhotosToAlbum(UUID albumId, List<UUID> photoIds) {
        UUID userId = getCurrentUserId();
        if (userId == null) {
            throw new IllegalStateException("User not authenticated");
        }

        AlbumEntity album = albumRepository.findByIdAndUserId(albumId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Album not found"));

        int addedCount = 0;
        for (UUID photoId : photoIds) {
            // Verify photo exists and belongs to user
            PhotoEntity photo = photoRepository.findById(photoId)
                    .orElse(null);

            if (photo != null && userId.equals(photo.getUploadedByUserId())) {
                // Check if already in album
                if (!albumPhotoRepository.existsByAlbumIdAndPhotoId(albumId, photoId)) {
                    AlbumPhotoEntity albumPhoto = AlbumPhotoEntity.builder()
                            .albumId(albumId)
                            .photoId(photoId)
                            .addedAt(Instant.now())
                            .build();
                    albumPhotoRepository.save(albumPhoto);

                    eventService.logEvent(photoId, EventType.PHOTO_ADDED_TO_ALBUM,
                            "Photo added to album: " + album.getName());
                    addedCount++;
                }
            }
        }

        // Update album timestamp
        album.setUpdatedAt(Instant.now());
        albumRepository.save(album);

        log.info("Added {} photos to album {} ({})", addedCount, album.getName(), albumId);
    }

    @Transactional
    public void removePhotosFromAlbum(UUID albumId, List<UUID> photoIds) {
        UUID userId = getCurrentUserId();
        if (userId == null) {
            throw new IllegalStateException("User not authenticated");
        }

        AlbumEntity album = albumRepository.findByIdAndUserId(albumId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Album not found"));

        int removedCount = 0;
        for (UUID photoId : photoIds) {
            if (albumPhotoRepository.existsByAlbumIdAndPhotoId(albumId, photoId)) {
                albumPhotoRepository.deleteByAlbumIdAndPhotoId(albumId, photoId);

                eventService.logEvent(photoId, EventType.PHOTO_REMOVED_FROM_ALBUM,
                        "Photo removed from album: " + album.getName());
                removedCount++;

                // If removed photo was the cover, clear the cover
                if (photoId.equals(album.getCoverPhotoId())) {
                    album.setCoverPhotoId(null);
                }
            }
        }

        // Update album timestamp
        album.setUpdatedAt(Instant.now());
        albumRepository.save(album);

        log.info("Removed {} photos from album {} ({})", removedCount, album.getName(), albumId);
    }

    @Transactional
    public void setCoverPhoto(UUID albumId, UUID photoId) {
        UUID userId = getCurrentUserId();
        if (userId == null) {
            throw new IllegalStateException("User not authenticated");
        }

        AlbumEntity album = albumRepository.findByIdAndUserId(albumId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Album not found"));

        // Verify photo is in album
        if (!albumPhotoRepository.existsByAlbumIdAndPhotoId(albumId, photoId)) {
            throw new IllegalArgumentException("Photo must be in the album to set as cover");
        }

        album.setCoverPhotoId(photoId);
        album.setUpdatedAt(Instant.now());
        albumRepository.save(album);

        log.info("Set cover photo for album {} to {}", albumId, photoId);
    }

    public List<UUID> getPhotoIdsInAlbum(UUID albumId) {
        UUID userId = getCurrentUserId();
        if (userId == null) {
            return Collections.emptyList();
        }

        // Verify album belongs to user
        if (!albumRepository.findByIdAndUserId(albumId, userId).isPresent()) {
            return Collections.emptyList();
        }

        return albumPhotoRepository.findPhotoIdsByAlbumId(albumId);
    }

    public List<UUID> getAlbumIdsForPhoto(UUID photoId) {
        return albumPhotoRepository.findAlbumIdsByPhotoId(photoId);
    }

    private UUID getCurrentUserId() {
        return currentUserService.getCurrentUserId();
    }

    private Album entityToAlbum(AlbumEntity entity, int photoCount) {
        String coverPhotoUrl = null;
        if (entity.getCoverPhotoId() != null) {
            coverPhotoUrl = "/api/photos/" + entity.getCoverPhotoId() + "/content";
        }

        return Album.builder()
                .id(entity.getId())
                .name(entity.getName())
                .description(entity.getDescription())
                .coverPhotoId(entity.getCoverPhotoId())
                .coverPhotoUrl(coverPhotoUrl)
                .userId(entity.getUserId())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .photoCount(photoCount)
                .build();
    }
}
