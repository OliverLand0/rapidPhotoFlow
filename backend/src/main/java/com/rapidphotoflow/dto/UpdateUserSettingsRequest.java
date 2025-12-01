package com.rapidphotoflow.dto;

import com.rapidphotoflow.domain.UserRole;
import com.rapidphotoflow.domain.UserStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateUserSettingsRequest {

    private UserRole role;
    private UserStatus status;
    private Long maxStorageBytes;
    private Integer maxPhotos;
    private Boolean aiTaggingEnabled;
    private String accountNotes;
}
