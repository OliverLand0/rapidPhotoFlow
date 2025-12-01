package com.rapidphotoflow.dto;

import com.rapidphotoflow.domain.SharedLink;
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
    private boolean isActive;
    private boolean isExpired;
    private boolean isAccessible;
    private int viewCount;
    private int downloadCount;
    private Instant lastAccessedAt;
    private Instant createdAt;

    public static SharedLinkDTO fromDomain(SharedLink domain) {
        String thumbnailUrl = null;
        if (domain.getPhotoId() != null) {
            thumbnailUrl = "/api/photos/" + domain.getPhotoId() + "/thumbnail";
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
