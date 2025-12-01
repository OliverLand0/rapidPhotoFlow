package com.rapidphotoflow.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.rapidphotoflow.entity.PhotoEntity;
import com.rapidphotoflow.repository.PhotoRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@Slf4j
public class AiTaggingService {

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;
    private final String aiServiceUrl;
    private final PhotoRepository photoRepository;

    public AiTaggingService(
            @Value("${ai.service.url:http://localhost:3001}") String aiServiceUrl,
            PhotoRepository photoRepository) {
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
        this.objectMapper = new ObjectMapper();
        this.aiServiceUrl = aiServiceUrl;
        this.photoRepository = photoRepository;
    }

    /**
     * Check if the AI service is available
     */
    public boolean isAvailable() {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(aiServiceUrl + "/health"))
                    .timeout(Duration.ofSeconds(5))
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            return response.statusCode() == 200;
        } catch (Exception e) {
            log.debug("AI service not available: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Check if AI tagging is available for a specific photo.
     * Returns true if the photo exists and is stored in a ChatGPT-compatible format.
     */
    public boolean isAiTaggingAvailable(UUID photoId) {
        return photoRepository.findById(photoId)
                .map(photo -> Boolean.TRUE.equals(photo.getAiTaggingEnabled()) &&
                              Boolean.TRUE.equals(photo.getIsChatGptCompatible()))
                .orElse(false);
    }

    /**
     * Request auto-tagging for a photo from the AI service.
     * Returns the list of tags that were applied.
     * Throws IllegalStateException if the photo is not compatible with AI tagging.
     */
    public List<String> autoTagPhoto(UUID photoId) {
        // Check if AI tagging is enabled for this photo
        PhotoEntity photo = photoRepository.findById(photoId)
                .orElseThrow(() -> new IllegalArgumentException("Photo not found: " + photoId));

        if (!Boolean.TRUE.equals(photo.getAiTaggingEnabled()) ||
            !Boolean.TRUE.equals(photo.getIsChatGptCompatible())) {
            throw new IllegalStateException(
                    "AI tagging unavailable: image not stored in a ChatGPT-compatible format. " +
                    "Re-upload with conversion enabled or upload a compatible format (JPEG, PNG, WebP, GIF).");
        }

        try {
            String requestBody = objectMapper.writeValueAsString(
                    java.util.Map.of("photoId", photoId.toString())
            );

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(aiServiceUrl + "/api/analyze-and-apply"))
                    .timeout(Duration.ofSeconds(30))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                JsonNode jsonResponse = objectMapper.readTree(response.body());

                if (jsonResponse.has("success") && jsonResponse.get("success").asBoolean()) {
                    List<String> tags = new ArrayList<>();
                    JsonNode tagsNode = jsonResponse.get("tags");
                    if (tagsNode != null && tagsNode.isArray()) {
                        for (JsonNode tag : tagsNode) {
                            tags.add(tag.asText());
                        }
                    }
                    log.info("Auto-tagged photo {} with {} tags: {}",
                            photoId, tags.size(), String.join(", ", tags));
                    return tags;
                } else {
                    String error = jsonResponse.has("error") ? jsonResponse.get("error").asText() : "Unknown error";
                    log.warn("AI tagging failed for photo {}: {}", photoId, error);
                }
            } else {
                log.warn("AI service returned status {} for photo {}", response.statusCode(), photoId);
            }
        } catch (Exception e) {
            log.error("Error calling AI service for photo {}: {}", photoId, e.getMessage());
        }

        return List.of();
    }
}
