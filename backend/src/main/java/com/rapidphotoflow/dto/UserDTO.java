package com.rapidphotoflow.dto;

import com.rapidphotoflow.domain.UserRole;
import com.rapidphotoflow.domain.UserStatus;
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
public class UserDTO {

    private UUID id;
    private String email;
    private String username;
    private UserRole role;
    private UserStatus status;
    private Instant lastLoginAt;
    private Instant createdAt;
    private Boolean aiTaggingEnabled;
}
