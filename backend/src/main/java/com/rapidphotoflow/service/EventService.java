package com.rapidphotoflow.service;

import com.rapidphotoflow.domain.EventLog;
import com.rapidphotoflow.domain.EventType;
import com.rapidphotoflow.repository.InMemoryEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class EventService {

    private final InMemoryEventRepository eventRepository;

    public EventLog logEvent(UUID photoId, EventType type, String message) {
        EventLog event = EventLog.create(photoId, type, message);
        eventRepository.save(event);
        log.debug("Event logged: {} - {} - {}", photoId, type, message);
        return event;
    }

    public List<EventLog> getAllEvents() {
        return eventRepository.findAll();
    }

    public List<EventLog> getEventsByPhotoId(UUID photoId) {
        return eventRepository.findByPhotoId(photoId);
    }

    public List<EventLog> getEventsByType(EventType type) {
        return eventRepository.findByType(type);
    }

    public List<EventLog> getRecentEvents(int limit) {
        return eventRepository.findRecent(limit);
    }
}
