const SIZE_THRESHOLD = 500 * 1024; // 500KB
const MAX_DIMENSION = 1920;
const COMPRESSION_QUALITY = 0.8;

/**
 * Compresses an image file if it exceeds the size threshold.
 * Returns the original file if:
 * - It's not an image
 * - It's smaller than the threshold
 * - Compression would result in a larger file
 * - Any error occurs during compression
 */
export async function compressImage(file: File): Promise<File> {
  // Only process image files
  if (!file.type.startsWith("image/")) {
    return file;
  }

  // Skip small files
  if (file.size <= SIZE_THRESHOLD) {
    return file;
  }

  try {
    const compressedFile = await compressImageFile(file);

    // Return original if compressed is larger
    if (compressedFile.size >= file.size) {
      return file;
    }

    return compressedFile;
  } catch {
    // Return original on any error
    return file;
  }
}

async function compressImageFile(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");

        // Calculate new dimensions while maintaining aspect ratio
        let { width, height } = img;
        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          if (width > height) {
            height = Math.round((height * MAX_DIMENSION) / width);
            width = MAX_DIMENSION;
          } else {
            width = Math.round((width * MAX_DIMENSION) / height);
            height = MAX_DIMENSION;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Could not create blob"));
              return;
            }

            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: file.lastModified,
            });

            resolve(compressedFile);
          },
          file.type,
          COMPRESSION_QUALITY
        );
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error("Failed to load image"));
    };

    img.src = URL.createObjectURL(file);
  });
}

/**
 * Compresses multiple image files with optional progress callback.
 */
export async function compressImages(
  files: File[],
  onProgress?: (current: number, total: number) => void
): Promise<File[]> {
  const results: File[] = [];

  for (let i = 0; i < files.length; i++) {
    const compressedFile = await compressImage(files[i]);
    results.push(compressedFile);

    if (onProgress) {
      onProgress(i + 1, files.length);
    }
  }

  return results;
}
