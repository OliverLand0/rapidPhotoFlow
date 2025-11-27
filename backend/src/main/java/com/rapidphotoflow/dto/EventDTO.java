package com.rapidphotoflow.dto;

import com.rapidphotoflow.domain.EventLog;
import com.rapidphotoflow.domain.EventType;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class EventDTO {
    private UUID id;
    private UUID photoId;
    private EventType type;
    private String message;
    private Instant timestamp;

    public static EventDTO fromEntity(EventLog event) {
        return EventDTO.builder()
                .id(event.getId())
                .photoId(event.getPhotoId())
                .type(event.getType())
                .message(event.getMessage())
                .timestamp(event.getTimestamp())
                .build();
    }
}
