package com.rapidphotoflow.repository;

import com.rapidphotoflow.domain.EventType;
import com.rapidphotoflow.entity.EventLogEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface EventLogRepository extends JpaRepository<EventLogEntity, UUID> {

    List<EventLogEntity> findByPhotoIdOrderByTimestampDesc(UUID photoId);

    List<EventLogEntity> findAllByOrderByTimestampDesc();

    List<EventLogEntity> findByEventTypeOrderByTimestampDesc(EventType eventType);

    void deleteByPhotoId(UUID photoId);
}
