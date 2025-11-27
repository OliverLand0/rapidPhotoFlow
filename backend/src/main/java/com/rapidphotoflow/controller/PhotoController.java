package com.rapidphotoflow.controller;

import com.rapidphotoflow.domain.Photo;
import com.rapidphotoflow.domain.PhotoStatus;
import com.rapidphotoflow.dto.ActionRequest;
import com.rapidphotoflow.dto.BulkActionRequest;
import com.rapidphotoflow.dto.BulkActionResponse;
import com.rapidphotoflow.dto.PhotoDTO;
import com.rapidphotoflow.dto.PhotoListResponse;
import com.rapidphotoflow.dto.StatusCountDTO;
import com.rapidphotoflow.service.PhotoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/photos")
@RequiredArgsConstructor
@Tag(name = "Photos", description = "Photo management endpoints")
public class PhotoController {

    private final PhotoService photoService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload photos", description = "Upload one or more photos for processing")
    public ResponseEntity<PhotoListResponse> uploadPhotos(
            @RequestParam("files") List<MultipartFile> files) {

        List<Photo> photos = photoService.uploadPhotos(files);
        List<PhotoDTO> dtos = photos.stream()
                .map(PhotoDTO::fromEntity)
                .collect(Collectors.toList());

        return ResponseEntity.ok(PhotoListResponse.of(dtos));
    }

    @GetMapping
    @Operation(summary = "Get all photos", description = "Retrieve all photos with optional status filter")
    public ResponseEntity<PhotoListResponse> getPhotos(
            @RequestParam(required = false) PhotoStatus status) {

        List<Photo> photos;
        if (status != null) {
            photos = photoService.getPhotosByStatus(status);
        } else {
            photos = photoService.getAllPhotos();
        }

        List<PhotoDTO> dtos = photos.stream()
                .map(PhotoDTO::fromEntity)
                .collect(Collectors.toList());

        return ResponseEntity.ok(PhotoListResponse.of(dtos));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get photo by ID", description = "Retrieve a specific photo by its ID")
    public ResponseEntity<PhotoDTO> getPhotoById(@PathVariable UUID id) {
        return photoService.getPhotoById(id)
                .map(PhotoDTO::fromEntity)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete photo", description = "Delete a photo by its ID")
    public ResponseEntity<Void> deletePhoto(@PathVariable UUID id) {
        try {
            photoService.delete(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/{id}/content")
    @Operation(summary = "Get photo content", description = "Retrieve the actual image content")
    public ResponseEntity<byte[]> getPhotoContent(@PathVariable UUID id) {
        return photoService.getPhotoById(id)
                .map(photo -> ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(photo.getMimeType()))
                        .body(photo.getContent()))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/action")
    @Operation(summary = "Perform action on photo", description = "Approve, reject, or retry a photo")
    public ResponseEntity<PhotoDTO> performAction(
            @PathVariable UUID id,
            @Valid @RequestBody ActionRequest request) {

        Photo photo;
        switch (request.getAction()) {
            case "approve":
                photo = photoService.approve(id);
                break;
            case "reject":
                photo = photoService.reject(id);
                break;
            case "retry":
                photo = photoService.retry(id);
                break;
            default:
                return ResponseEntity.badRequest().build();
        }

        return ResponseEntity.ok(PhotoDTO.fromEntity(photo));
    }

    @PostMapping("/bulk-action")
    @Operation(summary = "Perform bulk action on photos", description = "Approve, reject, or retry multiple photos")
    public ResponseEntity<BulkActionResponse> performBulkAction(
            @Valid @RequestBody BulkActionRequest request) {

        List<PhotoDTO> successPhotos = new ArrayList<>();
        Map<String, String> errors = new HashMap<>();

        for (UUID id : request.getIds()) {
            try {
                Photo photo;
                switch (request.getAction()) {
                    case "approve":
                        photo = photoService.approve(id);
                        break;
                    case "reject":
                        photo = photoService.reject(id);
                        break;
                    case "retry":
                        photo = photoService.retry(id);
                        break;
                    default:
                        errors.put(id.toString(), "Invalid action: " + request.getAction());
                        continue;
                }
                successPhotos.add(PhotoDTO.fromEntity(photo));
            } catch (Exception e) {
                errors.put(id.toString(), e.getMessage());
            }
        }

        return ResponseEntity.ok(BulkActionResponse.builder()
                .success(successPhotos)
                .errors(errors)
                .successCount(successPhotos.size())
                .errorCount(errors.size())
                .build());
    }

    @GetMapping("/counts")
    @Operation(summary = "Get status counts", description = "Get count of photos in each status")
    public ResponseEntity<List<StatusCountDTO>> getStatusCounts() {
        List<StatusCountDTO> counts = Arrays.stream(PhotoStatus.values())
                .map(status -> StatusCountDTO.builder()
                        .status(status)
                        .count(photoService.getPhotoCountByStatus(status))
                        .build())
                .collect(Collectors.toList());

        return ResponseEntity.ok(counts);
    }

    @DeleteMapping("/duplicates")
    @Operation(summary = "Remove duplicates", description = "Find and remove duplicate photos based on content hash")
    public ResponseEntity<PhotoListResponse> removeDuplicates() {
        List<Photo> removed = photoService.deleteDuplicates();
        List<PhotoDTO> dtos = removed.stream()
                .map(PhotoDTO::fromEntity)
                .collect(Collectors.toList());

        return ResponseEntity.ok(PhotoListResponse.of(dtos));
    }
}
