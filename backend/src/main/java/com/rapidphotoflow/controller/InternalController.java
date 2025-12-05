package com.rapidphotoflow.controller;

import com.rapidphotoflow.domain.Photo;
import com.rapidphotoflow.dto.AddTagRequest;
import com.rapidphotoflow.dto.PhotoDTO;
import com.rapidphotoflow.service.PhotoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * Internal API endpoints for service-to-service communication.
 * These endpoints do not require authentication and should only be
 * accessible from trusted internal services (e.g., AI tagging service).
 *
 * In production, these endpoints should be protected by network-level
 * security (e.g., VPC, security groups) rather than authentication.
 */
@RestController
@RequestMapping("/api/internal")
@RequiredArgsConstructor
@Tag(name = "Internal", description = "Internal service-to-service endpoints")
public class InternalController {

    private final PhotoService photoService;

    @PostMapping("/photos/{id}/tags")
    @Operation(summary = "Add tag to photo (internal)", description = "Add a tag to a photo - for internal service use only")
    public ResponseEntity<PhotoDTO> addTag(
            @PathVariable UUID id,
            @Valid @RequestBody AddTagRequest request) {
        try {
            Photo photo = photoService.addTag(id, request.getTag());
            return ResponseEntity.ok(PhotoDTO.fromEntity(photo));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
