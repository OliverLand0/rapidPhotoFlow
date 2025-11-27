package com.rapidphotoflow.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class BulkActionRequest {
    @NotEmpty
    private List<UUID> ids;

    @NotNull
    private String action;
}
