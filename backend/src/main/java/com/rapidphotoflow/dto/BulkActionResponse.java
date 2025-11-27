package com.rapidphotoflow.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
@Builder
public class BulkActionResponse {
    private List<PhotoDTO> success;
    private Map<String, String> errors;
    private int successCount;
    private int errorCount;
}
