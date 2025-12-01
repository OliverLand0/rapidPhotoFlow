package com.rapidphotoflow.domain;

import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class SharedLinkTest {

    // ========== Factory Method Tests ==========

    @Test
    void createForPhoto_withValidParams_createsSharedLink() {
        UUID photoId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        String token = "abc123token";

        SharedLink link = SharedLink.createForPhoto(photoId, userId, token);

        assertNotNull(link.getId());
        assertEquals(token, link.getToken());
        assertEquals(photoId, link.getPhotoId());
        assertNull(link.getAlbumId());
        assertNull(link.getFolderId());
        assertEquals(userId, link.getCreatedByUserId());
        assertTrue(link.isDownloadAllowed());
        assertFalse(link.isDownloadOriginal());
        assertFalse(link.isRequireEmail());
        assertTrue(link.isActive());
        assertEquals(0, link.getViewCount());
        assertEquals(0, link.getDownloadCount());
        assertNotNull(link.getCreatedAt());
        assertNotNull(link.getUpdatedAt());
    }

    @Test
    void createForPhoto_withNullPhotoId_throwsException() {
        UUID userId = UUID.randomUUID();
        String token = "abc123token";

        assertThrows(IllegalArgumentException.class, () -> {
            SharedLink.createForPhoto(null, userId, token);
        });
    }

    @Test
    void createForPhoto_withNullUserId_throwsException() {
        UUID photoId = UUID.randomUUID();
        String token = "abc123token";

        assertThrows(IllegalArgumentException.class, () -> {
            SharedLink.createForPhoto(photoId, null, token);
        });
    }

    @Test
    void createForPhoto_withNullToken_throwsException() {
        UUID photoId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();

        assertThrows(IllegalArgumentException.class, () -> {
            SharedLink.createForPhoto(photoId, userId, null);
        });
    }

    @Test
    void createForPhoto_withEmptyToken_throwsException() {
        UUID photoId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();

        assertThrows(IllegalArgumentException.class, () -> {
            SharedLink.createForPhoto(photoId, userId, "");
        });
    }

    @Test
    void createForPhoto_withBlankToken_throwsException() {
        UUID photoId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();

        assertThrows(IllegalArgumentException.class, () -> {
            SharedLink.createForPhoto(photoId, userId, "   ");
        });
    }

    @Test
    void createForAlbum_withValidParams_createsSharedLink() {
        UUID albumId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        String token = "album123token";

        SharedLink link = SharedLink.createForAlbum(albumId, userId, token);

        assertNotNull(link.getId());
        assertEquals(token, link.getToken());
        assertNull(link.getPhotoId());
        assertEquals(albumId, link.getAlbumId());
        assertNull(link.getFolderId());
        assertEquals(userId, link.getCreatedByUserId());
        assertEquals(SharedLink.ShareType.ALBUM, link.getType());
    }

    @Test
    void createForAlbum_withNullAlbumId_throwsException() {
        UUID userId = UUID.randomUUID();
        String token = "album123token";

        assertThrows(IllegalArgumentException.class, () -> {
            SharedLink.createForAlbum(null, userId, token);
        });
    }

    @Test
    void createForFolder_withValidParams_createsSharedLink() {
        UUID folderId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        String token = "folder123token";

        SharedLink link = SharedLink.createForFolder(folderId, userId, token);

        assertNotNull(link.getId());
        assertEquals(token, link.getToken());
        assertNull(link.getPhotoId());
        assertNull(link.getAlbumId());
        assertEquals(folderId, link.getFolderId());
        assertEquals(userId, link.getCreatedByUserId());
        assertEquals(SharedLink.ShareType.FOLDER, link.getType());
    }

    @Test
    void createForFolder_withNullFolderId_throwsException() {
        UUID userId = UUID.randomUUID();
        String token = "folder123token";

        assertThrows(IllegalArgumentException.class, () -> {
            SharedLink.createForFolder(null, userId, token);
        });
    }

    // ========== Type Detection Tests ==========

    @Test
    void getType_forPhotoShare_returnsPhoto() {
        UUID photoId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        SharedLink link = SharedLink.createForPhoto(photoId, userId, "token123");

        assertEquals(SharedLink.ShareType.PHOTO, link.getType());
    }

    @Test
    void getType_forAlbumShare_returnsAlbum() {
        UUID albumId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        SharedLink link = SharedLink.createForAlbum(albumId, userId, "token123");

        assertEquals(SharedLink.ShareType.ALBUM, link.getType());
    }

    @Test
    void getType_forFolderShare_returnsFolder() {
        UUID folderId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        SharedLink link = SharedLink.createForFolder(folderId, userId, "token123");

        assertEquals(SharedLink.ShareType.FOLDER, link.getType());
    }

    @Test
    void getTargetId_forPhotoShare_returnsPhotoId() {
        UUID photoId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        SharedLink link = SharedLink.createForPhoto(photoId, userId, "token123");

        assertEquals(photoId, link.getTargetId());
    }

    @Test
    void getTargetId_forAlbumShare_returnsAlbumId() {
        UUID albumId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        SharedLink link = SharedLink.createForAlbum(albumId, userId, "token123");

        assertEquals(albumId, link.getTargetId());
    }

    @Test
    void getTargetId_forFolderShare_returnsFolderId() {
        UUID folderId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        SharedLink link = SharedLink.createForFolder(folderId, userId, "token123");

        assertEquals(folderId, link.getTargetId());
    }

    // ========== Expiration Tests ==========

    @Test
    void isExpired_withNoExpiration_returnsFalse() {
        UUID photoId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        SharedLink link = SharedLink.createForPhoto(photoId, userId, "token123");

        assertFalse(link.isExpired());
    }

    @Test
    void isExpired_withFutureExpiration_returnsFalse() {
        UUID photoId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        SharedLink link = SharedLink.createForPhoto(photoId, userId, "token123");
        link.setCustomExpiration(Instant.now().plus(1, ChronoUnit.HOURS));

        assertFalse(link.isExpired());
    }

    @Test
    void isExpired_withPastExpiration_returnsTrue() {
        UUID photoId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        SharedLink link = SharedLink.createForPhoto(photoId, userId, "token123");
        link.setCustomExpiration(Instant.now().minus(1, ChronoUnit.HOURS));

        assertTrue(link.isExpired());
    }

    @Test
    void setExpiration_withNever_setsExpiresAtNull() {
        UUID photoId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        SharedLink link = SharedLink.createForPhoto(photoId, userId, "token123");

        link.setExpiration(SharedLink.ExpirationOption.NEVER);

        assertNull(link.getExpiresAt());
    }

    @Test
    void setExpiration_withOneHour_setsFutureExpiration() {
        UUID photoId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        SharedLink link = SharedLink.createForPhoto(photoId, userId, "token123");

        link.setExpiration(SharedLink.ExpirationOption.ONE_HOUR);

        assertNotNull(link.getExpiresAt());
        assertTrue(link.getExpiresAt().isAfter(Instant.now()));
        assertTrue(link.getExpiresAt().isBefore(Instant.now().plus(2, ChronoUnit.HOURS)));
    }

    // ========== Password Protection Tests ==========

    @Test
    void isPasswordProtected_withNoPassword_returnsFalse() {
        UUID photoId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        SharedLink link = SharedLink.createForPhoto(photoId, userId, "token123");

        assertFalse(link.isPasswordProtected());
    }

    @Test
    void isPasswordProtected_withPassword_returnsTrue() {
        UUID photoId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        SharedLink link = SharedLink.createForPhoto(photoId, userId, "token123");
        link.setPasswordHash("hashedPassword123");

        assertTrue(link.isPasswordProtected());
    }

    @Test
    void isPasswordProtected_withEmptyPassword_returnsFalse() {
        UUID photoId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        SharedLink link = SharedLink.createForPhoto(photoId, userId, "token123");
        link.setPasswordHash("");

        assertFalse(link.isPasswordProtected());
    }

    // ========== Max Views Tests ==========

    @Test
    void hasReachedMaxViews_withNoLimit_returnsFalse() {
        UUID photoId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        SharedLink link = SharedLink.createForPhoto(photoId, userId, "token123");

        assertFalse(link.hasReachedMaxViews());
    }

    @Test
    void hasReachedMaxViews_belowLimit_returnsFalse() {
        UUID photoId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        SharedLink link = SharedLink.createForPhoto(photoId, userId, "token123");
        link.setMaxViews(10);

        assertFalse(link.hasReachedMaxViews());
    }

    @Test
    void hasReachedMaxViews_atLimit_returnsTrue() {
        UUID photoId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        SharedLink link = SharedLink.createForPhoto(photoId, userId, "token123");
        link.setMaxViews(5);
        // Simulate 5 views
        for (int i = 0; i < 5; i++) {
            link.recordView();
        }

        assertTrue(link.hasReachedMaxViews());
    }

    @Test
    void hasReachedMaxViews_aboveLimit_returnsTrue() {
        UUID photoId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        SharedLink link = SharedLink.createForPhoto(photoId, userId, "token123");
        link.setMaxViews(3);
        // Simulate 5 views (more than limit)
        for (int i = 0; i < 5; i++) {
            link.recordView();
        }

        assertTrue(link.hasReachedMaxViews());
    }

    // ========== Accessibility Tests ==========

    @Test
    void isAccessible_whenActive_returnsTrue() {
        UUID photoId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        SharedLink link = SharedLink.createForPhoto(photoId, userId, "token123");

        assertTrue(link.isAccessible());
    }

    @Test
    void isAccessible_whenDeactivated_returnsFalse() {
        UUID photoId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        SharedLink link = SharedLink.createForPhoto(photoId, userId, "token123");
        link.deactivate();

        assertFalse(link.isAccessible());
    }

    @Test
    void isAccessible_whenExpired_returnsFalse() {
        UUID photoId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        SharedLink link = SharedLink.createForPhoto(photoId, userId, "token123");
        link.setCustomExpiration(Instant.now().minus(1, ChronoUnit.HOURS));

        assertFalse(link.isAccessible());
    }

    @Test
    void isAccessible_whenMaxViewsReached_returnsFalse() {
        UUID photoId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        SharedLink link = SharedLink.createForPhoto(photoId, userId, "token123");
        link.setMaxViews(1);
        link.recordView();

        assertFalse(link.isAccessible());
    }

    // ========== Activation/Deactivation Tests ==========

    @Test
    void deactivate_setsActiveToFalse() {
        UUID photoId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        SharedLink link = SharedLink.createForPhoto(photoId, userId, "token123");

        link.deactivate();

        assertFalse(link.isActive());
    }

    @Test
    void activate_setsActiveToTrue() {
        UUID photoId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        SharedLink link = SharedLink.createForPhoto(photoId, userId, "token123");
        link.deactivate();

        link.activate();

        assertTrue(link.isActive());
    }

    // ========== Analytics Tests ==========

    @Test
    void recordView_incrementsViewCount() {
        UUID photoId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        SharedLink link = SharedLink.createForPhoto(photoId, userId, "token123");

        link.recordView();

        assertEquals(1, link.getViewCount());
        assertNotNull(link.getLastAccessedAt());
    }

    @Test
    void recordView_multipleViews_incrementsCorrectly() {
        UUID photoId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        SharedLink link = SharedLink.createForPhoto(photoId, userId, "token123");

        link.recordView();
        link.recordView();
        link.recordView();

        assertEquals(3, link.getViewCount());
    }

    @Test
    void recordDownload_incrementsDownloadCount() {
        UUID photoId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        SharedLink link = SharedLink.createForPhoto(photoId, userId, "token123");

        link.recordDownload();

        assertEquals(1, link.getDownloadCount());
        assertNotNull(link.getLastAccessedAt());
    }

    // ========== Settings Update Tests ==========

    @Test
    void updateSettings_updatesDownloadAllowed() {
        UUID photoId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        SharedLink link = SharedLink.createForPhoto(photoId, userId, "token123");

        link.updateSettings(false, null, null, null, null);

        assertFalse(link.isDownloadAllowed());
    }

    @Test
    void updateSettings_updatesMaxViews() {
        UUID photoId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        SharedLink link = SharedLink.createForPhoto(photoId, userId, "token123");

        link.updateSettings(null, null, 100, null, null);

        assertEquals(100, link.getMaxViews());
    }

    @Test
    void updateSettings_updatesExpiration() {
        UUID photoId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        SharedLink link = SharedLink.createForPhoto(photoId, userId, "token123");
        Instant newExpiration = Instant.now().plus(7, ChronoUnit.DAYS);

        link.updateSettings(null, null, null, null, newExpiration);

        assertEquals(newExpiration, link.getExpiresAt());
    }

    @Test
    void updateSettings_clearsMaxViews_withNull() {
        UUID photoId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        SharedLink link = SharedLink.createForPhoto(photoId, userId, "token123");
        link.setMaxViews(10);

        link.updateSettings(null, null, null, null, null);

        assertNull(link.getMaxViews());
    }

    // ========== ExpirationOption Enum Tests ==========

    @Test
    void expirationOption_never_returnsNull() {
        assertNull(SharedLink.ExpirationOption.NEVER.toExpiresAt());
    }

    @Test
    void expirationOption_oneHour_returnsFutureTime() {
        Instant result = SharedLink.ExpirationOption.ONE_HOUR.toExpiresAt();

        assertNotNull(result);
        assertTrue(result.isAfter(Instant.now()));
        assertTrue(result.isBefore(Instant.now().plus(2, ChronoUnit.HOURS)));
    }

    @Test
    void expirationOption_oneDay_returnsFutureTime() {
        Instant result = SharedLink.ExpirationOption.ONE_DAY.toExpiresAt();

        assertNotNull(result);
        assertTrue(result.isAfter(Instant.now().plus(23, ChronoUnit.HOURS)));
        assertTrue(result.isBefore(Instant.now().plus(25, ChronoUnit.HOURS)));
    }

    @Test
    void expirationOption_sevenDays_returnsFutureTime() {
        Instant result = SharedLink.ExpirationOption.SEVEN_DAYS.toExpiresAt();

        assertNotNull(result);
        assertTrue(result.isAfter(Instant.now().plus(6, ChronoUnit.DAYS)));
        assertTrue(result.isBefore(Instant.now().plus(8, ChronoUnit.DAYS)));
    }

    @Test
    void expirationOption_thirtyDays_returnsFutureTime() {
        Instant result = SharedLink.ExpirationOption.THIRTY_DAYS.toExpiresAt();

        assertNotNull(result);
        assertTrue(result.isAfter(Instant.now().plus(29, ChronoUnit.DAYS)));
        assertTrue(result.isBefore(Instant.now().plus(31, ChronoUnit.DAYS)));
    }
}
