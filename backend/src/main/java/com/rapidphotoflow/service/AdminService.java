package com.rapidphotoflow.service;

import com.rapidphotoflow.domain.UserRole;
import com.rapidphotoflow.domain.UserStatus;
import com.rapidphotoflow.dto.*;
import com.rapidphotoflow.entity.AdminAuditLogEntity;
import com.rapidphotoflow.entity.UserEntity;
import com.rapidphotoflow.repository.PhotoRepository;
import com.rapidphotoflow.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service for admin operations
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AdminService {

    private final UserRepository userRepository;
    private final PhotoRepository photoRepository;
    private final UserService userService;
    private final UserUsageStatsService usageStatsService;
    private final AdminAuditService auditService;

    /**
     * Get dashboard statistics
     */
    public AdminDashboardStatsDTO getDashboardStats() {
        long totalUsers = userRepository.count();
        long activeUsers = userRepository.countByStatus(UserStatus.ACTIVE);
        long suspendedUsers = userRepository.countByStatus(UserStatus.SUSPENDED);
        long totalPhotos = photoRepository.count();
        long totalStorageBytes = photoRepository.sumAllSizeBytes();

        Instant now = Instant.now();
        Instant startOfToday = now.truncatedTo(ChronoUnit.DAYS);
        Instant startOfWeek = now.minus(7, ChronoUnit.DAYS);
        Instant startOfMonth = now.minus(30, ChronoUnit.DAYS);

        long photosToday = photoRepository.countByUploadedAtAfter(startOfToday);
        long photosThisWeek = photoRepository.countByUploadedAtAfter(startOfWeek);
        long photosThisMonth = photoRepository.countByUploadedAtAfter(startOfMonth);

        return AdminDashboardStatsDTO.builder()
                .totalUsers(totalUsers)
                .activeUsers(activeUsers)
                .suspendedUsers(suspendedUsers)
                .totalPhotos(totalPhotos)
                .totalStorageBytes(totalStorageBytes)
                .photosUploadedToday(photosToday)
                .photosUploadedThisWeek(photosThisWeek)
                .photosUploadedThisMonth(photosThisMonth)
                .build();
    }

    /**
     * Get all users for admin list
     */
    public AdminUserListResponse getAllUsers() {
        List<UserEntity> users = userRepository.findAllByOrderByCreatedAtDesc();
        List<UserDTO> userDTOs = users.stream()
                .map(userService::toDTO)
                .collect(Collectors.toList());

        return AdminUserListResponse.builder()
                .users(userDTOs)
                .totalCount(userDTOs.size())
                .build();
    }

    /**
     * Get detailed user information including usage stats
     */
    public AdminUserDetailDTO getUserDetail(UUID userId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        UserUsageStatsDTO usageStats = usageStatsService.getUsageStatsForUser(userId);

        return AdminUserDetailDTO.builder()
                .id(user.getId())
                .email(user.getEmail())
                .username(user.getUsername())
                .role(user.getRole())
                .status(user.getStatus())
                .lastLoginAt(user.getLastLoginAt())
                .createdAt(user.getCreatedAt())
                .maxStorageBytes(user.getMaxStorageBytes())
                .maxPhotos(user.getMaxPhotos())
                .aiTaggingEnabled(user.getAiTaggingEnabled())
                .accountNotes(user.getAccountNotes())
                .usageStats(usageStats)
                .build();
    }

    /**
     * Update user settings (admin action)
     */
    @Transactional
    public AdminUserDetailDTO updateUserSettings(UUID adminUserId, UUID userId, UpdateUserSettingsRequest request) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        StringBuilder changes = new StringBuilder();

        if (request.getRole() != null && request.getRole() != user.getRole()) {
            // Prevent demoting last admin
            if (user.getRole() == UserRole.ADMIN && request.getRole() == UserRole.USER) {
                long adminCount = userRepository.findAll().stream()
                        .filter(u -> u.getRole() == UserRole.ADMIN)
                        .count();
                if (adminCount <= 1) {
                    throw new IllegalArgumentException("Cannot demote the last admin");
                }
            }
            changes.append("role: ").append(user.getRole()).append(" -> ").append(request.getRole()).append("; ");
            user.setRole(request.getRole());
        }

        if (request.getStatus() != null && request.getStatus() != user.getStatus()) {
            changes.append("status: ").append(user.getStatus()).append(" -> ").append(request.getStatus()).append("; ");
            user.setStatus(request.getStatus());
        }

        if (request.getMaxStorageBytes() != null) {
            changes.append("maxStorageBytes: ").append(user.getMaxStorageBytes()).append(" -> ").append(request.getMaxStorageBytes()).append("; ");
            user.setMaxStorageBytes(request.getMaxStorageBytes());
        }

        if (request.getMaxPhotos() != null) {
            changes.append("maxPhotos: ").append(user.getMaxPhotos()).append(" -> ").append(request.getMaxPhotos()).append("; ");
            user.setMaxPhotos(request.getMaxPhotos());
        }

        if (request.getAiTaggingEnabled() != null) {
            changes.append("aiTaggingEnabled: ").append(user.getAiTaggingEnabled()).append(" -> ").append(request.getAiTaggingEnabled()).append("; ");
            user.setAiTaggingEnabled(request.getAiTaggingEnabled());
        }

        if (request.getAccountNotes() != null) {
            changes.append("accountNotes updated; ");
            user.setAccountNotes(request.getAccountNotes());
        }

        userRepository.save(user);

        // Log admin action
        if (changes.length() > 0) {
            auditService.logAction(adminUserId, userId, "UPDATE_USER_SETTINGS", changes.toString());
        }

        log.info("Admin {} updated user {} settings: {}", adminUserId, userId, changes);

        return getUserDetail(userId);
    }

    /**
     * Suspend a user
     */
    @Transactional
    public AdminUserDetailDTO suspendUser(UUID adminUserId, UUID userId, String reason) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        if (user.getId().equals(adminUserId)) {
            throw new IllegalArgumentException("Cannot suspend yourself");
        }

        user.setStatus(UserStatus.SUSPENDED);
        userRepository.save(user);

        auditService.logAction(adminUserId, userId, "SUSPEND_USER", reason != null ? reason : "No reason provided");
        log.info("Admin {} suspended user {}: {}", adminUserId, userId, reason);

        return getUserDetail(userId);
    }

    /**
     * Reactivate a suspended user
     */
    @Transactional
    public AdminUserDetailDTO reactivateUser(UUID adminUserId, UUID userId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        user.setStatus(UserStatus.ACTIVE);
        userRepository.save(user);

        auditService.logAction(adminUserId, userId, "REACTIVATE_USER", "User reactivated");
        log.info("Admin {} reactivated user {}", adminUserId, userId);

        return getUserDetail(userId);
    }

    /**
     * Get audit log with pagination
     */
    public AdminAuditLogListResponse getAuditLog(Pageable pageable) {
        Page<AdminAuditLogEntity> page = auditService.getAuditLog(pageable);
        List<AdminAuditLogDTO> logs = page.getContent().stream()
                .map(this::toAuditLogDTO)
                .collect(Collectors.toList());

        return AdminAuditLogListResponse.builder()
                .logs(logs)
                .totalCount(page.getTotalElements())
                .build();
    }

    /**
     * Get audit log for a specific user
     */
    public List<AdminAuditLogDTO> getUserAuditLog(UUID userId) {
        return auditService.getUserActivity(userId).stream()
                .map(this::toAuditLogDTO)
                .collect(Collectors.toList());
    }

    /**
     * Convert audit log entity to DTO
     */
    private AdminAuditLogDTO toAuditLogDTO(AdminAuditLogEntity entity) {
        // Get admin and target user emails for display
        String adminEmail = userRepository.findById(entity.getAdminUserId())
                .map(UserEntity::getEmail)
                .orElse("Unknown");

        String targetEmail = entity.getTargetUserId() != null
                ? userRepository.findById(entity.getTargetUserId())
                        .map(UserEntity::getEmail)
                        .orElse("Unknown")
                : null;

        return AdminAuditLogDTO.builder()
                .id(entity.getId())
                .adminUserId(entity.getAdminUserId())
                .adminEmail(adminEmail)
                .targetUserId(entity.getTargetUserId())
                .targetUserEmail(targetEmail)
                .actionType(entity.getActionType())
                .description(entity.getActionDetails())
                .timestamp(entity.getCreatedAt())
                .build();
    }
}
