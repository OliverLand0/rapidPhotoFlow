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

    // User usage statistics - count AUTO_TAGGED events for photos uploaded by a user
    @Query("SELECT COUNT(e) FROM EventLogEntity e JOIN PhotoEntity p ON e.photoId = p.id " +
           "WHERE p.uploadedByUserId = :userId AND e.eventType = 'AUTO_TAGGED'")
    long countAutoTagEventsByUserId(@Param("userId") UUID userId);
}
