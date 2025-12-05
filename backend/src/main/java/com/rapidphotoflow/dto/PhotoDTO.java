package com.rapidphotoflow.dto;

import com.rapidphotoflow.domain.Photo;
import com.rapidphotoflow.domain.PhotoStatus;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class PhotoDTO {
    private UUID id;
    private String filename;
    private String mimeType;
    private long sizeBytes;
    private PhotoStatus status;
    private String failureReason;
    private Instant uploadedAt;
    private Instant updatedAt;
    private List<String> tags;
    private String uploadedByUsername;
    private UUID folderId;
    private String originalMimeType;
    private Boolean isChatGptCompatible;
    private Boolean wasConverted;
    private Boolean aiTaggingEnabled;
    private Boolean hasPreview;

    public static PhotoDTO fromEntity(Photo photo) {
        return PhotoDTO.builder()
                .id(photo.getId())
                .filename(photo.getFilename())
                .mimeType(photo.getMimeType())
                .sizeBytes(photo.getSizeBytes())
                .status(photo.getStatus())
                .failureReason(photo.getFailureReason())
                .uploadedAt(photo.getUploadedAt())
                .updatedAt(photo.getUpdatedAt())
                .tags(photo.getTags() != null ? new ArrayList<>(photo.getTags()) : new ArrayList<>())
                .uploadedByUsername(photo.getUploadedByUsername())
                .folderId(photo.getFolderId())
                .originalMimeType(photo.getOriginalMimeType())
                .isChatGptCompatible(photo.getIsChatGptCompatible())
                .wasConverted(photo.getWasConverted())
                .aiTaggingEnabled(photo.getAiTaggingEnabled())
                .hasPreview(photo.getHasPreview())
                .build();
    }
}
