package com.rapidphotoflow.repository;

import com.rapidphotoflow.entity.AlbumPhotoEntity;
import com.rapidphotoflow.entity.AlbumPhotoId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AlbumPhotoRepository extends JpaRepository<AlbumPhotoEntity, AlbumPhotoId> {

    List<AlbumPhotoEntity> findByAlbumIdOrderByAddedAtDesc(UUID albumId);

    List<AlbumPhotoEntity> findByPhotoId(UUID photoId);

    long countByAlbumId(UUID albumId);

    void deleteByAlbumId(UUID albumId);

    void deleteByPhotoId(UUID photoId);

    void deleteByAlbumIdAndPhotoId(UUID albumId, UUID photoId);

    boolean existsByAlbumIdAndPhotoId(UUID albumId, UUID photoId);

    @Query("SELECT ap.photoId FROM AlbumPhotoEntity ap WHERE ap.albumId = :albumId ORDER BY ap.addedAt DESC")
    List<UUID> findPhotoIdsByAlbumId(@Param("albumId") UUID albumId);

    @Query("SELECT ap.albumId FROM AlbumPhotoEntity ap WHERE ap.photoId = :photoId")
    List<UUID> findAlbumIdsByPhotoId(@Param("photoId") UUID photoId);
}
