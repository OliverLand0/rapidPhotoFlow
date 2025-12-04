package com.rapidphotoflow.service.conversion;

import lombok.extern.slf4j.Slf4j;
import org.apache.batik.transcoder.TranscoderInput;
import org.apache.batik.transcoder.TranscoderOutput;
import org.apache.batik.transcoder.image.PNGTranscoder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.StringReader;
import java.nio.charset.StandardCharsets;

/**
 * Converts SVG images to PNG using Apache Batik.
 */
@Service
@Slf4j
public class SvgConverter {

    private static final String SVG_MIME_TYPE = "image/svg+xml";
    private static final int DEFAULT_MAX_DIMENSION = 1920;

    @Value("${image.conversion.svg-max-dimension:1920}")
    private int maxDimension;

    /**
     * Check if the given MIME type is SVG.
     */
    public boolean canConvert(String mimeType) {
        return SVG_MIME_TYPE.equalsIgnoreCase(mimeType);
    }

    /**
     * SVG conversion is always available (pure Java via Batik).
     */
    public boolean isAvailable() {
        return true;
    }

    /**
     * Convert SVG data to PNG.
     *
     * @param svgData the SVG image bytes
     * @return the converted PNG bytes
     * @throws ConversionException if conversion fails
     */
    public byte[] convertToPng(byte[] svgData) throws ConversionException {
        try {
            // Sanitize SVG to remove potentially dangerous elements
            String svgContent = new String(svgData, StandardCharsets.UTF_8);
            svgContent = sanitizeSvg(svgContent);

            // Create transcoder
            PNGTranscoder transcoder = new PNGTranscoder();

            // Set max dimension while preserving aspect ratio
            transcoder.addTranscodingHint(PNGTranscoder.KEY_MAX_WIDTH, (float) maxDimension);
            transcoder.addTranscodingHint(PNGTranscoder.KEY_MAX_HEIGHT, (float) maxDimension);

            // Convert
            TranscoderInput input = new TranscoderInput(new StringReader(svgContent));
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            TranscoderOutput output = new TranscoderOutput(baos);

            transcoder.transcode(input, output);

            byte[] pngData = baos.toByteArray();
            log.info("Successfully converted SVG to PNG ({} bytes -> {} bytes)",
                    svgData.length, pngData.length);

            return pngData;

        } catch (Exception e) {
            throw new ConversionException("SVG conversion failed: " + e.getMessage(), e);
        }
    }

    /**
     * Sanitize SVG content to remove potentially dangerous elements.
     * This helps prevent XXE attacks and other security issues.
     */
    private String sanitizeSvg(String svgContent) {
        // Remove script tags
        svgContent = svgContent.replaceAll("(?i)<script[^>]*>.*?</script>", "");

        // Remove event handlers (onclick, onload, etc.)
        svgContent = svgContent.replaceAll("(?i)\\s+on\\w+\\s*=\\s*['\"][^'\"]*['\"]", "");

        // Remove external references that could leak data
        // Note: This is a basic sanitization - for production, consider a proper SVG sanitizer library
        svgContent = svgContent.replaceAll("(?i)xlink:href\\s*=\\s*['\"](?!#)[^'\"]*['\"]", "");

        return svgContent;
    }

    /**
     * Get the output MIME type after conversion.
     */
    public String getOutputMimeType() {
        return "image/png";
    }

    /**
     * Get the output file extension after conversion.
     */
    public String getOutputExtension() {
        return "png";
    }
}
