import { useCallback, useState } from "react";
import { Upload, CheckCircle } from "lucide-react";
import { cn, formatSpeed } from "../../../lib/utils";
import { Progress } from "../../../components/ui/progress";

interface UploadDropzoneProps {
  onUpload: (files: File[], onProgress: (progress: number, speed: number) => void) => Promise<void>;
  disabled?: boolean;
}

export function UploadDropzone({ onUpload, disabled }: UploadDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadSpeed, setUploadSpeed] = useState(0);
  const [fileCount, setFileCount] = useState(0);
  const [uploadComplete, setUploadComplete] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const resetUploadState = useCallback(() => {
    setTimeout(() => {
      setUploadComplete(false);
      setProgress(0);
      setUploadSpeed(0);
      setFileCount(0);
    }, 2000);
  }, []);

  const handleUpload = useCallback(
    async (files: File[]) => {
      if (disabled || isUploading || files.length === 0) return;

      const imageFiles = files.filter((file) => file.type.startsWith("image/"));
      if (imageFiles.length === 0) return;

      setFileCount(imageFiles.length);
      setUploadComplete(false);
      setProgress(0);
      setUploadSpeed(0);
      setIsUploading(true);

      try {
        // Pass all files to parent - parent handles batching and cancellation
        await onUpload(imageFiles, (uploadProgress, speed) => {
          setProgress(uploadProgress);
          setUploadSpeed(speed);
        });

        setUploadComplete(true);
        resetUploadState();
      } catch (error) {
        // Don't log cancelled uploads as errors
        if (error instanceof Error && error.message !== "Upload cancelled") {
          console.error("Upload failed:", error);
        }
      } finally {
        setIsUploading(false);
      }
    },
    [onUpload, disabled, isUploading, resetUploadState]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const files = Array.from(e.dataTransfer.files);
      handleUpload(files);
    },
    [handleUpload]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      handleUpload(files);
      e.target.value = "";
    },
    [handleUpload]
  );

  return (
    <div
      className={cn(
        "relative h-full transition-colors cursor-pointer rounded-lg",
        isDragging && "bg-primary/5",
        (disabled || isUploading) && "cursor-not-allowed"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        accept="image/*"
        multiple
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        onChange={handleFileInput}
        disabled={disabled || isUploading}
      />
      <div className="flex flex-col items-center justify-center h-full py-12 px-4">
        {uploadComplete ? (
          <>
            <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
            <p className="text-lg font-medium mb-1 text-green-600">
              Upload Complete!
            </p>
            <p className="text-sm text-muted-foreground">
              {fileCount} {fileCount === 1 ? "photo" : "photos"} uploaded successfully
            </p>
          </>
        ) : isUploading ? (
          <>
            <Upload className="h-12 w-12 text-primary mb-4 animate-pulse" />
            <p className="text-lg font-medium mb-2">
              Uploading {fileCount} {fileCount === 1 ? "photo" : "photos"}...
            </p>
            <div className="w-64 mb-2">
              <Progress value={progress} />
            </div>
            <p className="text-sm text-muted-foreground">
              {progress}%{uploadSpeed > 0 && ` \u2022 ${formatSpeed(uploadSpeed)}`}
            </p>
          </>
        ) : (
          <>
            <Upload className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-1">
              Drop photos here or click to upload
            </p>
            <p className="text-sm text-muted-foreground">
              Supports JPG, PNG, and other image formats
            </p>
          </>
        )}
      </div>
    </div>
  );
}
