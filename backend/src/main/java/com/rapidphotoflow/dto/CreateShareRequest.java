package com.rapidphotoflow.dto;

import jakarta.validation.constraints.NotNull;
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
public class CreateShareRequest {
    @NotNull(message = "Photo ID is required")
    private UUID photoId;

    // Optional settings (all can be null for defaults)
    private String password;
    private Boolean downloadAllowed;
    private Boolean downloadOriginal;
    private Integer maxViews;
    private Boolean requireEmail;

    // Expiration options
    private String expiresIn;  // "never", "1h", "24h", "7d", "30d"
    private Instant expiresAt; // Or custom date

    public Instant resolveExpiresAt() {
        if (expiresAt != null) {
            return expiresAt;
        }
        if (expiresIn == null || "never".equalsIgnoreCase(expiresIn)) {
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
