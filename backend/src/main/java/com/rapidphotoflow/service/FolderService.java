package com.rapidphotoflow.service;

import com.rapidphotoflow.domain.EventType;
import com.rapidphotoflow.domain.Folder;
import com.rapidphotoflow.entity.FolderEntity;
import com.rapidphotoflow.entity.PhotoEntity;
import com.rapidphotoflow.entity.UserEntity;
import com.rapidphotoflow.repository.FolderRepository;
import com.rapidphotoflow.repository.PhotoRepository;
import com.rapidphotoflow.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class FolderService {

    private final FolderRepository folderRepository;
    private final PhotoRepository photoRepository;
    private final UserRepository userRepository;
    private final EventService eventService;

    @Transactional
    public Folder createFolder(String name, UUID parentId) {
        UUID userId = getCurrentUserId();
        if (userId == null) {
            throw new IllegalStateException("User not authenticated");
        }

        // Check if parent folder exists and belongs to user
        if (parentId != null) {
            folderRepository.findByIdAndUserId(parentId, userId)
                    .orElseThrow(() -> new IllegalArgumentException("Parent folder not found"));
        }

        // Check for duplicate name in same parent
        if (folderRepository.existsByNameAndParentIdAndUserId(name.trim(), parentId, userId)) {
            throw new IllegalArgumentException("A folder with this name already exists in this location");
        }

        Folder folder = Folder.create(name, parentId, userId);

        FolderEntity entity = FolderEntity.builder()
                .id(folder.getId())
                .name(folder.getName())
                .parentId(folder.getParentId())
                .userId(folder.getUserId())
                .createdAt(folder.getCreatedAt())
                .updatedAt(folder.getUpdatedAt())
                .build();

        folderRepository.save(entity);
        log.info("Folder created: {} ({})", folder.getName(), folder.getId());

        return entityToFolder(entity);
    }

    @Transactional
    public Folder renameFolder(UUID folderId, String newName) {
        UUID userId = getCurrentUserId();
        if (userId == null) {
            throw new IllegalStateException("User not authenticated");
        }

        FolderEntity entity = folderRepository.findByIdAndUserId(folderId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Folder not found"));

        String trimmedName = newName.trim();

        // Check for duplicate name in same parent (excluding current folder)
        Optional<FolderEntity> existing = folderRepository.findByNameAndParentIdAndUserId(
                trimmedName, entity.getParentId(), userId);
        if (existing.isPresent() && !existing.get().getId().equals(folderId)) {
            throw new IllegalArgumentException("A folder with this name already exists in this location");
        }

        String oldName = entity.getName();
        entity.setName(trimmedName);
        entity.setUpdatedAt(Instant.now());
        folderRepository.save(entity);

        log.info("Folder renamed: {} -> {} ({})", oldName, trimmedName, folderId);

        return entityToFolder(entity);
    }

    @Transactional
    public Folder moveFolder(UUID folderId, UUID newParentId) {
        UUID userId = getCurrentUserId();
        if (userId == null) {
            throw new IllegalStateException("User not authenticated");
        }

        FolderEntity entity = folderRepository.findByIdAndUserId(folderId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Folder not found"));

        // Cannot move folder into itself
        if (newParentId != null && newParentId.equals(folderId)) {
            throw new IllegalArgumentException("Cannot move folder into itself");
        }

        // Check if new parent exists and belongs to user
        if (newParentId != null) {
            folderRepository.findByIdAndUserId(newParentId, userId)
                    .orElseThrow(() -> new IllegalArgumentException("Target folder not found"));

            // Check for circular reference (cannot move folder into its own descendant)
            if (isDescendant(folderId, newParentId, userId)) {
                throw new IllegalArgumentException("Cannot move folder into its own subfolder");
            }
        }

        // Check for duplicate name in new parent
        if (folderRepository.existsByNameAndParentIdAndUserId(entity.getName(), newParentId, userId)) {
            throw new IllegalArgumentException("A folder with this name already exists in the target location");
        }

        entity.setParentId(newParentId);
        entity.setUpdatedAt(Instant.now());
        folderRepository.save(entity);

        log.info("Folder moved: {} to parent {}", folderId, newParentId);

        return entityToFolder(entity);
    }

    @Transactional
    public void deleteFolder(UUID folderId, boolean deleteContents) {
        UUID userId = getCurrentUserId();
        if (userId == null) {
            throw new IllegalStateException("User not authenticated");
        }

        FolderEntity entity = folderRepository.findByIdAndUserId(folderId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Folder not found"));

        // Check if folder has children
        List<FolderEntity> children = folderRepository.findByUserIdAndParentIdOrderByNameAsc(userId, folderId);
        if (!children.isEmpty() && !deleteContents) {
            throw new IllegalStateException("Folder contains subfolders. Use deleteContents=true to delete recursively");
        }

        // Check if folder has photos
        long photoCount = photoRepository.countByFolderId(folderId);
        if (photoCount > 0 && !deleteContents) {
            throw new IllegalStateException("Folder contains photos. Use deleteContents=true to move photos to root");
        }

        if (deleteContents) {
            // Move photos to root (null folder)
            photoRepository.findByFolderId(folderId).forEach(photo -> {
                photo.setFolderId(null);
                photo.setUpdatedAt(Instant.now());
                photoRepository.save(photo);
            });

            // Recursively delete child folders
            for (FolderEntity child : children) {
                deleteFolder(child.getId(), true);
            }
        }

        folderRepository.delete(entity);
        log.info("Folder deleted: {} ({})", entity.getName(), folderId);
    }

    public Optional<Folder> getFolderById(UUID folderId) {
        UUID userId = getCurrentUserId();
        if (userId == null) {
            return Optional.empty();
        }

        return folderRepository.findByIdAndUserId(folderId, userId)
                .map(this::entityToFolder);
    }

    public List<Folder> getFolderTree() {
        UUID userId = getCurrentUserId();
        if (userId == null) {
            return Collections.emptyList();
        }

        List<FolderEntity> allFolders = folderRepository.findByUserIdOrderByNameAsc(userId);

        // Get photo counts per folder
        Map<UUID, Long> photoCounts = new HashMap<>();
        for (FolderEntity folder : allFolders) {
            photoCounts.put(folder.getId(), photoRepository.countByFolderId(folder.getId()));
        }

        // Build tree structure
        Map<UUID, Folder> folderMap = new HashMap<>();
        List<Folder> rootFolders = new ArrayList<>();

        // First pass: create all folders
        for (FolderEntity entity : allFolders) {
            Folder folder = entityToFolder(entity);
            folder.setPhotoCount(photoCounts.getOrDefault(entity.getId(), 0L).intValue());
            folder.setChildren(new ArrayList<>());
            folderMap.put(entity.getId(), folder);
        }

        // Second pass: build tree
        for (FolderEntity entity : allFolders) {
            Folder folder = folderMap.get(entity.getId());
            if (entity.getParentId() == null) {
                rootFolders.add(folder);
            } else {
                Folder parent = folderMap.get(entity.getParentId());
                if (parent != null) {
                    parent.getChildren().add(folder);
                }
            }
        }

        // Calculate paths
        for (Folder root : rootFolders) {
            calculatePaths(root, "");
        }

        return rootFolders;
    }

    public List<Folder> getFolderPath(UUID folderId) {
        UUID userId = getCurrentUserId();
        if (userId == null) {
            return Collections.emptyList();
        }

        List<Folder> path = new ArrayList<>();
        UUID currentId = folderId;

        while (currentId != null) {
            UUID finalCurrentId = currentId;
            FolderEntity entity = folderRepository.findByIdAndUserId(currentId, userId)
                    .orElse(null);

            if (entity == null) {
                break;
            }

            path.add(0, entityToFolder(entity));
            currentId = entity.getParentId();
        }

        return path;
    }

    @Transactional
    public void movePhotosToFolder(List<UUID> photoIds, UUID folderId) {
        UUID userId = getCurrentUserId();
        if (userId == null) {
            throw new IllegalStateException("User not authenticated");
        }

        // Verify folder exists and belongs to user (if not null)
        if (folderId != null) {
            folderRepository.findByIdAndUserId(folderId, userId)
                    .orElseThrow(() -> new IllegalArgumentException("Folder not found"));
        }

        for (UUID photoId : photoIds) {
            PhotoEntity photo = photoRepository.findById(photoId)
                    .orElse(null);

            if (photo != null && userId.equals(photo.getUploadedByUserId())) {
                photo.setFolderId(folderId);
                photo.setUpdatedAt(Instant.now());
                photoRepository.save(photo);

                eventService.logEvent(photoId, EventType.PHOTO_MOVED_TO_FOLDER,
                        "Photo moved to folder: " + (folderId != null ? folderId : "root"));
            }
        }

        log.info("Moved {} photos to folder {}", photoIds.size(), folderId);
    }

    private boolean isDescendant(UUID ancestorId, UUID potentialDescendantId, UUID userId) {
        UUID currentId = potentialDescendantId;

        while (currentId != null) {
            if (currentId.equals(ancestorId)) {
                return true;
            }

            UUID finalCurrentId = currentId;
            FolderEntity parent = folderRepository.findByIdAndUserId(currentId, userId)
                    .orElse(null);

            if (parent == null) {
                break;
            }

            currentId = parent.getParentId();
        }

        return false;
    }

    private void calculatePaths(Folder folder, String parentPath) {
        String currentPath = parentPath.isEmpty() ? folder.getName() : parentPath + "/" + folder.getName();
        folder.setPath(currentPath);

        for (Folder child : folder.getChildren()) {
            calculatePaths(child, currentPath);
        }
    }

    private UUID getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof Jwt jwt) {
            String cognitoSub = jwt.getSubject();
            return userRepository.findByCognitoSub(cognitoSub)
                    .map(UserEntity::getId)
                    .orElse(null);
        }
        return null;
    }

    private Folder entityToFolder(FolderEntity entity) {
        return Folder.builder()
                .id(entity.getId())
                .name(entity.getName())
                .parentId(entity.getParentId())
                .userId(entity.getUserId())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .children(new ArrayList<>())
                .build();
    }
}
