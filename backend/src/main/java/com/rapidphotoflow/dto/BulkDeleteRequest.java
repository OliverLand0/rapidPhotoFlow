package com.rapidphotoflow.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class BulkDeleteRequest {
    @NotEmpty
    private List<UUID> ids;
}
