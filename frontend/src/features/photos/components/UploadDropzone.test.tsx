import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UploadDropzone } from "./UploadDropzone";

describe("UploadDropzone", () => {
  const defaultProps = {
    onUpload: vi.fn().mockResolvedValue(undefined),
    disabled: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render default state", () => {
    render(<UploadDropzone {...defaultProps} />);

    expect(screen.getByText(/drop photos here or click to upload/i)).toBeInTheDocument();
    expect(screen.getByText(/supports jpg, png/i)).toBeInTheDocument();
  });

  it("should have file input accepting images", () => {
    render(<UploadDropzone {...defaultProps} />);

    const input = document.querySelector('input[type="file"]');
    expect(input).toHaveAttribute("accept", "image/*");
    expect(input).toHaveAttribute("multiple");
  });

  it("should disable file input when disabled prop is true", () => {
    render(<UploadDropzone {...defaultProps} disabled />);

    const input = document.querySelector('input[type="file"]');
    expect(input).toBeDisabled();
  });

  it("should handle file selection", async () => {
    const handleUpload = vi.fn().mockResolvedValue(undefined);
    render(<UploadDropzone onUpload={handleUpload} />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["test"], "test.jpg", { type: "image/jpeg" });

    await userEvent.upload(input, file);

    await waitFor(() => {
      expect(handleUpload).toHaveBeenCalled();
    });
  });

  it("should filter non-image files", async () => {
    const handleUpload = vi.fn().mockResolvedValue(undefined);
    render(<UploadDropzone onUpload={handleUpload} />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const textFile = new File(["test"], "test.txt", { type: "text/plain" });

    // Simulate file change with non-image file
    Object.defineProperty(input, "files", {
      value: [textFile],
      writable: true,
    });
    fireEvent.change(input);

    // Should not call compressImages for non-image files
    await waitFor(() => {
      expect(handleUpload).not.toHaveBeenCalled();
    });
  });

  it("should show uploading state", async () => {
    let resolveUpload: () => void;
    const uploadPromise = new Promise<void>((resolve) => {
      resolveUpload = resolve;
    });
    const handleUpload = vi.fn().mockReturnValue(uploadPromise);

    render(<UploadDropzone onUpload={handleUpload} />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["test"], "test.jpg", { type: "image/jpeg" });

    await userEvent.upload(input, file);

    await waitFor(() => {
      expect(screen.getByText(/uploading/i)).toBeInTheDocument();
    });

    // Cleanup
    resolveUpload!();
  });

  it("should handle drag over", () => {
    const { container } = render(<UploadDropzone {...defaultProps} />);

    // The outer div has the drag handlers
    const dropzone = container.firstChild as HTMLElement;

    fireEvent.dragOver(dropzone, {
      dataTransfer: { files: [] },
    });

    expect(dropzone).toHaveClass("bg-primary/5");
  });

  it("should handle drag leave", () => {
    const { container } = render(<UploadDropzone {...defaultProps} />);

    const dropzone = container.firstChild as HTMLElement;

    fireEvent.dragOver(dropzone, {
      dataTransfer: { files: [] },
    });

    fireEvent.dragLeave(dropzone, {
      dataTransfer: { files: [] },
    });

    expect(dropzone).not.toHaveClass("bg-primary/5");
  });

  it("should handle drop", async () => {
    const handleUpload = vi.fn().mockResolvedValue(undefined);
    const { container } = render(<UploadDropzone onUpload={handleUpload} />);

    const dropzone = container.firstChild as HTMLElement;
    const file = new File(["test"], "test.jpg", { type: "image/jpeg" });

    fireEvent.drop(dropzone, {
      dataTransfer: {
        files: [file],
      },
    });

    await waitFor(() => {
      expect(handleUpload).toHaveBeenCalled();
    });
  });

  it("should show correct file count (singular)", async () => {
    let resolveUpload: () => void;
    const uploadPromise = new Promise<void>((resolve) => {
      resolveUpload = resolve;
    });
    const handleUpload = vi.fn().mockReturnValue(uploadPromise);

    render(<UploadDropzone onUpload={handleUpload} />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["test"], "test.jpg", { type: "image/jpeg" });

    await userEvent.upload(input, file);

    await waitFor(() => {
      expect(screen.getByText(/1 photo/)).toBeInTheDocument();
    });

    resolveUpload!();
  });

  it("should show correct file count (plural)", async () => {
    let resolveUpload: () => void;
    const uploadPromise = new Promise<void>((resolve) => {
      resolveUpload = resolve;
    });
    const handleUpload = vi.fn().mockReturnValue(uploadPromise);

    render(<UploadDropzone onUpload={handleUpload} />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const files = [
      new File(["test1"], "test1.jpg", { type: "image/jpeg" }),
      new File(["test2"], "test2.jpg", { type: "image/jpeg" }),
    ];

    await userEvent.upload(input, files);

    await waitFor(() => {
      expect(screen.getByText(/2 photos/)).toBeInTheDocument();
    });

    resolveUpload!();
  });

  it("should show upload complete state after successful upload", async () => {
    const handleUpload = vi.fn().mockResolvedValue(undefined);

    render(<UploadDropzone onUpload={handleUpload} />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["test"], "test.jpg", { type: "image/jpeg" });

    await userEvent.upload(input, file);

    await waitFor(() => {
      expect(screen.getByText(/upload complete/i)).toBeInTheDocument();
    });
  });

  it("should not allow upload when already uploading", async () => {
    let resolveUpload: () => void;
    const uploadPromise = new Promise<void>((resolve) => {
      resolveUpload = resolve;
    });
    const handleUpload = vi.fn().mockReturnValue(uploadPromise);

    render(<UploadDropzone onUpload={handleUpload} />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["test"], "test.jpg", { type: "image/jpeg" });

    // First upload
    await userEvent.upload(input, file);

    await waitFor(() => {
      expect(screen.getByText(/uploading/i)).toBeInTheDocument();
    });

    // Input should be disabled during upload
    expect(input).toBeDisabled();

    resolveUpload!();
  });
});
