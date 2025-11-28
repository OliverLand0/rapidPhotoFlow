const MAX_WIDTH = 2048;
const MAX_HEIGHT = 2048;
const JPEG_QUALITY = 0.85;

/**
 * Compresses an image file by:
 * 1. Resizing if larger than max dimensions
 * 2. Converting to sRGB color space (strips problematic ICC profiles)
 * 3. Re-encoding as JPEG with reasonable quality
 */
export async function compressImage(file: File): Promise<File> {
  // Skip non-image files
  if (!file.type.startsWith("image/")) {
    return file;
  }

  // Skip small files (under 500KB) - likely already optimized
  if (file.size < 500 * 1024) {
    return file;
  }

  return new Promise((resolve, _reject) => {
    const img = new Image();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      resolve(file); // Fallback to original if canvas not supported
      return;
    }

    img.onload = () => {
      URL.revokeObjectURL(img.src);

      // Calculate new dimensions maintaining aspect ratio
      let { width, height } = img;

      if (width > MAX_WIDTH || height > MAX_HEIGHT) {
        const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      canvas.width = width;
      canvas.height = height;

      // Draw image - this converts to sRGB and strips ICC profiles
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }

          // Create new file with original name
          const compressedFile = new File(
            [blob],
            file.name.replace(/\.[^.]+$/, ".jpg"),
            { type: "image/jpeg" }
          );

          // Only use compressed version if it's actually smaller
          if (compressedFile.size < file.size) {
            resolve(compressedFile);
          } else {
            resolve(file);
          }
        },
        "image/jpeg",
        JPEG_QUALITY
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      // If we can't load the image, just use original
      resolve(file);
    };

    img.src = URL.createObjectURL(file);
  });
}

/**
 * Process multiple images in sequence to avoid overwhelming browser memory
 */
export async function compressImages(
  files: File[],
  onProgress?: (processed: number, total: number) => void
): Promise<File[]> {
  const results: File[] = [];

  for (let i = 0; i < files.length; i++) {
    const compressed = await compressImage(files[i]);
    results.push(compressed);
    onProgress?.(i + 1, files.length);
  }

  return results;
}
