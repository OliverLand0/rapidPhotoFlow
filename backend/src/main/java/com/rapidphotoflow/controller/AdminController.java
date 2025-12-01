package com.rapidphotoflow.controller;

import com.rapidphotoflow.dto.*;
import com.rapidphotoflow.security.AdminOnly;
import com.rapidphotoflow.service.AdminService;
import com.rapidphotoflow.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Admin", description = "Admin management endpoints")
@AdminOnly
public class AdminController {

    private final AdminService adminService;
    private final UserService userService;

    @GetMapping("/dashboard")
    @Operation(summary = "Get admin dashboard statistics")
    public ResponseEntity<AdminDashboardStatsDTO> getDashboardStats() {
        log.info("Admin requesting dashboard stats");
        AdminDashboardStatsDTO stats = adminService.getDashboardStats();
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/users")
    @Operation(summary = "Get all users")
    public ResponseEntity<AdminUserListResponse> getAllUsers() {
        log.info("Admin requesting user list");
        AdminUserListResponse response = adminService.getAllUsers();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/users/{userId}")
    @Operation(summary = "Get detailed user information")
    public ResponseEntity<AdminUserDetailDTO> getUserDetail(@PathVariable UUID userId) {
        log.info("Admin requesting details for user: {}", userId);
        AdminUserDetailDTO detail = adminService.getUserDetail(userId);
        return ResponseEntity.ok(detail);
    }

    @PutMapping("/users/{userId}/settings")
    @Operation(summary = "Update user settings")
    public ResponseEntity<AdminUserDetailDTO> updateUserSettings(
            @PathVariable UUID userId,
            @RequestBody UpdateUserSettingsRequest request) {
        UUID adminUserId = userService.getCurrentUser()
                .orElseThrow(() -> new IllegalStateException("Admin user not found"))
                .getId();

        log.info("Admin {} updating settings for user: {}", adminUserId, userId);
        AdminUserDetailDTO detail = adminService.updateUserSettings(adminUserId, userId, request);
        return ResponseEntity.ok(detail);
    }

    @PostMapping("/users/{userId}/suspend")
    @Operation(summary = "Suspend a user")
    public ResponseEntity<AdminUserDetailDTO> suspendUser(
            @PathVariable UUID userId,
            @RequestBody(required = false) SuspendUserRequest request) {
        UUID adminUserId = userService.getCurrentUser()
                .orElseThrow(() -> new IllegalStateException("Admin user not found"))
                .getId();

        String reason = request != null ? request.getReason() : null;
        log.info("Admin {} suspending user: {} (reason: {})", adminUserId, userId, reason);
        AdminUserDetailDTO detail = adminService.suspendUser(adminUserId, userId, reason);
        return ResponseEntity.ok(detail);
    }

    @PostMapping("/users/{userId}/reactivate")
    @Operation(summary = "Reactivate a suspended user")
    public ResponseEntity<AdminUserDetailDTO> reactivateUser(@PathVariable UUID userId) {
        UUID adminUserId = userService.getCurrentUser()
                .orElseThrow(() -> new IllegalStateException("Admin user not found"))
                .getId();

        log.info("Admin {} reactivating user: {}", adminUserId, userId);
        AdminUserDetailDTO detail = adminService.reactivateUser(adminUserId, userId);
        return ResponseEntity.ok(detail);
    }

    @GetMapping("/audit-log")
    @Operation(summary = "Get admin audit log")
    public ResponseEntity<AdminAuditLogListResponse> getAuditLog(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        log.info("Admin requesting audit log, page: {}, size: {}", page, size);
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        AdminAuditLogListResponse response = adminService.getAuditLog(pageable);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/users/{userId}/audit-log")
    @Operation(summary = "Get audit log for a specific user")
    public ResponseEntity<List<AdminAuditLogDTO>> getUserAuditLog(@PathVariable UUID userId) {
        log.info("Admin requesting audit log for user: {}", userId);
        List<AdminAuditLogDTO> logs = adminService.getUserAuditLog(userId);
        return ResponseEntity.ok(logs);
    }
}
