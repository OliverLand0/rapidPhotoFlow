package com.rapidphotoflow.service;

import com.rapidphotoflow.dto.UserUsageStatsDTO;
import com.rapidphotoflow.repository.EventLogRepository;
import com.rapidphotoflow.repository.PhotoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service for calculating user usage statistics
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UserUsageStatsService {

    private final PhotoRepository photoRepository;
    private final EventLogRepository eventLogRepository;

    /**
     * Get usage stats for a single user
     */
    public UserUsageStatsDTO getUsageStatsForUser(UUID userId) {
        // Count photos
        long totalPhotos = photoRepository.countByUploadedByUserId(userId);

        // Calculate total storage
        Long totalStorage = photoRepository.sumSizeBytesByUploadedByUserId(userId);
        if (totalStorage == null) {
            totalStorage = 0L;
        }

        // Get last upload time
        Instant lastUpload = photoRepository.findLastUploadTimeByUserId(userId);

        // Count AI tagging usage (from events)
        long aiTaggingCount = eventLogRepository.countAutoTagEventsByUserId(userId);

        return UserUsageStatsDTO.builder()
                .totalPhotosUploaded(totalPhotos)
                .totalStorageBytes(totalStorage)
                .lastUploadAt(lastUpload)
                .aiTaggingUsageCount(aiTaggingCount)
                .build();
    }

    /**
     * Get usage stats for multiple users (batch)
     */
    public Map<UUID, UserUsageStatsDTO> getUsageStatsForUsers(List<UUID> userIds) {
        Map<UUID, UserUsageStatsDTO> statsMap = new HashMap<>();

        for (UUID userId : userIds) {
            statsMap.put(userId, getUsageStatsForUser(userId));
        }

        return statsMap;
    }
}
