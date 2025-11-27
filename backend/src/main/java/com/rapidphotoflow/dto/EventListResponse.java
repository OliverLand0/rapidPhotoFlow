package com.rapidphotoflow.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class EventListResponse {
    private List<EventDTO> items;

    public static EventListResponse of(List<EventDTO> items) {
        return EventListResponse.builder()
                .items(items)
                .build();
    }
}
