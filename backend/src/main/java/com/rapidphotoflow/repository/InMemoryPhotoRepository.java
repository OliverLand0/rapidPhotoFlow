package com.rapidphotoflow.repository;

import com.rapidphotoflow.domain.Photo;
import com.rapidphotoflow.domain.PhotoStatus;
import org.springframework.stereotype.Repository;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Repository
public class InMemoryPhotoRepository {

    private final Map<UUID, Photo> photos = new ConcurrentHashMap<>();

    public Photo save(Photo photo) {
        photos.put(photo.getId(), photo);
        return photo;
    }

    public Optional<Photo> findById(UUID id) {
        return Optional.ofNullable(photos.get(id));
    }

    public List<Photo> findAll() {
        return new ArrayList<>(photos.values()).stream()
                .sorted(Comparator.comparing(Photo::getUploadedAt).reversed())
                .collect(Collectors.toList());
    }

    public List<Photo> findByStatus(PhotoStatus status) {
        return photos.values().stream()
                .filter(photo -> photo.getStatus() == status)
                .sorted(Comparator.comparing(Photo::getUploadedAt))
                .collect(Collectors.toList());
    }

    public List<Photo> findByStatusIn(List<PhotoStatus> statuses) {
        return photos.values().stream()
                .filter(photo -> statuses.contains(photo.getStatus()))
                .sorted(Comparator.comparing(Photo::getUploadedAt).reversed())
                .collect(Collectors.toList());
    }

    public long count() {
        return photos.size();
    }

    public long countByStatus(PhotoStatus status) {
        return photos.values().stream()
                .filter(photo -> photo.getStatus() == status)
                .count();
    }

    public void deleteById(UUID id) {
        photos.remove(id);
    }

    public void deleteAll() {
        photos.clear();
    }
}
