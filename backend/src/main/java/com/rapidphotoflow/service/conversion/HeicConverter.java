package com.rapidphotoflow.service.conversion;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Set;

/**
 * Converts HEIC/HEIF images (iPhone photos) to JPEG using native heif-convert.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class HeicConverter {

    private static final Set<String> HEIC_MIME_TYPES = Set.of(
            "image/heic",
            "image/heif",
            "image/heic-sequence",
            "image/heif-sequence"
    );

    private final NativeLibraryDetector nativeLibraryDetector;

    @Value("${image.conversion.timeout-seconds:30}")
    private int timeoutSeconds;

    @Value("${image.conversion.heic-quality:90}")
    private int quality;

    /**
     * Check if the given MIME type is a HEIC/HEIF format.
     */
    public boolean canConvert(String mimeType) {
        return HEIC_MIME_TYPES.contains(mimeType.toLowerCase());
    }

    /**
     * Check if HEIC conversion is available on this system.
     */
    public boolean isAvailable() {
        return nativeLibraryDetector.isHeicSupported();
    }

    /**
     * Convert HEIC/HEIF data to JPEG.
     *
     * @param heicData the HEIC image bytes
     * @return the converted JPEG bytes
     * @throws ConversionException if conversion fails
     */
    public byte[] convertToJpeg(byte[] heicData) throws ConversionException {
        if (!isAvailable()) {
            throw new ConversionException("HEIC conversion not available - heif-convert not installed");
        }

        Path inputFile = null;
        Path outputFile = null;

        try {
            // Write HEIC data to temp file
            inputFile = ProcessBuilderUtil.createTempFile("heic_input_", ".heic");
            Files.write(inputFile, heicData);

            // Create output file path
            outputFile = ProcessBuilderUtil.createTempFile("heic_output_", ".jpg");

            // Execute heif-convert
            ProcessBuilderUtil.ProcessResult result = ProcessBuilderUtil.execute(
                    timeoutSeconds,
                    "heif-convert",
                    "-q", String.valueOf(quality),
                    inputFile.toString(),
                    outputFile.toString()
            );

            if (!result.isSuccess()) {
                throw new ConversionException("heif-convert failed: " + result.stderr());
            }

            // Read the converted JPEG
            byte[] jpegData = Files.readAllBytes(outputFile);
            log.info("Successfully converted HEIC to JPEG ({} bytes -> {} bytes)",
                    heicData.length, jpegData.length);

            return jpegData;

        } catch (IOException | InterruptedException e) {
            throw new ConversionException("HEIC conversion failed: " + e.getMessage(), e);
        } finally {
            ProcessBuilderUtil.deleteSilently(inputFile);
            ProcessBuilderUtil.deleteSilently(outputFile);
        }
    }

    /**
     * Get the output MIME type after conversion.
     */
    public String getOutputMimeType() {
        return "image/jpeg";
    }

    /**
     * Get the output file extension after conversion.
     */
    public String getOutputExtension() {
        return "jpg";
    }
}
