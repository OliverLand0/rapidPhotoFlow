package com.rapidphotoflow.repository;

import com.rapidphotoflow.domain.PhotoStatus;
import com.rapidphotoflow.entity.PhotoEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface PhotoRepository extends JpaRepository<PhotoEntity, UUID> {

    List<PhotoEntity> findByStatusOrderByUploadedAtDesc(PhotoStatus status);

    List<PhotoEntity> findByStatusInOrderByUploadedAtDesc(List<PhotoStatus> statuses);

    List<PhotoEntity> findAllByOrderByUploadedAtDesc();

    long countByStatus(PhotoStatus status);

    // Folder-related queries
    List<PhotoEntity> findByFolderIdOrderByUploadedAtDesc(UUID folderId);

    List<PhotoEntity> findByFolderIdIsNullOrderByUploadedAtDesc();

    List<PhotoEntity> findByFolderId(UUID folderId);

    long countByFolderId(UUID folderId);

    long countByFolderIdIsNull();

    // Combined filters
    List<PhotoEntity> findByFolderIdAndStatusOrderByUploadedAtDesc(UUID folderId, PhotoStatus status);

    List<PhotoEntity> findByFolderIdIsNullAndStatusOrderByUploadedAtDesc(PhotoStatus status);

    // User-specific queries
    List<PhotoEntity> findByUploadedByUserIdOrderByUploadedAtDesc(UUID userId);

    List<PhotoEntity> findByUploadedByUserIdAndFolderIdOrderByUploadedAtDesc(UUID userId, UUID folderId);

    List<PhotoEntity> findByUploadedByUserIdAndFolderIdIsNullOrderByUploadedAtDesc(UUID userId);

    // User usage statistics queries
    long countByUploadedByUserId(UUID userId);

    @Query("SELECT COALESCE(SUM(p.sizeBytes), 0) FROM PhotoEntity p WHERE p.uploadedByUserId = :userId")
    long sumSizeBytesByUploadedByUserId(@Param("userId") UUID userId);

    @Query("SELECT MAX(p.uploadedAt) FROM PhotoEntity p WHERE p.uploadedByUserId = :userId")
    Instant findLastUploadTimeByUserId(@Param("userId") UUID userId);

    // System-wide statistics for admin dashboard
    @Query("SELECT COALESCE(SUM(p.sizeBytes), 0) FROM PhotoEntity p")
    long sumAllSizeBytes();

    long countByUploadedAtAfter(Instant after);
}
