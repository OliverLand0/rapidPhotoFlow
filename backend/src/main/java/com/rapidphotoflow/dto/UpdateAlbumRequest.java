package com.rapidphotoflow.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.UUID;

@Data
public class UpdateAlbumRequest {
    @Size(max = 255, message = "Album name cannot exceed 255 characters")
    private String name;

    private String description;

    private UUID coverPhotoId;
}
