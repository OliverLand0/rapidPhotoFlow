package com.rapidphotoflow.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateShareRequest {
    private Boolean downloadAllowed;
    private Boolean downloadOriginal;
    private Integer maxViews;
    private Boolean requireEmail;
    private String expiresIn;  // "never", "1h", "24h", "7d", "30d"
    private Instant expiresAt;
    private Boolean isActive;

    public Instant resolveExpiresAt() {
        if (expiresAt != null) {
            return expiresAt;
        }
        if (expiresIn == null) {
            return null; // Don't change
        }
        if ("never".equalsIgnoreCase(expiresIn)) {
            return null;
        }

        return switch (expiresIn.toLowerCase()) {
            case "1h" -> Instant.now().plusSeconds(3600);
            case "24h" -> Instant.now().plusSeconds(86400);
            case "7d" -> Instant.now().plusSeconds(604800);
            case "30d" -> Instant.now().plusSeconds(2592000);
            default -> null;
        };
    }
}
