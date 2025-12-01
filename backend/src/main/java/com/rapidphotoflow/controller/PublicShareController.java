package com.rapidphotoflow.controller;

import com.rapidphotoflow.domain.SharedLink;
import com.rapidphotoflow.dto.PublicShareResponse;
import com.rapidphotoflow.dto.VerifyPasswordRequest;
import com.rapidphotoflow.service.PhotoService;
import com.rapidphotoflow.service.SharedLinkService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

/**
 * Public controller for accessing shared content.
 * These endpoints do not require authentication.
 */
@RestController
@RequestMapping("/s")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Public Shares", description = "Public share access endpoints (no auth required)")
public class PublicShareController {

    private final SharedLinkService sharedLinkService;
    private final PhotoService photoService;

    @GetMapping("/{token}")
    @Operation(summary = "Get share info", description = "Get information about a shared link")
    public ResponseEntity<PublicShareResponse> getShareInfo(@PathVariable String token) {
        Optional<SharedLink> shareOpt = sharedLinkService.getShareByToken(token);

        if (shareOpt.isEmpty()) {
            return ResponseEntity.ok(PublicShareResponse.notFound());
        }

        SharedLink share = shareOpt.get();

        // Check if link is accessible
        if (!share.isActive()) {
            return ResponseEntity.ok(PublicShareResponse.disabled());
        }
        if (share.isExpired()) {
            return ResponseEntity.ok(PublicShareResponse.expired());
        }
        if (share.hasReachedMaxViews()) {
            return ResponseEntity.ok(PublicShareResponse.error("This share link has reached its maximum views"));
        }

        return ResponseEntity.ok(PublicShareResponse.fromDomain(share));
    }

    @PostMapping("/{token}/verify")
    @Operation(summary = "Verify password", description = "Verify password for a protected share")
    public ResponseEntity<Map<String, Object>> verifyPassword(
            @PathVariable String token,
            @Valid @RequestBody VerifyPasswordRequest request) {

        Optional<SharedLink> shareOpt = sharedLinkService.getShareByToken(token);

        if (shareOpt.isEmpty()) {
            return ResponseEntity.ok(Map.of("valid", false, "error", "Share not found"));
        }

        SharedLink share = shareOpt.get();

        if (!share.isAccessible()) {
            return ResponseEntity.ok(Map.of("valid", false, "error", "Share link is not accessible"));
        }

        boolean valid = sharedLinkService.verifyPassword(token, request.getPassword());
        if (valid) {
            // Record view on successful password verification
            sharedLinkService.recordView(token);
            return ResponseEntity.ok(Map.of("valid", true));
        } else {
            return ResponseEntity.ok(Map.of("valid", false, "error", "Invalid password"));
        }
    }

    @GetMapping("/{token}/photo")
    @Operation(summary = "Get shared photo", description = "Get the photo content for a share")
    public ResponseEntity<byte[]> getSharedPhoto(@PathVariable String token) {
        Optional<SharedLink> shareOpt = sharedLinkService.getShareByToken(token);

        if (shareOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        SharedLink share = shareOpt.get();

        // Check accessibility
        if (!share.isAccessible()) {
            return ResponseEntity.status(403).build();
        }

        // Check if password protected (client should verify first)
        if (share.isPasswordProtected()) {
            // In production, implement session-based verification
            // For MVP, we'll allow access after password verification is done client-side
        }

        // Get photo content
        if (share.getPhotoId() == null) {
            return ResponseEntity.badRequest().build();
        }

        return photoService.getPhotoById(share.getPhotoId())
                .map(photo -> {
                    byte[] content = photoService.getPhotoContent(share.getPhotoId());
                    if (content == null) {
                        return ResponseEntity.notFound().<byte[]>build();
                    }

                    // Record view (only if not password protected, as that's recorded on verify)
                    if (!share.isPasswordProtected()) {
                        sharedLinkService.recordView(token);
                    }

                    return ResponseEntity.ok()
                            .contentType(MediaType.parseMediaType(photo.getMimeType()))
                            .body(content);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{token}/thumbnail")
    @Operation(summary = "Get shared photo thumbnail", description = "Get the thumbnail for a shared photo")
    public ResponseEntity<byte[]> getSharedThumbnail(@PathVariable String token) {
        Optional<SharedLink> shareOpt = sharedLinkService.getShareByToken(token);

        if (shareOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        SharedLink share = shareOpt.get();

        // Thumbnails can be shown even if link is expired (for preview purposes)
        if (share.getPhotoId() == null) {
            return ResponseEntity.badRequest().build();
        }

        return photoService.getPhotoById(share.getPhotoId())
                .map(photo -> {
                    byte[] content = photoService.getPhotoContent(share.getPhotoId());
                    if (content == null) {
                        return ResponseEntity.notFound().<byte[]>build();
                    }

                    // Return full image for now (thumbnail generation can be added later)
                    return ResponseEntity.ok()
                            .contentType(MediaType.parseMediaType(photo.getMimeType()))
                            .body(content);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{token}/download")
    @Operation(summary = "Download shared photo", description = "Download the shared photo (if download is allowed)")
    public ResponseEntity<byte[]> downloadSharedPhoto(@PathVariable String token) {
        Optional<SharedLink> shareOpt = sharedLinkService.getShareByToken(token);

        if (shareOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        SharedLink share = shareOpt.get();

        // Check accessibility
        if (!share.isAccessible()) {
            return ResponseEntity.status(403).build();
        }

        // Check if download is allowed
        if (!share.isDownloadAllowed()) {
            return ResponseEntity.status(403).build();
        }

        // Get photo content
        if (share.getPhotoId() == null) {
            return ResponseEntity.badRequest().build();
        }

        return photoService.getPhotoById(share.getPhotoId())
                .map(photo -> {
                    byte[] content = photoService.getPhotoContent(share.getPhotoId());
                    if (content == null) {
                        return ResponseEntity.notFound().<byte[]>build();
                    }

                    // Record download
                    sharedLinkService.recordDownload(token);

                    return ResponseEntity.ok()
                            .contentType(MediaType.APPLICATION_OCTET_STREAM)
                            .header("Content-Disposition", "attachment; filename=\"" + photo.getFilename() + "\"")
                            .body(content);
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
