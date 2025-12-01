package com.rapidphotoflow.service;

import com.rapidphotoflow.entity.AdminAuditLogEntity;
import com.rapidphotoflow.repository.AdminAuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Service for logging and retrieving admin audit actions
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AdminAuditService {

    private final AdminAuditLogRepository auditLogRepository;

    /**
     * Log an admin action
     */
    @Transactional
    public AdminAuditLogEntity logAction(UUID adminUserId, UUID targetUserId, String actionType, String details) {
        AdminAuditLogEntity entry = AdminAuditLogEntity.builder()
                .adminUserId(adminUserId)
                .targetUserId(targetUserId)
                .actionType(actionType)
                .actionDetails(details)
                .build();

        AdminAuditLogEntity saved = auditLogRepository.save(entry);
        log.info("Admin action logged: {} by admin {} on user {}", actionType, adminUserId, targetUserId);
        return saved;
    }

    /**
     * Get paginated audit log
     */
    public Page<AdminAuditLogEntity> getAuditLog(Pageable pageable) {
        return auditLogRepository.findAllByOrderByCreatedAtDesc(pageable);
    }

    /**
     * Get audit log filtered by admin user
     */
    public Page<AdminAuditLogEntity> getAuditLogByAdmin(UUID adminUserId, Pageable pageable) {
        return auditLogRepository.findByAdminUserIdOrderByCreatedAtDesc(adminUserId, pageable);
    }

    /**
     * Get audit log filtered by target user
     */
    public Page<AdminAuditLogEntity> getAuditLogByTargetUser(UUID targetUserId, Pageable pageable) {
        return auditLogRepository.findByTargetUserIdOrderByCreatedAtDesc(targetUserId, pageable);
    }

    /**
     * Get audit log filtered by action type
     */
    public Page<AdminAuditLogEntity> getAuditLogByActionType(String actionType, Pageable pageable) {
        return auditLogRepository.findByActionTypeOrderByCreatedAtDesc(actionType, pageable);
    }

    /**
     * Get audit log filtered by date range
     */
    public Page<AdminAuditLogEntity> getAuditLogByDateRange(Instant startDate, Instant endDate, Pageable pageable) {
        return auditLogRepository.findByCreatedAtBetweenOrderByCreatedAtDesc(startDate, endDate, pageable);
    }

    /**
     * Get activity log for a specific user
     */
    public List<AdminAuditLogEntity> getUserActivity(UUID userId) {
        return auditLogRepository.findByTargetUserIdOrderByCreatedAtDesc(userId);
    }
}
