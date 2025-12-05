package com.rapidphotoflow.repository;

import com.rapidphotoflow.domain.EventType;
import com.rapidphotoflow.entity.EventLogEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface EventLogRepository extends JpaRepository<EventLogEntity, UUID> {

    List<EventLogEntity> findByPhotoIdOrderByTimestampDesc(UUID photoId);

    List<EventLogEntity> findAllByOrderByTimestampDesc();

    List<EventLogEntity> findByEventTypeOrderByTimestampDesc(EventType eventType);

    void deleteByPhotoId(UUID photoId);

    // User usage statistics - count TAG_ADDED events directly by userId
    // This counts ALL tagging events historically, not just for existing photos
    @Query("SELECT COUNT(e) FROM EventLogEntity e " +
           "WHERE e.userId = :userId AND e.eventType = 'TAG_ADDED'")
    long countAutoTagEventsByUserId(@Param("userId") UUID userId);
}
