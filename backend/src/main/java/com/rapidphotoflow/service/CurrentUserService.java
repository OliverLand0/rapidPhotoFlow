package com.rapidphotoflow.service;

import java.util.UUID;

/**
 * Service to get the current authenticated user's ID.
 * Has different implementations for local development vs production.
 */
public interface CurrentUserService {

    /**
     * Get the current user's UUID.
     * @return the user ID, or null if not authenticated
     */
    UUID getCurrentUserId();
}
