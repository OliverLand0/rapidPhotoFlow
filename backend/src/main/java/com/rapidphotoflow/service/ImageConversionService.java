package com.rapidphotoflow.service;

import com.rapidphotoflow.service.conversion.*;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
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
 *
 * Supports conversion from:
 * - TIFF, BMP (via TwelveMonkeys ImageIO)
 * - ICO, PSD (via TwelveMonkeys ImageIO)
 * - SVG (via Apache Batik)
 * - HEIC/HEIF (via native libheif)
 * - RAW formats: CR2, CR3, NEF, ARW, DNG, ORF, RAF, RW2 (via native dcraw/LibRaw)
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class ImageConversionService {

    private final HeicConverter heicConverter;
    private final RawConverter rawConverter;
    private final SvgConverter svgConverter;
    private final NativeLibraryDetector nativeLibraryDetector;

    // Formats that ChatGPT Vision API supports
    private static final Set<String> CHATGPT_COMPATIBLE_TYPES = Set.of(
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/webp",
            "image/gif"
    );

    // Formats we can convert using pure Java (TwelveMonkeys ImageIO)
    private static final Set<String> IMAGEIO_CONVERTIBLE_TYPES = Set.of(
            "image/tiff",
            "image/x-tiff",
            "image/bmp",
            "image/x-bmp",
            "image/x-ms-bmp",
            "image/x-icon",
            "image/vnd.microsoft.icon",
            "image/vnd.adobe.photoshop",
            "application/x-photoshop"
    );

    // HEIC/HEIF formats (require native libheif)
    private static final Set<String> HEIC_TYPES = Set.of(
            "image/heic",
            "image/heif",
            "image/heic-sequence",
            "image/heif-sequence"
    );

    // RAW camera formats (require native dcraw/LibRaw)
    private static final Set<String> RAW_TYPES = Set.of(
            "image/x-canon-cr2",
            "image/x-canon-cr3",
            "image/x-nikon-nef",
            "image/x-sony-arw",
            "image/x-adobe-dng",
            "image/x-olympus-orf",
            "image/x-fuji-raf",
            "image/x-panasonic-rw2",
            "image/x-dcraw"
    );

    // SVG format (converted via Batik)
    private static final Set<String> SVG_TYPES = Set.of(
            "image/svg+xml"
    );

    private static final long MAX_INPUT_SIZE_BYTES = 150 * 1024 * 1024; // 150MB

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
        return IMAGEIO_CONVERTIBLE_TYPES.contains(lowerMime)
                || HEIC_TYPES.contains(lowerMime)
                || RAW_TYPES.contains(lowerMime)
                || SVG_TYPES.contains(lowerMime);
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
     * Check if this is a RAW camera format
     */
    public boolean isRawFormat(String mimeType) {
        if (mimeType == null) {
            return false;
        }
        return RAW_TYPES.contains(mimeType.toLowerCase());
    }

    /**
     * Check if this is an SVG format
     */
    public boolean isSvgFormat(String mimeType) {
        if (mimeType == null) {
            return false;
        }
        return SVG_TYPES.contains(mimeType.toLowerCase());
    }

    /**
     * Convert an image to JPEG/PNG format for ChatGPT compatibility
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
                    .errorMessage("Image exceeds maximum size of 150MB")
                    .build();
        }

        String lowerMime = originalMimeType != null ? originalMimeType.toLowerCase() : "";

        // Check if already compatible
        if (isChatGptCompatible(originalMimeType)) {
            return ConversionResult.builder()
                    .success(true)
                    .data(imageData)
                    .newMimeType(originalMimeType)
                    .newExtension(getExtensionForMimeType(originalMimeType))
                    .build();
        }

        // Route to appropriate converter based on format

        // HEIC/HEIF - use native heif-convert
        if (isHeicFormat(originalMimeType)) {
            return convertHeic(imageData);
        }

        // RAW formats - use native dcraw/LibRaw
        if (isRawFormat(originalMimeType)) {
            return convertRaw(imageData, originalMimeType);
        }

        // SVG - use Batik
        if (isSvgFormat(originalMimeType)) {
            return convertSvg(imageData);
        }

        // All other formats - use ImageIO (TIFF, BMP, ICO, PSD)
        return convertViaImageIO(imageData, originalMimeType);
    }

    /**
     * Convert HEIC/HEIF using native heif-convert
     */
    private ConversionResult convertHeic(byte[] imageData) {
        if (!heicConverter.isAvailable()) {
            log.warn("HEIC/HEIF format detected. Native libheif library not available.");
            return ConversionResult.builder()
                    .success(false)
                    .errorMessage("HEIC/HEIF conversion requires native library support (libheif). " +
                            "Install libheif-tools for iPhone photo support.")
                    .build();
        }

        try {
            byte[] jpegData = heicConverter.convertToJpeg(imageData);
            return ConversionResult.builder()
                    .success(true)
                    .data(jpegData)
                    .newMimeType(heicConverter.getOutputMimeType())
                    .newExtension(heicConverter.getOutputExtension())
                    .build();
        } catch (ConversionException e) {
            log.error("HEIC conversion failed: {}", e.getMessage());
            return ConversionResult.builder()
                    .success(false)
                    .errorMessage("HEIC conversion failed: " + e.getMessage())
                    .build();
        }
    }

    /**
     * Convert RAW camera formats using native dcraw/LibRaw
     */
    private ConversionResult convertRaw(byte[] imageData, String mimeType) {
        if (!rawConverter.isAvailable()) {
            log.warn("RAW format detected. Native dcraw/LibRaw not available.");
            return ConversionResult.builder()
                    .success(false)
                    .errorMessage("RAW format conversion requires native library support (dcraw/LibRaw). " +
                            "Install libraw for camera RAW support.")
                    .build();
        }

        try {
            byte[] jpegData = rawConverter.convertToJpeg(imageData, mimeType);
            return ConversionResult.builder()
                    .success(true)
                    .data(jpegData)
                    .newMimeType(rawConverter.getOutputMimeType())
                    .newExtension(rawConverter.getOutputExtension())
                    .build();
        } catch (ConversionException e) {
            log.error("RAW conversion failed: {}", e.getMessage());
            return ConversionResult.builder()
                    .success(false)
                    .errorMessage("RAW conversion failed: " + e.getMessage())
                    .build();
        }
    }

    /**
     * Convert SVG using Batik
     */
    private ConversionResult convertSvg(byte[] imageData) {
        try {
            byte[] pngData = svgConverter.convertToPng(imageData);
            return ConversionResult.builder()
                    .success(true)
                    .data(pngData)
                    .newMimeType(svgConverter.getOutputMimeType())
                    .newExtension(svgConverter.getOutputExtension())
                    .build();
        } catch (ConversionException e) {
            log.error("SVG conversion failed: {}", e.getMessage());
            return ConversionResult.builder()
                    .success(false)
                    .errorMessage("SVG conversion failed: " + e.getMessage())
                    .build();
        }
    }

    /**
     * Convert using ImageIO (TIFF, BMP, ICO, PSD)
     */
    private ConversionResult convertViaImageIO(byte[] imageData, String originalMimeType) {
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

    /**
     * Get the file extension for a MIME type
     */
    public String getExtensionForMimeType(String mimeType) {
        if (mimeType == null) return "bin";
        return switch (mimeType.toLowerCase()) {
            case "image/jpeg", "image/jpg" -> "jpg";
            case "image/png" -> "png";
            case "image/webp" -> "webp";
            case "image/gif" -> "gif";
            case "image/tiff", "image/x-tiff" -> "tiff";
            case "image/bmp", "image/x-bmp", "image/x-ms-bmp" -> "bmp";
            case "image/heic", "image/heif", "image/heic-sequence", "image/heif-sequence" -> "heic";
            case "image/x-icon", "image/vnd.microsoft.icon" -> "ico";
            case "image/vnd.adobe.photoshop", "application/x-photoshop" -> "psd";
            case "image/svg+xml" -> "svg";
            case "image/x-canon-cr2" -> "cr2";
            case "image/x-canon-cr3" -> "cr3";
            case "image/x-nikon-nef" -> "nef";
            case "image/x-sony-arw" -> "arw";
            case "image/x-adobe-dng" -> "dng";
            case "image/x-olympus-orf" -> "orf";
            case "image/x-fuji-raf" -> "raf";
            case "image/x-panasonic-rw2" -> "rw2";
            default -> "bin";
        };
    }

    /**
     * Get conversion capabilities for health/info endpoint
     */
    public java.util.Map<String, Object> getCapabilities() {
        return nativeLibraryDetector.getCapabilities();
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
