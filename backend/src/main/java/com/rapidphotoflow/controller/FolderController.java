package com.rapidphotoflow.controller;

import com.rapidphotoflow.domain.Folder;
import com.rapidphotoflow.dto.*;
import com.rapidphotoflow.service.FolderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/folders")
@RequiredArgsConstructor
@Tag(name = "Folders", description = "Folder management endpoints")
public class FolderController {

    private final FolderService folderService;

    @GetMapping
    @Operation(summary = "Get folder tree", description = "Get hierarchical folder structure for current user")
    public ResponseEntity<FolderListResponse> getFolderTree() {
        List<Folder> folders = folderService.getFolderTree();
        List<FolderDTO> dtos = folders.stream()
                .map(FolderDTO::fromDomain)
                .collect(Collectors.toList());
        return ResponseEntity.ok(FolderListResponse.of(dtos));
    }

    @PostMapping
    @Operation(summary = "Create folder", description = "Create a new folder")
    public ResponseEntity<FolderDTO> createFolder(@Valid @RequestBody CreateFolderRequest request) {
        try {
            Folder folder = folderService.createFolder(request.getName(), request.getParentId());
            return ResponseEntity.ok(FolderDTO.fromDomain(folder));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.status(401).build();
        }
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get folder by ID", description = "Get a specific folder by its ID")
    public ResponseEntity<FolderDTO> getFolderById(@PathVariable UUID id) {
        return folderService.getFolderById(id)
                .map(FolderDTO::fromDomain)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update folder", description = "Rename a folder")
    public ResponseEntity<FolderDTO> updateFolder(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateFolderRequest request) {
        try {
            Folder folder;
            if (request.getName() != null && !request.getName().isBlank()) {
                folder = folderService.renameFolder(id, request.getName());
            } else {
                return folderService.getFolderById(id)
                        .map(FolderDTO::fromDomain)
                        .map(ResponseEntity::ok)
                        .orElse(ResponseEntity.notFound().build());
            }
            return ResponseEntity.ok(FolderDTO.fromDomain(folder));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.status(401).build();
        }
    }

    @PutMapping("/{id}/move")
    @Operation(summary = "Move folder", description = "Move folder to a new parent")
    public ResponseEntity<FolderDTO> moveFolder(
            @PathVariable UUID id,
            @RequestBody UpdateFolderRequest request) {
        try {
            Folder folder = folderService.moveFolder(id, request.getParentId());
            return ResponseEntity.ok(FolderDTO.fromDomain(folder));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.status(401).build();
        }
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete folder", description = "Delete a folder")
    public ResponseEntity<Void> deleteFolder(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "false") boolean deleteContents) {
        try {
            folderService.deleteFolder(id, deleteContents);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/{id}/path")
    @Operation(summary = "Get folder path", description = "Get breadcrumb path to folder")
    public ResponseEntity<FolderListResponse> getFolderPath(@PathVariable UUID id) {
        List<Folder> path = folderService.getFolderPath(id);
        List<FolderDTO> dtos = path.stream()
                .map(FolderDTO::fromDomain)
                .collect(Collectors.toList());
        return ResponseEntity.ok(FolderListResponse.of(dtos));
    }

    @PostMapping("/{id}/photos")
    @Operation(summary = "Move photos to folder", description = "Move photos to this folder")
    public ResponseEntity<Void> movePhotosToFolder(
            @PathVariable UUID id,
            @Valid @RequestBody MovePhotosRequest request) {
        try {
            // Use the folder ID from path, ignore folderId in request body
            folderService.movePhotosToFolder(request.getPhotoIds(), id);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.status(401).build();
        }
    }

    @PostMapping("/root/photos")
    @Operation(summary = "Move photos to root", description = "Move photos to root (no folder)")
    public ResponseEntity<Void> movePhotosToRoot(@Valid @RequestBody MovePhotosRequest request) {
        try {
            folderService.movePhotosToFolder(request.getPhotoIds(), null);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.status(401).build();
        }
    }
}
