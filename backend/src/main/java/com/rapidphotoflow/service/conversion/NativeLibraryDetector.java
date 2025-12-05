package com.rapidphotoflow.service.conversion;

import jakarta.annotation.PostConstruct;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

/**
 * Detects available native libraries for image conversion at startup.
 */
@Component
@Slf4j
@Getter
public class NativeLibraryDetector {

    @Value("${image.conversion.heif-enabled:true}")
    private boolean heifEnabled;

    @Value("${image.conversion.raw-enabled:true}")
    private boolean rawEnabled;

    private boolean heifConvertAvailable;
    private boolean dcrawAvailable;

    @PostConstruct
    public void detectLibraries() {
        // Check for heif-convert (HEIC/HEIF support)
        heifConvertAvailable = heifEnabled && ProcessBuilderUtil.isCommandAvailable("heif-convert", "--version");

        // Check for dcraw_emu or dcraw (RAW support)
        // Try dcraw_emu first (LibRaw), then fall back to dcraw
        // Note: dcraw_emu doesn't have a simple version flag, so use 'which' to check
        dcrawAvailable = rawEnabled && (
            ProcessBuilderUtil.isCommandAvailable("which", "dcraw_emu") ||
            ProcessBuilderUtil.isCommandAvailable("which", "dcraw")
        );

        log.info("Native library detection complete:");
        log.info("  - HEIC/HEIF (heif-convert): {}", heifConvertAvailable ? "AVAILABLE" : "NOT AVAILABLE");
        log.info("  - RAW formats (dcraw/LibRaw): {}", dcrawAvailable ? "AVAILABLE" : "NOT AVAILABLE");

        if (!heifConvertAvailable && heifEnabled) {
            log.warn("HEIC/HEIF conversion disabled - heif-convert not found. " +
                    "Install libheif-tools for iPhone photo support.");
        }
        if (!dcrawAvailable && rawEnabled) {
            log.warn("RAW format conversion disabled - dcraw/dcraw_emu not found. " +
                    "Install libraw or dcraw for camera RAW support.");
        }
    }

    /**
     * Get a map of all capabilities for health check endpoint.
     */
    public Map<String, Object> getCapabilities() {
        Map<String, Object> capabilities = new HashMap<>();
        capabilities.put("heicSupport", heifConvertAvailable);
        capabilities.put("rawSupport", dcrawAvailable);
        capabilities.put("icoSupport", true);  // Always available via TwelveMonkeys
        capabilities.put("psdSupport", true);  // Always available via TwelveMonkeys
        capabilities.put("svgSupport", true);  // Always available via Batik
        return capabilities;
    }

    /**
     * Check if HEIC conversion is supported.
     */
    public boolean isHeicSupported() {
        return heifConvertAvailable;
    }

    /**
     * Check if RAW conversion is supported.
     */
    public boolean isRawSupported() {
        return dcrawAvailable;
    }
}
