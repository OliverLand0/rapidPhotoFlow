package com.rapidphotoflow.controller;

import com.rapidphotoflow.domain.EventType;
import com.rapidphotoflow.dto.EventDTO;
import com.rapidphotoflow.dto.EventListResponse;
import com.rapidphotoflow.service.EventService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
@Tag(name = "Events", description = "Event log endpoints")
public class EventController {

    private final EventService eventService;

    @GetMapping
    @Operation(summary = "Get events", description = "Retrieve events with optional filters")
    public ResponseEntity<EventListResponse> getEvents(
            @RequestParam(required = false) UUID photoId,
            @RequestParam(required = false) EventType type,
            @RequestParam(required = false, defaultValue = "50") int limit) {

        List<EventDTO> events;

        if (photoId != null) {
            events = eventService.getEventsByPhotoId(photoId).stream()
                    .map(EventDTO::fromEntity)
                    .collect(Collectors.toList());
        } else if (type != null) {
            events = eventService.getEventsByType(type).stream()
                    .map(EventDTO::fromEntity)
                    .collect(Collectors.toList());
        } else {
            events = eventService.getRecentEvents(limit).stream()
                    .map(EventDTO::fromEntity)
                    .collect(Collectors.toList());
        }

        return ResponseEntity.ok(EventListResponse.of(events));
    }
}
