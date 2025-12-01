package com.rapidphotoflow.dto;

import com.rapidphotoflow.domain.Folder;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Data
@Builder
public class FolderDTO {
    private UUID id;
    private String name;
    private UUID parentId;
    private Instant createdAt;
    private Instant updatedAt;
    private String path;
    private int photoCount;

    @Builder.Default
    private List<FolderDTO> children = new ArrayList<>();

    public static FolderDTO fromDomain(Folder folder) {
        return FolderDTO.builder()
                .id(folder.getId())
                .name(folder.getName())
                .parentId(folder.getParentId())
                .createdAt(folder.getCreatedAt())
                .updatedAt(folder.getUpdatedAt())
                .path(folder.getPath())
                .photoCount(folder.getPhotoCount())
                .children(folder.getChildren() != null
                        ? folder.getChildren().stream()
                                .map(FolderDTO::fromDomain)
                                .collect(Collectors.toList())
                        : new ArrayList<>())
                .build();
    }
}
