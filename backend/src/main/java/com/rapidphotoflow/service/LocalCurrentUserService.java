package com.rapidphotoflow.service;

import com.rapidphotoflow.entity.UserEntity;
import com.rapidphotoflow.repository.UserRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.UUID;

/**
 * Local development implementation of CurrentUserService.
 * Creates and returns a default test user for local development.
 * Active only when running with local profile.
 */
@Service
@Profile("local")
@RequiredArgsConstructor
@Slf4j
public class LocalCurrentUserService implements CurrentUserService {

    private static final String LOCAL_USER_COGNITO_SUB = "local-dev-user";
    private static final String LOCAL_USER_EMAIL = "localdev@example.com";
    private static final String LOCAL_USER_USERNAME = "localdev";

    private final UserRepository userRepository;
    private UUID localUserId;

    @PostConstruct
    public void init() {
        // Find or create the local development user
        UserEntity user = userRepository.findByCognitoSub(LOCAL_USER_COGNITO_SUB)
                .orElseGet(() -> {
                    log.info("Creating local development user");
                    UserEntity newUser = UserEntity.builder()
                            .id(UUID.randomUUID())
                            .cognitoSub(LOCAL_USER_COGNITO_SUB)
                            .email(LOCAL_USER_EMAIL)
                            .username(LOCAL_USER_USERNAME)
                            .createdAt(Instant.now())
                            .updatedAt(Instant.now())
                            .build();
                    return userRepository.save(newUser);
                });

        localUserId = user.getId();
        log.info("Local development user ID: {}", localUserId);
    }

    @Override
    public UUID getCurrentUserId() {
        return localUserId;
    }
}
