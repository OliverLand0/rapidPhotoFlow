package com.rapidphotoflow.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PublicPhotoDTO {
    private UUID id;
    private String filename;
    private String mimeType;
    private String photoUrl;
    private String thumbnailUrl;

    public static PublicPhotoDTO create(UUID id, String filename, String mimeType, String shareToken) {
        return PublicPhotoDTO.builder()
                .id(id)
                .filename(filename)
                .mimeType(mimeType)
                .photoUrl("/s/" + shareToken + "/photos/" + id)
                .thumbnailUrl("/s/" + shareToken + "/photos/" + id)
                .build();
    }
}
