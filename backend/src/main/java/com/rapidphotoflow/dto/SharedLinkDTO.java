package com.rapidphotoflow.dto;

import com.rapidphotoflow.domain.SharedLink;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SharedLinkDTO {
    private UUID id;
    private String token;
    private String url;
    private String type;  // PHOTO, ALBUM, FOLDER
    private UUID targetId;
    private String targetName;
    private String targetThumbnailUrl;
    private boolean hasPassword;
    private Instant expiresAt;
    private boolean downloadAllowed;
    private boolean downloadOriginal;
    private Integer maxViews;
    private boolean requireEmail;
    @JsonProperty("isActive")
    private boolean isActive;
    @JsonProperty("isExpired")
    private boolean isExpired;
    @JsonProperty("isAccessible")
    private boolean isAccessible;
    private int viewCount;
    private int downloadCount;
    private Instant lastAccessedAt;
    private Instant createdAt;

    public static SharedLinkDTO fromDomain(SharedLink domain) {
        return fromDomain(domain, null);
    }

    public static SharedLinkDTO fromDomain(SharedLink domain, UUID thumbnailPhotoId) {
        String thumbnailUrl = null;
        // Use explicit thumbnail photo ID if provided, otherwise fall back to photoId for photo shares
        UUID effectivePhotoId = thumbnailPhotoId != null ? thumbnailPhotoId : domain.getPhotoId();
        if (effectivePhotoId != null) {
            thumbnailUrl = "/api/photos/" + effectivePhotoId + "/content";
        }

        return SharedLinkDTO.builder()
                .id(domain.getId())
                .token(domain.getToken())
                .url(domain.getUrl())
                .type(domain.getType().name())
                .targetId(domain.getTargetId())
                .targetName(domain.getTargetName())
                .targetThumbnailUrl(thumbnailUrl)
                .hasPassword(domain.isPasswordProtected())
                .expiresAt(domain.getExpiresAt())
                .downloadAllowed(domain.isDownloadAllowed())
                .downloadOriginal(domain.isDownloadOriginal())
                .maxViews(domain.getMaxViews())
                .requireEmail(domain.isRequireEmail())
                .isActive(domain.isActive())
                .isExpired(domain.isExpired())
                .isAccessible(domain.isAccessible())
                .viewCount(domain.getViewCount())
                .downloadCount(domain.getDownloadCount())
                .lastAccessedAt(domain.getLastAccessedAt())
                .createdAt(domain.getCreatedAt())
                .build();
    }
}
