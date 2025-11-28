package com.rapidphotoflow.controller;

import com.rapidphotoflow.dto.SyncUserRequest;
import com.rapidphotoflow.dto.UpdateProfileRequest;
import com.rapidphotoflow.dto.UserDTO;
import com.rapidphotoflow.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Auth", description = "Authentication and user profile endpoints")
public class AuthController {

    private final UserService userService;

    @PostMapping("/auth/sync")
    @Operation(summary = "Sync user", description = "Creates or updates local user record after Cognito login/signup")
    public ResponseEntity<UserDTO> syncUser(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody SyncUserRequest request) {

        String cognitoSub = jwt.getSubject();
        log.info("Sync user request for cognitoSub: {}", cognitoSub);

        UserDTO user = userService.syncUser(cognitoSub, request);
        return ResponseEntity.ok(user);
    }

    @GetMapping("/users/me")
    @Operation(summary = "Get current user", description = "Get the current authenticated user's profile")
    public ResponseEntity<UserDTO> getCurrentUser(@AuthenticationPrincipal Jwt jwt) {
        String cognitoSub = jwt.getSubject();

        return userService.getUserByCognitoSub(cognitoSub)
            .map(user -> ResponseEntity.ok(userService.toDTO(user)))
            .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/users/me")
    @Operation(summary = "Update profile", description = "Update the current user's profile")
    public ResponseEntity<UserDTO> updateProfile(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody UpdateProfileRequest request) {

        String cognitoSub = jwt.getSubject();
        log.info("Update profile request for cognitoSub: {}", cognitoSub);

        try {
            UserDTO user = userService.updateProfile(cognitoSub, request);
            return ResponseEntity.ok(user);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
