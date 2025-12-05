package com.rapidphotoflow.service.conversion;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;
import java.util.Set;

/**
 * Converts RAW camera formats to JPEG using native dcraw/LibRaw.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class RawConverter {

    private static final Set<String> RAW_MIME_TYPES = Set.of(
            "image/x-canon-cr2",
            "image/x-canon-cr3",
            "image/x-nikon-nef",
            "image/x-sony-arw",
            "image/x-adobe-dng",
            "image/x-olympus-orf",
            "image/x-fuji-raf",
            "image/x-panasonic-rw2",
            "image/x-dcraw"  // Generic RAW
    );

    private static final Map<String, String> MIME_TO_EXTENSION = Map.of(
            "image/x-canon-cr2", "cr2",
            "image/x-canon-cr3", "cr3",
            "image/x-nikon-nef", "nef",
            "image/x-sony-arw", "arw",
            "image/x-adobe-dng", "dng",
            "image/x-olympus-orf", "orf",
            "image/x-fuji-raf", "raf",
            "image/x-panasonic-rw2", "rw2"
    );

    private final NativeLibraryDetector nativeLibraryDetector;

    @Value("${image.conversion.timeout-seconds:30}")
    private int timeoutSeconds;

    @Value("${image.conversion.jpeg-quality:0.9}")
    private float jpegQuality;

    /**
     * Check if the given MIME type is a RAW camera format.
     */
    public boolean canConvert(String mimeType) {
        return RAW_MIME_TYPES.contains(mimeType.toLowerCase());
    }

    /**
     * Check if RAW conversion is available on this system.
     */
    public boolean isAvailable() {
        return nativeLibraryDetector.isRawSupported();
    }

    /**
     * Convert RAW data to JPEG.
     *
     * @param rawData the RAW image bytes
     * @param mimeType the MIME type of the RAW file
     * @return the converted JPEG bytes
     * @throws ConversionException if conversion fails
     */
    public byte[] convertToJpeg(byte[] rawData, String mimeType) throws ConversionException {
        if (!isAvailable()) {
            throw new ConversionException("RAW conversion not available - dcraw/LibRaw not installed");
        }

        String extension = MIME_TO_EXTENSION.getOrDefault(mimeType.toLowerCase(), "raw");
        Path inputFile = null;
        Path outputFile = null;

        try {
            // Write RAW data to temp file with proper extension
            inputFile = ProcessBuilderUtil.createTempFile("raw_input_", "." + extension);
            Files.write(inputFile, rawData);

            ProcessBuilderUtil.ProcessResult result;
            byte[] imageData;

            // Check which tool is available using 'which' (dcraw_emu doesn't have a simple version flag)
            if (ProcessBuilderUtil.isCommandAvailable("which", "dcraw_emu")) {
                // LibRaw's dcraw_emu - writes to file, not stdout
                // -T writes TIFF output to inputFile.tiff
                // -w uses camera white balance
                // -h uses half-size for faster processing
                result = ProcessBuilderUtil.execute(
                        timeoutSeconds,
                        "dcraw_emu",
                        "-T",      // Write TIFF output to file
                        "-w",      // Use camera white balance
                        "-h",      // Half-size (faster)
                        inputFile.toString()
                );

                if (!result.isSuccess()) {
                    throw new ConversionException("dcraw_emu failed: " + result.stderr());
                }

                // dcraw_emu appends .tiff to the full input filename (e.g., input.cr2 -> input.cr2.tiff)
                outputFile = Path.of(inputFile.toString() + ".tiff");

                if (!Files.exists(outputFile)) {
                    throw new ConversionException("dcraw_emu did not create output file: " + outputFile);
                }

                imageData = Files.readAllBytes(outputFile);

            } else {
                // Fall back to original dcraw which supports -c for stdout
                result = ProcessBuilderUtil.execute(
                        timeoutSeconds,
                        "dcraw",
                        "-c",      // Write to stdout
                        "-w",      // Use camera white balance
                        "-h",      // Half-size (faster)
                        inputFile.toString()
                );

                if (!result.isSuccess()) {
                    throw new ConversionException("dcraw failed: " + result.stderr());
                }

                // dcraw outputs PPM format to stdout
                imageData = result.stdout();
            }

            if (imageData.length == 0) {
                throw new ConversionException("dcraw produced no output");
            }

            byte[] jpegData = convertImageToJpeg(imageData);
            log.info("Successfully converted RAW ({}) to JPEG ({} bytes -> {} bytes)",
                    extension.toUpperCase(), rawData.length, jpegData.length);

            return jpegData;

        } catch (IOException | InterruptedException e) {
            throw new ConversionException("RAW conversion failed: " + e.getMessage(), e);
        } finally {
            ProcessBuilderUtil.deleteSilently(inputFile);
            ProcessBuilderUtil.deleteSilently(outputFile);
        }
    }

    /**
     * Convert image data (PPM or TIFF) to JPEG using ImageIO.
     */
    private byte[] convertImageToJpeg(byte[] imageData) throws IOException {
        BufferedImage image = ImageIO.read(new ByteArrayInputStream(imageData));
        if (image == null) {
            throw new IOException("Failed to read image output from dcraw/dcraw_emu");
        }

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(image, "jpg", baos);
        return baos.toByteArray();
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

    /**
     * Get the file extension for a RAW MIME type.
     */
    public String getExtensionForMimeType(String mimeType) {
        return MIME_TO_EXTENSION.getOrDefault(mimeType.toLowerCase(), "raw");
    }
}
