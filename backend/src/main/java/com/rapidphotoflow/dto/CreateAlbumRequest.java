package com.rapidphotoflow.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateAlbumRequest {
    @NotBlank(message = "Album name is required")
    @Size(max = 255, message = "Album name cannot exceed 255 characters")
    private String name;

    private String description;
}
