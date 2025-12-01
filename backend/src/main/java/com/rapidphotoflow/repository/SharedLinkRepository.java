package com.rapidphotoflow.repository;

import com.rapidphotoflow.entity.SharedLinkEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SharedLinkRepository extends JpaRepository<SharedLinkEntity, UUID> {

    Optional<SharedLinkEntity> findByToken(String token);

    List<SharedLinkEntity> findByCreatedByUserIdOrderByCreatedAtDesc(UUID userId);

    List<SharedLinkEntity> findByCreatedByUserIdAndIsActiveOrderByCreatedAtDesc(UUID userId, Boolean isActive);

    List<SharedLinkEntity> findByPhotoId(UUID photoId);

    List<SharedLinkEntity> findByAlbumId(UUID albumId);

    List<SharedLinkEntity> findByFolderId(UUID folderId);

    Optional<SharedLinkEntity> findByIdAndCreatedByUserId(UUID id, UUID userId);

    boolean existsByToken(String token);

    long countByCreatedByUserId(UUID userId);

    long countByCreatedByUserIdAndIsActive(UUID userId, Boolean isActive);

    @Modifying
    @Query("UPDATE SharedLinkEntity s SET s.viewCount = s.viewCount + 1, s.lastAccessedAt = CURRENT_TIMESTAMP WHERE s.id = :id")
    void incrementViewCount(@Param("id") UUID id);

    @Modifying
    @Query("UPDATE SharedLinkEntity s SET s.downloadCount = s.downloadCount + 1, s.lastAccessedAt = CURRENT_TIMESTAMP WHERE s.id = :id")
    void incrementDownloadCount(@Param("id") UUID id);
}
