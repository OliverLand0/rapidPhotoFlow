package com.rapidphotoflow.repository;

import com.rapidphotoflow.entity.AlbumEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AlbumRepository extends JpaRepository<AlbumEntity, UUID> {

    List<AlbumEntity> findByUserIdOrderByNameAsc(UUID userId);

    List<AlbumEntity> findByUserIdOrderByCreatedAtDesc(UUID userId);

    Optional<AlbumEntity> findByIdAndUserId(UUID id, UUID userId);

    Optional<AlbumEntity> findByNameAndUserId(String name, UUID userId);

    boolean existsByNameAndUserId(String name, UUID userId);

    long countByUserId(UUID userId);
}
