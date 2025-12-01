package com.rapidphotoflow.domain;

import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class AlbumTest {

    @Test
    void create_withValidName_createsAlbum() {
        UUID userId = UUID.randomUUID();
        Album album = Album.create("My Album", "Description", userId);

        assertNotNull(album.getId());
        assertEquals("My Album", album.getName());
        assertEquals("Description", album.getDescription());
        assertEquals(userId, album.getUserId());
        assertNotNull(album.getCreatedAt());
        assertNotNull(album.getUpdatedAt());
    }

    @Test
    void create_trimsName() {
        UUID userId = UUID.randomUUID();
        Album album = Album.create("  Trimmed Name  ", null, userId);

        assertEquals("Trimmed Name", album.getName());
    }

    @Test
    void create_withEmptyName_throwsException() {
        UUID userId = UUID.randomUUID();

        assertThrows(IllegalArgumentException.class, () -> {
            Album.create("", null, userId);
        });
    }

    @Test
    void create_withNullName_throwsException() {
        UUID userId = UUID.randomUUID();

        assertThrows(IllegalArgumentException.class, () -> {
            Album.create(null, null, userId);
        });
    }

    @Test
    void create_withNameTooLong_throwsException() {
        UUID userId = UUID.randomUUID();
        String longName = "a".repeat(256);

        assertThrows(IllegalArgumentException.class, () -> {
            Album.create(longName, null, userId);
        });
    }

    @Test
    void update_withValidName_updatesName() {
        UUID userId = UUID.randomUUID();
        Album album = Album.create("Original", null, userId);

        album.update("New Name", null);

        assertEquals("New Name", album.getName());
    }

    @Test
    void update_withEmptyName_throwsException() {
        UUID userId = UUID.randomUUID();
        Album album = Album.create("Original", null, userId);

        assertThrows(IllegalArgumentException.class, () -> {
            album.update("", null);
        });
    }

    @Test
    void update_withDescription_updatesDescription() {
        UUID userId = UUID.randomUUID();
        Album album = Album.create("Album", "Old description", userId);

        album.update(null, "New description");

        assertEquals("New description", album.getDescription());
        assertEquals("Album", album.getName()); // Name unchanged
    }

    @Test
    void addPhoto_addsPhotoId() {
        UUID userId = UUID.randomUUID();
        UUID photoId = UUID.randomUUID();
        Album album = Album.create("Album", null, userId);

        boolean added = album.addPhoto(photoId);

        assertTrue(added);
        assertTrue(album.containsPhoto(photoId));
    }

    @Test
    void addPhoto_withNull_returnsFalse() {
        UUID userId = UUID.randomUUID();
        Album album = Album.create("Album", null, userId);

        boolean added = album.addPhoto(null);

        assertFalse(added);
    }

    @Test
    void addPhoto_duplicate_returnsFalse() {
        UUID userId = UUID.randomUUID();
        UUID photoId = UUID.randomUUID();
        Album album = Album.create("Album", null, userId);

        album.addPhoto(photoId);
        boolean addedAgain = album.addPhoto(photoId);

        assertFalse(addedAgain);
    }

    @Test
    void removePhoto_removesPhotoId() {
        UUID userId = UUID.randomUUID();
        UUID photoId = UUID.randomUUID();
        Album album = Album.create("Album", null, userId);
        album.addPhoto(photoId);

        boolean removed = album.removePhoto(photoId);

        assertTrue(removed);
        assertFalse(album.containsPhoto(photoId));
    }

    @Test
    void removePhoto_notInAlbum_returnsFalse() {
        UUID userId = UUID.randomUUID();
        UUID photoId = UUID.randomUUID();
        Album album = Album.create("Album", null, userId);

        boolean removed = album.removePhoto(photoId);

        assertFalse(removed);
    }

    @Test
    void removePhoto_clearsCoverPhotoIfRemoved() {
        UUID userId = UUID.randomUUID();
        UUID photoId = UUID.randomUUID();
        Album album = Album.create("Album", null, userId);
        album.addPhoto(photoId);
        album.setCoverPhoto(photoId);

        album.removePhoto(photoId);

        assertNull(album.getCoverPhotoId());
    }

    @Test
    void setCoverPhoto_setsCoverPhotoId() {
        UUID userId = UUID.randomUUID();
        UUID photoId = UUID.randomUUID();
        Album album = Album.create("Album", null, userId);

        album.setCoverPhoto(photoId);

        assertEquals(photoId, album.getCoverPhotoId());
    }

    @Test
    void containsPhoto_withPhotoInAlbum_returnsTrue() {
        UUID userId = UUID.randomUUID();
        UUID photoId = UUID.randomUUID();
        Album album = Album.create("Album", null, userId);
        album.addPhoto(photoId);

        assertTrue(album.containsPhoto(photoId));
    }

    @Test
    void containsPhoto_withPhotoNotInAlbum_returnsFalse() {
        UUID userId = UUID.randomUUID();
        UUID photoId = UUID.randomUUID();
        Album album = Album.create("Album", null, userId);

        assertFalse(album.containsPhoto(photoId));
    }
}
