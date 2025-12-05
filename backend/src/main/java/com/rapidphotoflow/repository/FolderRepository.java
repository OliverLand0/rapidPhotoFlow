package com.rapidphotoflow.repository;

import com.rapidphotoflow.entity.FolderEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FolderRepository extends JpaRepository<FolderEntity, UUID> {

    List<FolderEntity> findByUserIdOrderByNameAsc(UUID userId);

    List<FolderEntity> findByUserIdAndParentIdOrderByNameAsc(UUID userId, UUID parentId);

    List<FolderEntity> findByUserIdAndParentIdIsNullOrderByNameAsc(UUID userId);

    Optional<FolderEntity> findByIdAndUserId(UUID id, UUID userId);

    Optional<FolderEntity> findByNameAndParentIdAndUserId(String name, UUID parentId, UUID userId);

    boolean existsByNameAndParentIdAndUserId(String name, UUID parentId, UUID userId);

    long countByParentId(UUID parentId);

    @Query("SELECT f FROM FolderEntity f WHERE f.userId = :userId AND f.parentId = :parentId")
    List<FolderEntity> findChildFolders(@Param("userId") UUID userId, @Param("parentId") UUID parentId);

    @Query("SELECT f FROM FolderEntity f WHERE f.userId = :userId AND f.parentId IS NULL")
    List<FolderEntity> findRootFolders(@Param("userId") UUID userId);
}
