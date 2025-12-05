package com.rapidphotoflow.service;

import com.rapidphotoflow.entity.UserEntity;
import com.rapidphotoflow.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;

import java.util.UUID;

/**
 * Production implementation of CurrentUserService that extracts user ID from JWT token.
 * Active when NOT running with local profile.
 */
@Service
@Profile("!local")
@RequiredArgsConstructor
public class JwtCurrentUserService implements CurrentUserService {

    private final UserRepository userRepository;

    @Override
    public UUID getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof Jwt jwt) {
            String cognitoSub = jwt.getSubject();
            return userRepository.findByCognitoSub(cognitoSub)
                    .map(UserEntity::getId)
                    .orElse(null);
        }
        return null;
    }
}
