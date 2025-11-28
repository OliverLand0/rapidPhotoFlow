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

    @Transactional
    public EventLog logEvent(UUID photoId, EventType type, String message) {
        EventLogEntity entity = EventLogEntity.builder()
                .photoId(photoId)
                .eventType(type)
                .message(message)
                .timestamp(Instant.now())
                .build();

        eventLogRepository.save(entity);
        log.debug("Event logged: {} - {} - {}", photoId, type, message);

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
