package com.rapidphotoflow.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

/**
 * Audit log for admin actions
 */
@Entity
@Table(name = "admin_audit_log", indexes = {
    @Index(name = "idx_audit_admin", columnList = "admin_user_id"),
    @Index(name = "idx_audit_target", columnList = "target_user_id"),
    @Index(name = "idx_audit_created", columnList = "created_at DESC")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminAuditLogEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "admin_user_id", nullable = false)
    private UUID adminUserId;

    @Column(name = "target_user_id")
    private UUID targetUserId;

    @Column(name = "action_type", nullable = false)
    private String actionType;

    @Column(name = "action_details", columnDefinition = "TEXT")
    private String actionDetails;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
}
