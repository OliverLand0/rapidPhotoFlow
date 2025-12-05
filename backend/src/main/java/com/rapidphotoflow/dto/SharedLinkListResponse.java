package com.rapidphotoflow.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SharedLinkListResponse {
    private List<SharedLinkDTO> items;
    private int total;

    public static SharedLinkListResponse of(List<SharedLinkDTO> items) {
        return SharedLinkListResponse.builder()
                .items(items)
                .total(items.size())
                .build();
    }
}
