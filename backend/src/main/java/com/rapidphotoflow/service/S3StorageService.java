package com.rapidphotoflow.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;

import java.io.IOException;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class S3StorageService {

    private final S3Client s3Client;

    @Value("${aws.s3.bucket.photos:}")
    private String photoBucket;

    public String uploadPhoto(UUID photoId, byte[] content, String contentType) {
        String key = "photos/" + photoId.toString();

        try {
            PutObjectRequest request = PutObjectRequest.builder()
                    .bucket(photoBucket)
                    .key(key)
                    .contentType(contentType)
                    .build();

            s3Client.putObject(request, RequestBody.fromBytes(content));
            log.info("Uploaded photo to S3: {}/{}", photoBucket, key);
            return key;
        } catch (Exception e) {
            log.error("Failed to upload photo to S3: {}", photoId, e);
            throw new RuntimeException("Failed to upload photo to S3", e);
        }
    }

    public byte[] downloadPhoto(UUID photoId) {
        String key = "photos/" + photoId.toString();

        try {
            GetObjectRequest request = GetObjectRequest.builder()
                    .bucket(photoBucket)
                    .key(key)
                    .build();

            return s3Client.getObjectAsBytes(request).asByteArray();
        } catch (NoSuchKeyException e) {
            log.warn("Photo not found in S3: {}", key);
            return null;
        } catch (Exception e) {
            log.error("Failed to download photo from S3: {}", photoId, e);
            throw new RuntimeException("Failed to download photo from S3", e);
        }
    }

    public void deletePhoto(UUID photoId) {
        String key = "photos/" + photoId.toString();

        try {
            DeleteObjectRequest request = DeleteObjectRequest.builder()
                    .bucket(photoBucket)
                    .key(key)
                    .build();

            s3Client.deleteObject(request);
            log.info("Deleted photo from S3: {}/{}", photoBucket, key);
        } catch (Exception e) {
            log.error("Failed to delete photo from S3: {}", photoId, e);
            // Don't throw - photo might already be deleted
        }
    }

    public String getPhotoUrl(UUID photoId) {
        return String.format("https://%s.s3.amazonaws.com/photos/%s", photoBucket, photoId.toString());
    }

    public String uploadPreview(UUID photoId, byte[] content) {
        String key = "previews/" + photoId.toString();

        try {
            PutObjectRequest request = PutObjectRequest.builder()
                    .bucket(photoBucket)
                    .key(key)
                    .contentType("image/jpeg")
                    .build();

            s3Client.putObject(request, RequestBody.fromBytes(content));
            log.info("Uploaded preview to S3: {}/{}", photoBucket, key);
            return key;
        } catch (Exception e) {
            log.error("Failed to upload preview to S3: {}", photoId, e);
            throw new RuntimeException("Failed to upload preview to S3", e);
        }
    }

    public byte[] downloadPreview(UUID photoId) {
        String key = "previews/" + photoId.toString();

        try {
            GetObjectRequest request = GetObjectRequest.builder()
                    .bucket(photoBucket)
                    .key(key)
                    .build();

            return s3Client.getObjectAsBytes(request).asByteArray();
        } catch (NoSuchKeyException e) {
            log.warn("Preview not found in S3: {}", key);
            return null;
        } catch (Exception e) {
            log.error("Failed to download preview from S3: {}", photoId, e);
            return null;
        }
    }

    public void deletePreview(UUID photoId) {
        String key = "previews/" + photoId.toString();

        try {
            DeleteObjectRequest request = DeleteObjectRequest.builder()
                    .bucket(photoBucket)
                    .key(key)
                    .build();

            s3Client.deleteObject(request);
            log.info("Deleted preview from S3: {}/{}", photoBucket, key);
        } catch (Exception e) {
            log.error("Failed to delete preview from S3: {}", photoId, e);
        }
    }
}
