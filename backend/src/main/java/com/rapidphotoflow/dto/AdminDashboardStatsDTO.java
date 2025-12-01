package com.rapidphotoflow.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminDashboardStatsDTO {

    private long totalUsers;
    private long activeUsers;
    private long suspendedUsers;
    private long totalPhotos;
    private long totalStorageBytes;
    private long photosUploadedToday;
    private long photosUploadedThisWeek;
    private long photosUploadedThisMonth;
}
