package com.rapidphotoflow.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.UUID;

@Data
public class CreateFolderRequest {
    @NotBlank(message = "Folder name is required")
    @Size(max = 255, message = "Folder name cannot exceed 255 characters")
    private String name;

    private UUID parentId;
}
