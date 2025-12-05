package com.rapidphotoflow.controller;

import com.rapidphotoflow.domain.Album;
import com.rapidphotoflow.domain.Photo;
import com.rapidphotoflow.dto.*;
import com.rapidphotoflow.service.AlbumService;
import com.rapidphotoflow.service.PhotoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/albums")
@RequiredArgsConstructor
@Tag(name = "Albums", description = "Album management endpoints")
public class AlbumController {

    private final AlbumService albumService;
    private final PhotoService photoService;

    @GetMapping
    @Operation(summary = "Get all albums", description = "Get all albums for current user")
    public ResponseEntity<AlbumListResponse> getAlbums() {
        List<Album> albums = albumService.getAlbums();
        List<AlbumDTO> dtos = albums.stream()
                .map(AlbumDTO::fromDomain)
                .collect(Collectors.toList());
        return ResponseEntity.ok(AlbumListResponse.of(dtos));
    }

    @PostMapping
    @Operation(summary = "Create album", description = "Create a new album")
    public ResponseEntity<AlbumDTO> createAlbum(@Valid @RequestBody CreateAlbumRequest request) {
        try {
            Album album = albumService.createAlbum(request.getName(), request.getDescription());
            return ResponseEntity.ok(AlbumDTO.fromDomain(album));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.status(401).build();
        }
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get album by ID", description = "Get a specific album by its ID")
    public ResponseEntity<AlbumDTO> getAlbumById(@PathVariable UUID id) {
        return albumService.getAlbumById(id)
                .map(AlbumDTO::fromDomain)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update album", description = "Update album name, description, or cover photo")
    public ResponseEntity<AlbumDTO> updateAlbum(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateAlbumRequest request) {
        try {
            Album album = albumService.updateAlbum(
                    id,
                    request.getName(),
                    request.getDescription(),
                    request.getCoverPhotoId()
            );
            return ResponseEntity.ok(AlbumDTO.fromDomain(album));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.status(401).build();
        }
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete album", description = "Delete an album (photos remain in their folders)")
    public ResponseEntity<Void> deleteAlbum(@PathVariable UUID id) {
        try {
            albumService.deleteAlbum(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.status(401).build();
        }
    }

    @GetMapping("/{id}/photos")
    @Operation(summary = "Get photos in album", description = "Get all photos in the album")
    public ResponseEntity<PhotoListResponse> getPhotosInAlbum(@PathVariable UUID id) {
        try {
            List<UUID> photoIds = albumService.getPhotoIdsInAlbum(id);
            List<Photo> photos = photoService.getPhotosByIds(photoIds);
            List<PhotoDTO> dtos = photos.stream()
                    .map(PhotoDTO::fromEntity)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(PhotoListResponse.of(dtos));
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/{id}/photos")
    @Operation(summary = "Add photos to album", description = "Add photos to the album")
    public ResponseEntity<Void> addPhotosToAlbum(
            @PathVariable UUID id,
            @Valid @RequestBody AlbumPhotosRequest request) {
        try {
            albumService.addPhotosToAlbum(id, request.getPhotoIds());
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.status(401).build();
        }
    }

    @DeleteMapping("/{id}/photos")
    @Operation(summary = "Remove photos from album", description = "Remove photos from the album")
    public ResponseEntity<Void> removePhotosFromAlbum(
            @PathVariable UUID id,
            @Valid @RequestBody AlbumPhotosRequest request) {
        try {
            albumService.removePhotosFromAlbum(id, request.getPhotoIds());
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.status(401).build();
        }
    }

    @PutMapping("/{id}/cover")
    @Operation(summary = "Set cover photo", description = "Set the cover photo for the album")
    public ResponseEntity<AlbumDTO> setCoverPhoto(
            @PathVariable UUID id,
            @RequestBody SetCoverPhotoRequest request) {
        try {
            albumService.setCoverPhoto(id, request.getPhotoId());
            return albumService.getAlbumById(id)
                    .map(AlbumDTO::fromDomain)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.status(401).build();
        }
    }
}
