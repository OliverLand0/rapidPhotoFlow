package com.rapidphotoflow.repository;

import com.rapidphotoflow.entity.AdminAuditLogEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface AdminAuditLogRepository extends JpaRepository<AdminAuditLogEntity, UUID> {

    Page<AdminAuditLogEntity> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Page<AdminAuditLogEntity> findByAdminUserIdOrderByCreatedAtDesc(UUID adminUserId, Pageable pageable);

    Page<AdminAuditLogEntity> findByTargetUserIdOrderByCreatedAtDesc(UUID targetUserId, Pageable pageable);

    Page<AdminAuditLogEntity> findByActionTypeOrderByCreatedAtDesc(String actionType, Pageable pageable);

    Page<AdminAuditLogEntity> findByCreatedAtBetweenOrderByCreatedAtDesc(
            Instant startDate, Instant endDate, Pageable pageable);

    List<AdminAuditLogEntity> findByTargetUserIdOrderByCreatedAtDesc(UUID targetUserId);
}
