package com.rapidphotoflow.controller;

import com.rapidphotoflow.domain.SharedLink;
import com.rapidphotoflow.dto.*;
import com.rapidphotoflow.service.SharedLinkService;
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
@RequestMapping("/api/shares")
@RequiredArgsConstructor
@Tag(name = "Shares", description = "Share link management endpoints")
public class SharedLinkController {

    private final SharedLinkService sharedLinkService;

    @GetMapping
    @Operation(summary = "Get all shares", description = "Get all share links for current user")
    public ResponseEntity<SharedLinkListResponse> getShares() {
        List<SharedLink> shares = sharedLinkService.getSharesByUser();
        List<SharedLinkDTO> dtos = shares.stream()
                .map(SharedLinkDTO::fromDomain)
                .collect(Collectors.toList());
        return ResponseEntity.ok(SharedLinkListResponse.of(dtos));
    }

    @PostMapping
    @Operation(summary = "Create share link", description = "Create a new share link for a photo")
    public ResponseEntity<SharedLinkDTO> createShare(@Valid @RequestBody CreateShareRequest request) {
        try {
            SharedLink share;
            if (hasCustomSettings(request)) {
                share = sharedLinkService.createShareWithSettings(
                        request.getPhotoId(),
                        request.getDownloadAllowed(),
                        request.getDownloadOriginal(),
                        request.getMaxViews(),
                        request.getRequireEmail(),
                        request.resolveExpiresAt(),
                        request.getPassword()
                );
            } else {
                share = sharedLinkService.createPhotoShare(request.getPhotoId());
            }
            return ResponseEntity.ok(SharedLinkDTO.fromDomain(share));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.status(401).build();
        }
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get share by ID", description = "Get a specific share link by its ID")
    public ResponseEntity<SharedLinkDTO> getShareById(@PathVariable UUID id) {
        return sharedLinkService.getShareById(id)
                .map(SharedLinkDTO::fromDomain)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update share", description = "Update share link settings")
    public ResponseEntity<SharedLinkDTO> updateShare(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateShareRequest request) {
        try {
            SharedLink share = sharedLinkService.updateShare(
                    id,
                    request.getDownloadAllowed(),
                    request.getDownloadOriginal(),
                    request.getMaxViews(),
                    request.getRequireEmail(),
                    request.resolveExpiresAt(),
                    request.getIsActive()
            );
            return ResponseEntity.ok(SharedLinkDTO.fromDomain(share));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.status(401).build();
        }
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete share", description = "Delete a share link")
    public ResponseEntity<Void> deleteShare(@PathVariable UUID id) {
        try {
            sharedLinkService.deleteShare(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.status(401).build();
        }
    }

    @PutMapping("/{id}/deactivate")
    @Operation(summary = "Deactivate share", description = "Deactivate a share link without deleting it")
    public ResponseEntity<Void> deactivateShare(@PathVariable UUID id) {
        try {
            sharedLinkService.deactivateShare(id);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.status(401).build();
        }
    }

    @PutMapping("/{id}/activate")
    @Operation(summary = "Activate share", description = "Reactivate a deactivated share link")
    public ResponseEntity<Void> activateShare(@PathVariable UUID id) {
        try {
            sharedLinkService.reactivateShare(id);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.status(401).build();
        }
    }

    @GetMapping("/photo/{photoId}")
    @Operation(summary = "Get shares for photo", description = "Get all share links for a specific photo")
    public ResponseEntity<SharedLinkListResponse> getSharesForPhoto(@PathVariable UUID photoId) {
        List<SharedLink> shares = sharedLinkService.getSharesForPhoto(photoId);
        List<SharedLinkDTO> dtos = shares.stream()
                .map(SharedLinkDTO::fromDomain)
                .collect(Collectors.toList());
        return ResponseEntity.ok(SharedLinkListResponse.of(dtos));
    }

    private boolean hasCustomSettings(CreateShareRequest request) {
        return request.getPassword() != null ||
               request.getDownloadAllowed() != null ||
               request.getDownloadOriginal() != null ||
               request.getMaxViews() != null ||
               request.getRequireEmail() != null ||
               request.getExpiresIn() != null ||
               request.getExpiresAt() != null;
    }
}
