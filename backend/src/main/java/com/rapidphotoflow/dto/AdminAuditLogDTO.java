package com.rapidphotoflow.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminAuditLogDTO {

    private UUID id;
    private UUID adminUserId;
    private String adminEmail;
    private UUID targetUserId;
    private String targetUserEmail;
    private String actionType;
    private String description;
    private String previousValue;
    private String newValue;
    private Instant timestamp;
}
