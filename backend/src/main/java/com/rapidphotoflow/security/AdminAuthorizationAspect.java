package com.rapidphotoflow.security;

import com.rapidphotoflow.domain.UserRole;
import com.rapidphotoflow.entity.UserEntity;
import com.rapidphotoflow.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

/**
 * Aspect that enforces admin-only access by checking the user's role in the database.
 */
@Aspect
@Component
@RequiredArgsConstructor
@Slf4j
public class AdminAuthorizationAspect {

    private final UserRepository userRepository;

    @Around("@annotation(AdminOnly) || @within(AdminOnly)")
    public Object checkAdminAccess(ProceedingJoinPoint joinPoint) throws Throwable {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth == null || !auth.isAuthenticated()) {
            log.warn("Unauthorized access attempt to admin endpoint");
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }

        // Get Cognito sub from JWT
        String cognitoSub = null;
        if (auth.getPrincipal() instanceof Jwt jwt) {
            cognitoSub = jwt.getSubject();
        }

        if (cognitoSub == null) {
            log.warn("No cognito sub found in JWT for admin endpoint access");
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }

        // Check user role in database
        Optional<UserEntity> userOpt = userRepository.findByCognitoSub(cognitoSub);

        if (userOpt.isEmpty()) {
            log.warn("User not found in database: {}", cognitoSub);
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }

        UserEntity user = userOpt.get();
        if (user.getRole() != UserRole.ADMIN) {
            log.warn("Non-admin user {} attempted to access admin endpoint: {}",
                    user.getEmail(), joinPoint.getSignature().getName());
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin access required");
        }

        log.debug("Admin access granted for user: {}", user.getEmail());
        return joinPoint.proceed();
    }
}
