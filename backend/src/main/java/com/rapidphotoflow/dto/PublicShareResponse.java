package com.rapidphotoflow.dto;

import com.rapidphotoflow.domain.SharedLink;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PublicShareResponse {
    private String type;  // PHOTO, ALBUM, FOLDER
    private String name;
    private Integer photoCount;  // For albums/folders
    private boolean requiresPassword;
    private boolean requiresEmail;
    private boolean downloadAllowed;
    private boolean downloadOriginal;
    private boolean isExpired;
    private boolean isDisabled;
    private boolean isAccessible;
    private String errorMessage;

    // Photo-specific fields
    private String photoUrl;
    private String thumbnailUrl;

    public static PublicShareResponse fromDomain(SharedLink domain) {
        String photoUrl = null;
        String thumbnailUrl = null;

        if (domain.getPhotoId() != null) {
            // These URLs will be served by PublicShareController
            photoUrl = "/s/" + domain.getToken() + "/photo";
            thumbnailUrl = "/s/" + domain.getToken() + "/thumbnail";
        }

        return PublicShareResponse.builder()
                .type(domain.getType().name())
                .name(domain.getTargetName())
                .requiresPassword(domain.isPasswordProtected())
                .requiresEmail(domain.isRequireEmail())
                .downloadAllowed(domain.isDownloadAllowed())
                .downloadOriginal(domain.isDownloadOriginal())
                .isExpired(domain.isExpired())
                .isDisabled(!domain.isActive())
                .isAccessible(domain.isAccessible())
                .photoUrl(photoUrl)
                .thumbnailUrl(thumbnailUrl)
                .build();
    }

    public static PublicShareResponse error(String message) {
        return PublicShareResponse.builder()
                .isAccessible(false)
                .errorMessage(message)
                .build();
    }

    public static PublicShareResponse expired() {
        return PublicShareResponse.builder()
                .isExpired(true)
                .isAccessible(false)
                .errorMessage("This share link has expired")
                .build();
    }

    public static PublicShareResponse disabled() {
        return PublicShareResponse.builder()
                .isDisabled(true)
                .isAccessible(false)
                .errorMessage("This share link has been disabled")
                .build();
    }

    public static PublicShareResponse notFound() {
        return PublicShareResponse.builder()
                .isAccessible(false)
                .errorMessage("Share link not found")
                .build();
    }
}
