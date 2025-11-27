package com.rapidphotoflow.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AddTagRequest {
    @NotBlank(message = "Tag is required")
    private String tag;
}
