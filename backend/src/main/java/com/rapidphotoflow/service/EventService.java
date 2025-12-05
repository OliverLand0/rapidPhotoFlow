package com.rapidphotoflow.service;

import com.rapidphotoflow.domain.EventLog;
import com.rapidphotoflow.domain.EventType;
import com.rapidphotoflow.entity.EventLogEntity;
import com.rapidphotoflow.repository.EventLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class EventService {

    private final EventLogRepository eventLogRepository;
    private final CurrentUserService currentUserService;

    @Transactional
    public EventLog logEvent(UUID photoId, EventType type, String message) {
        UUID userId = null;
        try {
            userId = currentUserService.getCurrentUserId();
        } catch (Exception e) {
            // User context may not be available (e.g., background jobs)
            log.debug("Could not get current user for event logging: {}", e.getMessage());
        }
        return logEvent(photoId, type, message, userId);
    }

    @Transactional
    public EventLog logEvent(UUID photoId, EventType type, String message, UUID userId) {
        EventLogEntity entity = EventLogEntity.builder()
                .photoId(photoId)
                .eventType(type)
                .message(message)
                .userId(userId)
                .timestamp(Instant.now())
                .build();

        eventLogRepository.save(entity);
        log.debug("Event logged: {} - {} - {} (user: {})", photoId, type, message, userId);

        return entityToEventLog(entity);
    }

    public List<EventLog> getAllEvents() {
        return eventLogRepository.findAllByOrderByTimestampDesc().stream()
                .map(this::entityToEventLog)
                .collect(Collectors.toList());
    }

    public List<EventLog> getEventsByPhotoId(UUID photoId) {
        return eventLogRepository.findByPhotoIdOrderByTimestampDesc(photoId).stream()
                .map(this::entityToEventLog)
                .collect(Collectors.toList());
    }

    public List<EventLog> getEventsByType(EventType type) {
        return eventLogRepository.findByEventTypeOrderByTimestampDesc(type).stream()
                .map(this::entityToEventLog)
                .collect(Collectors.toList());
    }

    public List<EventLog> getRecentEvents(int limit) {
        return eventLogRepository.findAllByOrderByTimestampDesc().stream()
                .limit(limit)
                .map(this::entityToEventLog)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteByPhotoId(UUID photoId) {
        eventLogRepository.deleteByPhotoId(photoId);
    }

    private EventLog entityToEventLog(EventLogEntity entity) {
        return EventLog.builder()
                .id(entity.getId())
                .photoId(entity.getPhotoId())
                .type(entity.getEventType())
                .message(entity.getMessage())
                .timestamp(entity.getTimestamp())
                .build();
    }
}
