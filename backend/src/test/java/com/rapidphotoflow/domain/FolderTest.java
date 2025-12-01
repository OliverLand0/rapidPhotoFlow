package com.rapidphotoflow.domain;

import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class FolderTest {

    @Test
    void create_withValidName_createsFolder() {
        UUID userId = UUID.randomUUID();
        Folder folder = Folder.create("My Folder", null, userId);

        assertNotNull(folder.getId());
        assertEquals("My Folder", folder.getName());
        assertNull(folder.getParentId());
        assertEquals(userId, folder.getUserId());
        assertNotNull(folder.getCreatedAt());
        assertNotNull(folder.getUpdatedAt());
    }

    @Test
    void create_withParent_setsParentId() {
        UUID userId = UUID.randomUUID();
        UUID parentId = UUID.randomUUID();
        Folder folder = Folder.create("Subfolder", parentId, userId);

        assertEquals(parentId, folder.getParentId());
    }

    @Test
    void create_trimsName() {
        UUID userId = UUID.randomUUID();
        Folder folder = Folder.create("  Trimmed Name  ", null, userId);

        assertEquals("Trimmed Name", folder.getName());
    }

    @Test
    void create_withEmptyName_throwsException() {
        UUID userId = UUID.randomUUID();

        assertThrows(IllegalArgumentException.class, () -> {
            Folder.create("", null, userId);
        });
    }

    @Test
    void create_withBlankName_throwsException() {
        UUID userId = UUID.randomUUID();

        assertThrows(IllegalArgumentException.class, () -> {
            Folder.create("   ", null, userId);
        });
    }

    @Test
    void create_withNullName_throwsException() {
        UUID userId = UUID.randomUUID();

        assertThrows(IllegalArgumentException.class, () -> {
            Folder.create(null, null, userId);
        });
    }

    @Test
    void create_withNameTooLong_throwsException() {
        UUID userId = UUID.randomUUID();
        String longName = "a".repeat(256);

        assertThrows(IllegalArgumentException.class, () -> {
            Folder.create(longName, null, userId);
        });
    }

    @Test
    void rename_withValidName_updatesName() {
        UUID userId = UUID.randomUUID();
        Folder folder = Folder.create("Original", null, userId);

        folder.rename("New Name");

        assertEquals("New Name", folder.getName());
    }

    @Test
    void rename_withEmptyName_throwsException() {
        UUID userId = UUID.randomUUID();
        Folder folder = Folder.create("Original", null, userId);

        assertThrows(IllegalArgumentException.class, () -> {
            folder.rename("");
        });
    }

    @Test
    void moveTo_withValidParent_updatesParentId() {
        UUID userId = UUID.randomUUID();
        UUID newParentId = UUID.randomUUID();
        Folder folder = Folder.create("Folder", null, userId);

        folder.moveTo(newParentId);

        assertEquals(newParentId, folder.getParentId());
    }

    @Test
    void moveTo_toItself_throwsException() {
        UUID userId = UUID.randomUUID();
        Folder folder = Folder.create("Folder", null, userId);

        assertThrows(IllegalArgumentException.class, () -> {
            folder.moveTo(folder.getId());
        });
    }

    @Test
    void moveTo_toRoot_setsParentIdNull() {
        UUID userId = UUID.randomUUID();
        UUID parentId = UUID.randomUUID();
        Folder folder = Folder.create("Subfolder", parentId, userId);

        folder.moveTo(null);

        assertNull(folder.getParentId());
    }

    @Test
    void isRoot_withNoParent_returnsTrue() {
        UUID userId = UUID.randomUUID();
        Folder folder = Folder.create("Root Folder", null, userId);

        assertTrue(folder.isRoot());
    }

    @Test
    void isRoot_withParent_returnsFalse() {
        UUID userId = UUID.randomUUID();
        UUID parentId = UUID.randomUUID();
        Folder folder = Folder.create("Subfolder", parentId, userId);

        assertFalse(folder.isRoot());
    }
}
