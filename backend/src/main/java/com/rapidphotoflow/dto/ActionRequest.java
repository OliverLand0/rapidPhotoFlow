package com.rapidphotoflow.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class ActionRequest {
    @NotNull(message = "Action is required")
    @Pattern(regexp = "approve|reject|retry", message = "Action must be 'approve', 'reject', or 'retry'")
    private String action;
}
