package com.rapidphotoflow.service;

import lombok.Builder;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Set;

/**
 * Service for converting image formats to ensure ChatGPT API compatibility for AI tagging.
 * ChatGPT Vision API supports: JPEG, PNG, WebP, GIF
 */
@Service
@Slf4j
public class ImageConversionService {

    // Formats that ChatGPT Vision API supports
    private static final Set<String> CHATGPT_COMPATIBLE_TYPES = Set.of(
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/webp",
            "image/gif"
    );

    // Formats we can convert from (using TwelveMonkeys ImageIO)
    private static final Set<String> CONVERTIBLE_TYPES = Set.of(
            "image/tiff",
            "image/x-tiff",
            "image/bmp",
            "image/x-bmp",
            "image/x-ms-bmp"
    );

    // Note: HEIC/HEIF support requires native libheif library
    // These are detected but conversion will fail without native support
    private static final Set<String> HEIC_TYPES = Set.of(
            "image/heic",
            "image/heif",
            "image/heic-sequence",
            "image/heif-sequence"
    );

    private static final long MAX_INPUT_SIZE_BYTES = 50 * 1024 * 1024; // 50MB

    /**
     * Check if a MIME type is compatible with ChatGPT Vision API
     */
    public boolean isChatGptCompatible(String mimeType) {
        if (mimeType == null) {
            return false;
        }
        return CHATGPT_COMPATIBLE_TYPES.contains(mimeType.toLowerCase());
    }

    /**
     * Check if a MIME type can be converted to a compatible format
     */
    public boolean isConvertible(String mimeType) {
        if (mimeType == null) {
            return false;
        }
        String lowerMime = mimeType.toLowerCase();
        return CONVERTIBLE_TYPES.contains(lowerMime) || HEIC_TYPES.contains(lowerMime);
    }

    /**
     * Check if this is a HEIC/HEIF format that requires native library support
     */
    public boolean isHeicFormat(String mimeType) {
        if (mimeType == null) {
            return false;
        }
        return HEIC_TYPES.contains(mimeType.toLowerCase());
    }

    /**
     * Convert an image to JPEG format for ChatGPT compatibility
     *
     * @param imageData       Original image bytes
     * @param originalMimeType Original MIME type
     * @return ConversionResult with converted data or error info
     */
    public ConversionResult convert(byte[] imageData, String originalMimeType) {
        if (imageData == null || imageData.length == 0) {
            return ConversionResult.builder()
                    .success(false)
                    .errorMessage("No image data provided")
                    .build();
        }

        if (imageData.length > MAX_INPUT_SIZE_BYTES) {
            return ConversionResult.builder()
                    .success(false)
                    .errorMessage("Image exceeds maximum size of 50MB")
                    .build();
        }

        // Check if already compatible
        if (isChatGptCompatible(originalMimeType)) {
            return ConversionResult.builder()
                    .success(true)
                    .data(imageData)
                    .newMimeType(originalMimeType)
                    .newExtension(getExtensionForMimeType(originalMimeType))
                    .build();
        }

        // HEIC requires native library - check if we can read it
        if (isHeicFormat(originalMimeType)) {
            log.warn("HEIC/HEIF format detected. Native libheif library required for conversion.");
            return ConversionResult.builder()
                    .success(false)
                    .errorMessage("HEIC/HEIF conversion requires native library support (libheif)")
                    .build();
        }

        // Try to convert using ImageIO
        try {
            BufferedImage image = ImageIO.read(new ByteArrayInputStream(imageData));

            if (image == null) {
                log.warn("Could not read image with MIME type: {}", originalMimeType);
                return ConversionResult.builder()
                        .success(false)
                        .errorMessage("Could not read image format: " + originalMimeType)
                        .build();
            }

            // Check for alpha channel - use PNG to preserve transparency, otherwise JPEG
            boolean hasAlpha = image.getColorModel().hasAlpha();
            String targetFormat = hasAlpha ? "png" : "jpg";
            String targetMimeType = hasAlpha ? "image/png" : "image/jpeg";

            // Convert to RGB if necessary (JPEG doesn't support alpha)
            BufferedImage outputImage = image;
            if (!hasAlpha && image.getType() != BufferedImage.TYPE_INT_RGB) {
                outputImage = new BufferedImage(
                        image.getWidth(),
                        image.getHeight(),
                        BufferedImage.TYPE_INT_RGB
                );
                outputImage.createGraphics().drawImage(image, 0, 0, null);
            }

            // Write to output format
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            boolean written = ImageIO.write(outputImage, targetFormat, outputStream);

            if (!written) {
                log.error("Failed to write image in {} format", targetFormat);
                return ConversionResult.builder()
                        .success(false)
                        .errorMessage("Failed to convert image to " + targetFormat)
                        .build();
            }

            byte[] convertedData = outputStream.toByteArray();
            log.info("Successfully converted image from {} to {} ({} bytes -> {} bytes)",
                    originalMimeType, targetMimeType, imageData.length, convertedData.length);

            return ConversionResult.builder()
                    .success(true)
                    .data(convertedData)
                    .newMimeType(targetMimeType)
                    .newExtension(targetFormat.equals("jpg") ? "jpg" : "png")
                    .build();

        } catch (IOException e) {
            log.error("Error converting image from {}: {}", originalMimeType, e.getMessage());
            return ConversionResult.builder()
                    .success(false)
                    .errorMessage("Conversion error: " + e.getMessage())
                    .build();
        }
    }

    private String getExtensionForMimeType(String mimeType) {
        if (mimeType == null) return "bin";
        return switch (mimeType.toLowerCase()) {
            case "image/jpeg", "image/jpg" -> "jpg";
            case "image/png" -> "png";
            case "image/webp" -> "webp";
            case "image/gif" -> "gif";
            case "image/tiff", "image/x-tiff" -> "tiff";
            case "image/bmp", "image/x-bmp", "image/x-ms-bmp" -> "bmp";
            case "image/heic", "image/heif" -> "heic";
            default -> "bin";
        };
    }

    /**
     * Result of an image conversion attempt
     */
    @Data
    @Builder
    public static class ConversionResult {
        private boolean success;
        private byte[] data;
        private String newMimeType;
        private String newExtension;
        private String errorMessage;
    }
}
