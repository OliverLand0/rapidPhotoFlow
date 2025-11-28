package com.rapidphotoflow.repository;

import com.rapidphotoflow.domain.PhotoStatus;
import com.rapidphotoflow.entity.PhotoEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PhotoRepository extends JpaRepository<PhotoEntity, UUID> {

    List<PhotoEntity> findByStatusOrderByUploadedAtDesc(PhotoStatus status);

    List<PhotoEntity> findByStatusInOrderByUploadedAtDesc(List<PhotoStatus> statuses);

    List<PhotoEntity> findAllByOrderByUploadedAtDesc();

    long countByStatus(PhotoStatus status);

    @Query("SELECT p FROM PhotoEntity p WHERE :tag MEMBER OF p.tags")
    List<PhotoEntity> findByTag(String tag);

    List<PhotoEntity> findByContentHash(String contentHash);
}
