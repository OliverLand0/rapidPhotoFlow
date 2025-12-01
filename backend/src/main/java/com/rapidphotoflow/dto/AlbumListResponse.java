package com.rapidphotoflow.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class AlbumListResponse {
    private List<AlbumDTO> items;
    private long total;

    public static AlbumListResponse of(List<AlbumDTO> items) {
        return AlbumListResponse.builder()
                .items(items)
                .total(items.size())
                .build();
    }
}
