package com.rapidphotoflow.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserUsageStatsDTO {

    private long totalPhotosUploaded;
    private long totalStorageBytes;
    private long aiTaggingUsageCount;
    private Instant lastUploadAt;
}
