package com.rapidphotoflow.domain;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class EventLog {
    private UUID id;
    private UUID photoId;
    private EventType type;
    private String message;
    private Instant timestamp;

    public static EventLog create(UUID photoId, EventType type, String message) {
        return EventLog.builder()
                .id(UUID.randomUUID())
                .photoId(photoId)
                .type(type)
                .message(message)
                .timestamp(Instant.now())
                .build();
    }
}
