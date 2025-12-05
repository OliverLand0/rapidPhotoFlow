package com.rapidphotoflow.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class SetCoverPhotoRequest {
    @NotNull(message = "Photo ID is required")
    private UUID photoId;
}
