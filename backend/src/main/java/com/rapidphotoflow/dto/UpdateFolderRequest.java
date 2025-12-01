package com.rapidphotoflow.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.UUID;

@Data
public class UpdateFolderRequest {
    @Size(max = 255, message = "Folder name cannot exceed 255 characters")
    private String name;

    private UUID parentId;
}
