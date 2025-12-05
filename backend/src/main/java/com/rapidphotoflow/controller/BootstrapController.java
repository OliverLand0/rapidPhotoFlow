package com.rapidphotoflow.controller;

import com.rapidphotoflow.domain.UserRole;
import com.rapidphotoflow.dto.UserDTO;
import com.rapidphotoflow.entity.UserEntity;
import com.rapidphotoflow.repository.UserRepository;
import com.rapidphotoflow.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/**
 * Bootstrap controller for initial admin setup.
 * Only works when no admin exists in the database.
 */
@RestController
@RequestMapping("/api/bootstrap")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Bootstrap", description = "Initial setup endpoints")
public class BootstrapController {

    private final UserRepository userRepository;
    private final UserService userService;

    @PostMapping("/admin")
    @Operation(summary = "Bootstrap first admin",
               description = "Promotes the current user to admin. Only works if no admin exists.")
    @Transactional
    public ResponseEntity<UserDTO> bootstrapAdmin() {
        // Check if any admin already exists
        boolean adminExists = userRepository.findAll().stream()
                .anyMatch(user -> user.getRole() == UserRole.ADMIN);

        if (adminExists) {
            log.warn("Bootstrap admin attempted but admin already exists");
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "An admin already exists. Bootstrap is no longer available.");
        }

        // Get current user from JWT
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof Jwt jwt)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                    "You must be logged in to bootstrap admin");
        }

        String cognitoSub = jwt.getSubject();
        String email = jwt.getClaimAsString("email");
        String usernameFromJwt = jwt.getClaimAsString("cognito:username");
        final String finalUsername = usernameFromJwt != null ? usernameFromJwt : email;

        log.info("Bootstrap admin request from cognitoSub: {}, email: {}", cognitoSub, email);

        // Find or create user
        UserEntity currentUser = userRepository.findByCognitoSub(cognitoSub)
                .orElseGet(() -> {
                    log.info("Creating new user during bootstrap: {}", email);
                    return UserEntity.builder()
                            .cognitoSub(cognitoSub)
                            .email(email)
                            .username(finalUsername)
                            .build();
                });

        // Promote to admin
        currentUser.setRole(UserRole.ADMIN);
        UserEntity savedUser = userRepository.save(currentUser);

        log.info("User {} ({}) has been promoted to ADMIN via bootstrap",
                savedUser.getEmail(), savedUser.getId());

        return ResponseEntity.ok(userService.toDTO(savedUser));
    }
}
