package com.rapidphotoflow.service;

import org.springframework.stereotype.Service;

import java.security.SecureRandom;

/**
 * Service for generating secure tokens for shared links.
 * Uses SecureRandom to generate cryptographically secure random tokens.
 */
@Service
public class TokenService {

    private static final String BASE62_ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    private static final int BASE62_LENGTH = BASE62_ALPHABET.length();
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    /**
     * Generate a secure token with 128 bits of entropy.
     * Results in a 22-character base62 string.
     *
     * @return A cryptographically secure token
     */
    public String generateSecureToken() {
        return generateBase62Token(22); // 22 chars * ~5.95 bits/char ≈ 131 bits entropy
    }

    /**
     * Generate a shorter token (8 characters) for more memorable URLs.
     * Still provides ~47 bits of entropy (8 * 5.95 bits).
     *
     * @return A shorter but still secure token
     */
    public String generateShortToken() {
        return generateBase62Token(8);
    }

    /**
     * Generate a base62 encoded token of the specified length.
     *
     * @param length The desired length of the token
     * @return A random base62 string of the specified length
     */
    private String generateBase62Token(int length) {
        StringBuilder sb = new StringBuilder(length);
        byte[] randomBytes = new byte[length];
        SECURE_RANDOM.nextBytes(randomBytes);

        for (int i = 0; i < length; i++) {
            // Convert byte to positive int and mod by alphabet length
            int index = (randomBytes[i] & 0xFF) % BASE62_LENGTH;
            sb.append(BASE62_ALPHABET.charAt(index));
        }

        return sb.toString();
    }

    /**
     * Generate a session fingerprint for analytics tracking.
     * Combines IP and user agent into a hashed identifier.
     *
     * @param ipAddress The client's IP address
     * @param userAgent The client's user agent string
     * @return A fingerprint hash for session tracking
     */
    public String generateSessionFingerprint(String ipAddress, String userAgent) {
        String combined = (ipAddress != null ? ipAddress : "") + "|" + (userAgent != null ? userAgent : "");
        // Simple hash - in production you might want something more sophisticated
        return Integer.toHexString(combined.hashCode());
    }

    /**
     * Validate that a token has the expected format.
     *
     * @param token The token to validate
     * @return true if the token is valid base62
     */
    public boolean isValidTokenFormat(String token) {
        if (token == null || token.isEmpty()) {
            return false;
        }
        for (char c : token.toCharArray()) {
            if (BASE62_ALPHABET.indexOf(c) == -1) {
                return false;
            }
        }
        return true;
    }
}
