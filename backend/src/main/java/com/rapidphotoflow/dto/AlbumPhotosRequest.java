package com.rapidphotoflow.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class AlbumPhotosRequest {
    @NotEmpty(message = "At least one photo ID is required")
    private List<UUID> photoIds;
}
