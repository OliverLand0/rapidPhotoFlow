package com.rapidphotoflow.service.conversion;

import lombok.extern.slf4j.Slf4j;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.concurrent.TimeUnit;

/**
 * Utility class for executing native processes for image conversion.
 */
@Slf4j
public class ProcessBuilderUtil {

    private static final int DEFAULT_TIMEOUT_SECONDS = 30;

    /**
     * Result of a process execution.
     */
    public record ProcessResult(int exitCode, byte[] stdout, String stderr) {
        public boolean isSuccess() {
            return exitCode == 0;
        }
    }

    /**
     * Execute a command and capture output.
     */
    public static ProcessResult execute(String... command) throws IOException, InterruptedException {
        return execute(DEFAULT_TIMEOUT_SECONDS, command);
    }

    /**
     * Execute a command with custom timeout.
     */
    public static ProcessResult execute(int timeoutSeconds, String... command) throws IOException, InterruptedException {
        ProcessBuilder pb = new ProcessBuilder(command);
        pb.redirectErrorStream(false);

        log.debug("Executing command: {}", String.join(" ", command));
        Process process = pb.start();

        ByteArrayOutputStream stdout = new ByteArrayOutputStream();
        ByteArrayOutputStream stderr = new ByteArrayOutputStream();

        Thread stdoutReader = new Thread(() -> {
            try (InputStream is = process.getInputStream()) {
                is.transferTo(stdout);
            } catch (IOException e) {
                log.error("Error reading stdout", e);
            }
        });

        Thread stderrReader = new Thread(() -> {
            try (InputStream is = process.getErrorStream()) {
                is.transferTo(stderr);
            } catch (IOException e) {
                log.error("Error reading stderr", e);
            }
        });

        stdoutReader.start();
        stderrReader.start();

        boolean completed = process.waitFor(timeoutSeconds, TimeUnit.SECONDS);
        if (!completed) {
            process.destroyForcibly();
            throw new IOException("Process timed out after " + timeoutSeconds + " seconds");
        }

        stdoutReader.join(5000);
        stderrReader.join(5000);

        int exitCode = process.exitValue();
        String stderrStr = stderr.toString();

        if (exitCode != 0) {
            log.warn("Command failed with exit code {}: {}", exitCode, stderrStr);
        }

        return new ProcessResult(exitCode, stdout.toByteArray(), stderrStr);
    }

    /**
     * Check if a command is available on the system.
     */
    public static boolean isCommandAvailable(String command, String... versionArgs) {
        try {
            String[] fullCommand = new String[1 + versionArgs.length];
            fullCommand[0] = command;
            System.arraycopy(versionArgs, 0, fullCommand, 1, versionArgs.length);

            ProcessBuilder pb = new ProcessBuilder(fullCommand);
            pb.redirectErrorStream(true);
            Process process = pb.start();
            boolean completed = process.waitFor(5, TimeUnit.SECONDS);

            if (completed) {
                int exitCode = process.exitValue();
                return exitCode == 0;
            }
            process.destroyForcibly();
            return false;
        } catch (Exception e) {
            log.debug("Command {} not available: {}", command, e.getMessage());
            return false;
        }
    }

    /**
     * Create a temporary file with the given extension.
     */
    public static Path createTempFile(String prefix, String extension) throws IOException {
        String tempDir = System.getenv("IMAGE_TEMP_DIR");
        if (tempDir != null && !tempDir.isEmpty()) {
            Path dir = Path.of(tempDir);
            if (Files.exists(dir)) {
                return Files.createTempFile(dir, prefix, extension);
            }
        }
        return Files.createTempFile(prefix, extension);
    }

    /**
     * Safely delete a file, ignoring errors.
     */
    public static void deleteSilently(Path path) {
        if (path != null) {
            try {
                Files.deleteIfExists(path);
            } catch (IOException e) {
                log.debug("Failed to delete temp file: {}", path);
            }
        }
    }
}
