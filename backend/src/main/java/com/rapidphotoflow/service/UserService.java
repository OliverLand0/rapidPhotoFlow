package com.rapidphotoflow.service;

import com.rapidphotoflow.dto.SyncUserRequest;
import com.rapidphotoflow.dto.UpdateProfileRequest;
import com.rapidphotoflow.dto.UserDTO;
import com.rapidphotoflow.entity.UserEntity;
import com.rapidphotoflow.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;

    /**
     * Get the current authenticated user's Cognito sub (subject) from the JWT.
     */
    public Optional<String> getCurrentCognitoSub() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof Jwt jwt) {
            return Optional.ofNullable(jwt.getSubject());
        }
        return Optional.empty();
    }

    /**
     * Get the current authenticated user from the database.
     */
    public Optional<UserEntity> getCurrentUser() {
        return getCurrentCognitoSub()
            .flatMap(userRepository::findByCognitoSub);
    }

    /**
     * Get user by ID.
     */
    public Optional<UserEntity> getUserById(UUID id) {
        return userRepository.findById(id);
    }

    /**
     * Get user by Cognito sub.
     */
    public Optional<UserEntity> getUserByCognitoSub(String cognitoSub) {
        return userRepository.findByCognitoSub(cognitoSub);
    }

    /**
     * Sync user from Cognito - creates or updates local user record.
     * Called after successful Cognito login/signup.
     */
    @Transactional
    public UserDTO syncUser(String cognitoSub, SyncUserRequest request) {
        log.info("Syncing user with cognitoSub: {}", cognitoSub);

        UserEntity user = userRepository.findByCognitoSub(cognitoSub)
            .map(existingUser -> {
                // Update existing user
                existingUser.setEmail(request.getEmail());
                existingUser.setUsername(request.getUsername());
                return existingUser;
            })
            .orElseGet(() -> {
                // Create new user
                return UserEntity.builder()
                    .cognitoSub(cognitoSub)
                    .email(request.getEmail())
                    .username(request.getUsername())
                    .build();
            });

        UserEntity savedUser = userRepository.save(user);
        log.info("User synced successfully: {}", savedUser.getId());

        return toDTO(savedUser);
    }

    /**
     * Update user profile.
     */
    @Transactional
    public UserDTO updateProfile(String cognitoSub, UpdateProfileRequest request) {
        UserEntity user = userRepository.findByCognitoSub(cognitoSub)
            .orElseThrow(() -> new IllegalStateException("User not found"));

        if (request.getUsername() != null && !request.getUsername().isBlank()) {
            // Check if username is already taken by another user
            userRepository.findByUsername(request.getUsername())
                .filter(u -> !u.getCognitoSub().equals(cognitoSub))
                .ifPresent(u -> {
                    throw new IllegalArgumentException("Username is already taken");
                });
            user.setUsername(request.getUsername());
        }

        UserEntity savedUser = userRepository.save(user);
        return toDTO(savedUser);
    }

    /**
     * Convert entity to DTO.
     */
    public UserDTO toDTO(UserEntity entity) {
        return UserDTO.builder()
            .id(entity.getId())
            .email(entity.getEmail())
            .username(entity.getUsername())
            .createdAt(entity.getCreatedAt())
            .build();
    }
}
