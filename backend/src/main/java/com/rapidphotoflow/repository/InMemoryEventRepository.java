package com.rapidphotoflow.repository;

import com.rapidphotoflow.domain.EventLog;
import com.rapidphotoflow.domain.EventType;
import org.springframework.stereotype.Repository;

import java.util.*;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.stream.Collectors;

@Repository
public class InMemoryEventRepository {

    private final List<EventLog> events = new CopyOnWriteArrayList<>();

    public EventLog save(EventLog event) {
        events.add(event);
        return event;
    }

    public List<EventLog> findAll() {
        return events.stream()
                .sorted(Comparator.comparing(EventLog::getTimestamp).reversed())
                .collect(Collectors.toList());
    }

    public List<EventLog> findByPhotoId(UUID photoId) {
        return events.stream()
                .filter(event -> event.getPhotoId().equals(photoId))
                .sorted(Comparator.comparing(EventLog::getTimestamp).reversed())
                .collect(Collectors.toList());
    }

    public List<EventLog> findByType(EventType type) {
        return events.stream()
                .filter(event -> event.getType() == type)
                .sorted(Comparator.comparing(EventLog::getTimestamp).reversed())
                .collect(Collectors.toList());
    }

    public List<EventLog> findRecent(int limit) {
        return events.stream()
                .sorted(Comparator.comparing(EventLog::getTimestamp).reversed())
                .limit(limit)
                .collect(Collectors.toList());
    }

    public void deleteAll() {
        events.clear();
    }
}
