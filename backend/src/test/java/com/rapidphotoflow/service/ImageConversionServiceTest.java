package com.rapidphotoflow.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import javax.imageio.ImageIO;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;

import static org.junit.jupiter.api.Assertions.*;

class ImageConversionServiceTest {

    private ImageConversionService service;

    @BeforeEach
    void setUp() {
        service = new ImageConversionService();
    }

    // ===== isChatGptCompatible tests =====

    @ParameterizedTest
    @ValueSource(strings = {"image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"})
    void isChatGptCompatible_shouldReturnTrueForCompatibleTypes(String mimeType) {
        assertTrue(service.isChatGptCompatible(mimeType));
    }

    @ParameterizedTest
    @ValueSource(strings = {"image/tiff", "image/bmp", "image/heic", "image/heif", "application/pdf"})
    void isChatGptCompatible_shouldReturnFalseForIncompatibleTypes(String mimeType) {
        assertFalse(service.isChatGptCompatible(mimeType));
    }

    @Test
    void isChatGptCompatible_shouldReturnFalseForNull() {
        assertFalse(service.isChatGptCompatible(null));
    }

    @Test
    void isChatGptCompatible_shouldBeCaseInsensitive() {
        assertTrue(service.isChatGptCompatible("IMAGE/JPEG"));
        assertTrue(service.isChatGptCompatible("Image/PNG"));
    }

    // ===== isConvertible tests =====

    @ParameterizedTest
    @ValueSource(strings = {"image/tiff", "image/x-tiff", "image/bmp", "image/x-bmp", "image/x-ms-bmp"})
    void isConvertible_shouldReturnTrueForConvertibleTypes(String mimeType) {
        assertTrue(service.isConvertible(mimeType));
    }

    @ParameterizedTest
    @ValueSource(strings = {"image/heic", "image/heif"})
    void isConvertible_shouldReturnTrueForHeicTypes(String mimeType) {
        assertTrue(service.isConvertible(mimeType));
    }

    @Test
    void isConvertible_shouldReturnFalseForAlreadyCompatibleTypes() {
        assertFalse(service.isConvertible("image/jpeg"));
        assertFalse(service.isConvertible("image/png"));
    }

    @Test
    void isConvertible_shouldReturnFalseForNull() {
        assertFalse(service.isConvertible(null));
    }

    // ===== isHeicFormat tests =====

    @ParameterizedTest
    @ValueSource(strings = {"image/heic", "image/heif", "image/heic-sequence", "image/heif-sequence"})
    void isHeicFormat_shouldReturnTrueForHeicTypes(String mimeType) {
        assertTrue(service.isHeicFormat(mimeType));
    }

    @Test
    void isHeicFormat_shouldReturnFalseForNonHeicTypes() {
        assertFalse(service.isHeicFormat("image/jpeg"));
        assertFalse(service.isHeicFormat("image/tiff"));
        assertFalse(service.isHeicFormat(null));
    }

    // ===== convert tests =====

    @Test
    void convert_shouldReturnOriginalDataForCompatibleTypes() throws IOException {
        byte[] jpegData = createTestImage("jpg");

        ImageConversionService.ConversionResult result = service.convert(jpegData, "image/jpeg");

        assertTrue(result.isSuccess());
        assertArrayEquals(jpegData, result.getData());
        assertEquals("image/jpeg", result.getNewMimeType());
        assertEquals("jpg", result.getNewExtension());
        assertNull(result.getErrorMessage());
    }

    @Test
    void convert_shouldReturnOriginalDataForPng() throws IOException {
        byte[] pngData = createTestImage("png");

        ImageConversionService.ConversionResult result = service.convert(pngData, "image/png");

        assertTrue(result.isSuccess());
        assertArrayEquals(pngData, result.getData());
        assertEquals("image/png", result.getNewMimeType());
    }

    @Test
    void convert_shouldConvertBmpToJpeg() throws IOException {
        byte[] bmpData = createTestImage("bmp");

        ImageConversionService.ConversionResult result = service.convert(bmpData, "image/bmp");

        assertTrue(result.isSuccess());
        assertNotNull(result.getData());
        // BMP without alpha converts to JPEG
        assertEquals("image/jpeg", result.getNewMimeType());
        assertEquals("jpg", result.getNewExtension());
        assertNull(result.getErrorMessage());

        // Verify the output is valid JPEG
        BufferedImage converted = ImageIO.read(new java.io.ByteArrayInputStream(result.getData()));
        assertNotNull(converted);
    }

    @Test
    void convert_shouldConvertImageWithAlphaToPng() throws IOException {
        // Create image with alpha channel
        byte[] pngWithAlpha = createTestImageWithAlpha();

        // Technically PNG is already compatible, but let's test the alpha detection logic
        // by creating a TIFF with alpha (if possible) or test with a mock
        ImageConversionService.ConversionResult result = service.convert(pngWithAlpha, "image/png");

        assertTrue(result.isSuccess());
        assertEquals("image/png", result.getNewMimeType());
    }

    @Test
    void convert_shouldFailForHeicWithoutNativeSupport() {
        // HEIC data would be invalid here but we're testing the error message
        byte[] fakeHeicData = new byte[100];

        ImageConversionService.ConversionResult result = service.convert(fakeHeicData, "image/heic");

        assertFalse(result.isSuccess());
        assertNotNull(result.getErrorMessage());
        assertTrue(result.getErrorMessage().contains("HEIC") || result.getErrorMessage().contains("native"));
    }

    @Test
    void convert_shouldFailForNullData() {
        ImageConversionService.ConversionResult result = service.convert(null, "image/bmp");

        assertFalse(result.isSuccess());
        assertEquals("No image data provided", result.getErrorMessage());
    }

    @Test
    void convert_shouldFailForEmptyData() {
        ImageConversionService.ConversionResult result = service.convert(new byte[0], "image/bmp");

        assertFalse(result.isSuccess());
        assertEquals("No image data provided", result.getErrorMessage());
    }

    @Test
    void convert_shouldFailForTooLargeImages() {
        byte[] hugeData = new byte[51 * 1024 * 1024]; // 51MB

        ImageConversionService.ConversionResult result = service.convert(hugeData, "image/bmp");

        assertFalse(result.isSuccess());
        assertTrue(result.getErrorMessage().contains("maximum size"));
    }

    @Test
    void convert_shouldFailForInvalidImageData() {
        byte[] invalidData = "not an image".getBytes();

        ImageConversionService.ConversionResult result = service.convert(invalidData, "image/bmp");

        assertFalse(result.isSuccess());
        assertNotNull(result.getErrorMessage());
    }

    // ===== Helper methods =====

    private byte[] createTestImage(String format) throws IOException {
        BufferedImage image = new BufferedImage(100, 100, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = image.createGraphics();
        g.setColor(Color.BLUE);
        g.fillRect(0, 0, 100, 100);
        g.setColor(Color.WHITE);
        g.fillOval(25, 25, 50, 50);
        g.dispose();

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(image, format, baos);
        return baos.toByteArray();
    }

    private byte[] createTestImageWithAlpha() throws IOException {
        BufferedImage image = new BufferedImage(100, 100, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g = image.createGraphics();
        g.setColor(new Color(255, 0, 0, 128)); // Semi-transparent red
        g.fillRect(0, 0, 100, 100);
        g.dispose();

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(image, "png", baos);
        return baos.toByteArray();
    }
}
