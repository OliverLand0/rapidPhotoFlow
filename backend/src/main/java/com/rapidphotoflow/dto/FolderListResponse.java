package com.rapidphotoflow.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class FolderListResponse {
    private List<FolderDTO> items;
    private long total;

    public static FolderListResponse of(List<FolderDTO> items) {
        return FolderListResponse.builder()
                .items(items)
                .total(items.size())
                .build();
    }
}
