package com.rapidphotoflow.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class PhotoListResponse {
    private List<PhotoDTO> items;
    private long total;
    private boolean hasMore;

    public static PhotoListResponse of(List<PhotoDTO> items) {
        return PhotoListResponse.builder()
                .items(items)
                .total(items.size())
                .hasMore(false)
                .build();
    }
}
