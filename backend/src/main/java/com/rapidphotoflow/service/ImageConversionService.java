package com.rapidphotoflow.service;

import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.stream.ImageInputStream;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Iterator;
import java.util.Set;

@Service
@Slf4j
public class ImageConversionService {

    private static final Set<String> CHATGPT_COMPATIBLE_TYPES = Set.of(
            "image/jpeg", "image/png", "image/webp", "image/gif"
    );

    private static final Set<String> CONVERTIBLE_TYPES = Set.of(
            "image/heic", "image/heif", "image/tiff", "image/bmp",
            "image/x-tiff", "image/x-bmp", "image/x-ms-bmp"
    );

    private static final long MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

    /**
     * Check if the given MIME type is compatible with ChatGPT API
     */
    public boolean isChatGptCompatible(String mimeType) {
        if (mimeType == null) {
            return false;
        }
        return CHATGPT_COMPATIBLE_TYPES.contains(mimeType.toLowerCase());
    }

    /**
     * Check if the given MIME type can be converted to a compatible format
     */
    public boolean isConvertible(String mimeType) {
        if (mimeType == null) {
            return false;
        }
        return CONVERTIBLE_TYPES.contains(mimeType.toLowerCase());
    }

    /**
     * Convert image data to a ChatGPT-compatible format (JPEG or PNG)
     */
    public ConversionResult convert(byte[] imageData, String originalMimeType) {
        if (imageData == null || imageData.length == 0) {
            return ConversionResult.failure("Image data is empty");
        }

        if (imageData.length > MAX_FILE_SIZE) {
            return ConversionResult.failure("Image exceeds maximum size of 50MB");
        }

        try {
            // Read the image using ImageIO (TwelveMonkeys provides extended format support)
            BufferedImage image = readImage(imageData, originalMimeType);
            if (image == null) {
                return ConversionResult.failure("Failed to decode image");
            }

            // Check if image has alpha channel (transparency)
            boolean hasAlpha = image.getColorModel().hasAlpha();

            // Choose output format based on transparency
            String outputFormat = hasAlpha ? "png" : "jpeg";
            String newMimeType = hasAlpha ? "image/png" : "image/jpeg";
            String newExtension = hasAlpha ? ".png" : ".jpg";

            // Convert to RGB if necessary (for JPEG output)
            BufferedImage outputImage = image;
            if (!hasAlpha && image.getType() != BufferedImage.TYPE_INT_RGB) {
                outputImage = new BufferedImage(
                        image.getWidth(),
                        image.getHeight(),
                        BufferedImage.TYPE_INT_RGB
                );
                Graphics2D g = outputImage.createGraphics();
                g.setColor(Color.WHITE);
                g.fillRect(0, 0, image.getWidth(), image.getHeight());
                g.drawImage(image, 0, 0, null);
                g.dispose();
            }

            // Write to byte array
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            boolean written = ImageIO.write(outputImage, outputFormat, baos);

            if (!written) {
                return ConversionResult.failure("No writer found for format: " + outputFormat);
            }

            byte[] convertedData = baos.toByteArray();
            log.info("Successfully converted image from {} to {} ({} bytes -> {} bytes)",
                    originalMimeType, newMimeType, imageData.length, convertedData.length);

            return ConversionResult.success(convertedData, newMimeType, newExtension);

        } catch (Exception e) {
            log.error("Failed to convert image from {}: {}", originalMimeType, e.getMessage(), e);
            return ConversionResult.failure("Conversion failed: " + e.getMessage());
        }
    }

    /**
     * Read image data using ImageIO with extended format support
     */
    private BufferedImage readImage(byte[] imageData, String mimeType) throws IOException {
        ByteArrayInputStream bais = new ByteArrayInputStream(imageData);

        // First try standard ImageIO read
        BufferedImage image = ImageIO.read(bais);
        if (image != null) {
            return image;
        }

        // If standard read fails, try using specific readers based on MIME type
        bais.reset();
        ImageInputStream iis = ImageIO.createImageInputStream(bais);

        try {
            Iterator<ImageReader> readers = getImageReaders(mimeType);
            while (readers.hasNext()) {
                ImageReader reader = readers.next();
                try {
                    reader.setInput(iis);
                    return reader.read(0);
                } catch (Exception e) {
                    log.debug("Reader {} failed: {}", reader.getFormatName(), e.getMessage());
                } finally {
                    reader.dispose();
                }
            }
        } finally {
            iis.close();
        }

        return null;
    }

    /**
     * Get image readers for a specific MIME type
     */
    private Iterator<ImageReader> getImageReaders(String mimeType) {
        if (mimeType == null) {
            return ImageIO.getImageReaders(null);
        }

        String lowerMime = mimeType.toLowerCase();

        // Map MIME types to format names
        String formatName = switch (lowerMime) {
            case "image/tiff", "image/x-tiff" -> "tiff";
            case "image/bmp", "image/x-bmp", "image/x-ms-bmp" -> "bmp";
            case "image/heic", "image/heif" -> "heic";
            default -> null;
        };

        if (formatName != null) {
            return ImageIO.getImageReadersByFormatName(formatName);
        }

        return ImageIO.getImageReadersByMIMEType(mimeType);
    }

    /**
     * Result of an image conversion attempt
     */
    @Data
    public static class ConversionResult {
        private byte[] data;
        private String newMimeType;
        private String newExtension;
        private boolean success;
        private String errorMessage;

        public static ConversionResult success(byte[] data, String newMimeType, String newExtension) {
            ConversionResult result = new ConversionResult();
            result.setData(data);
            result.setNewMimeType(newMimeType);
            result.setNewExtension(newExtension);
            result.setSuccess(true);
            return result;
        }

        public static ConversionResult failure(String errorMessage) {
            ConversionResult result = new ConversionResult();
            result.setSuccess(false);
            result.setErrorMessage(errorMessage);
            return result;
        }
    }
}
