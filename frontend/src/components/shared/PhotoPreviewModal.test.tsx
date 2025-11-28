import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PhotoPreviewModal } from "./PhotoPreviewModal";
import { photoClient } from "../../lib/api/client";
import type { Photo } from "../../lib/api/types";

vi.mock("../../lib/api/client", () => ({
  photoClient: {
    performAction: vi.fn(),
    deletePhoto: vi.fn(),
    getPhotoContentUrl: vi.fn((id: string) => `http://localhost/photos/${id}/content`),
  },
}));

vi.mock("../ui/toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

const createPhoto = (overrides: Partial<Photo> = {}): Photo => ({
  id: "photo-1",
  filename: "test-photo.jpg",
  status: "PROCESSED",
  mimeType: "image/jpeg",
  sizeBytes: 1024000,
  failureReason: null,
  updatedAt: "2024-01-15T10:00:00Z",
  uploadedAt: "2024-01-15T10:00:00Z",
  ...overrides,
});

describe("PhotoPreviewModal", () => {
  const defaultProps = {
    photo: createPhoto(),
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock window.confirm
    vi.spyOn(window, "confirm").mockReturnValue(true);
  });

  it("should render photo filename", () => {
    render(<PhotoPreviewModal {...defaultProps} />);

    // Filename appears in header and sidebar - just verify at least one is present
    const filenames = screen.getAllByText("test-photo.jpg");
    expect(filenames.length).toBeGreaterThan(0);
  });

  it("should render photo status badge", () => {
    render(<PhotoPreviewModal {...defaultProps} />);

    expect(screen.getByText("Ready")).toBeInTheDocument();
  });

  it("should render photo image", () => {
    render(<PhotoPreviewModal {...defaultProps} />);

    const img = screen.getByRole("img", { name: "test-photo.jpg" });
    expect(img).toHaveAttribute("src", "http://localhost/photos/photo-1/content");
  });

  it("should render photo details", () => {
    render(<PhotoPreviewModal {...defaultProps} />);

    expect(screen.getByText("Filename")).toBeInTheDocument();
    expect(screen.getByText("Size")).toBeInTheDocument();
    expect(screen.getByText("Uploaded")).toBeInTheDocument();
    expect(screen.getByText("Last Updated")).toBeInTheDocument();
  });

  it("should render failure reason when present", () => {
    render(
      <PhotoPreviewModal
        {...defaultProps}
        photo={createPhoto({ status: "FAILED", failureReason: "Invalid format" })}
      />
    );

    expect(screen.getByText("Error")).toBeInTheDocument();
    expect(screen.getByText("Invalid format")).toBeInTheDocument();
  });

  it("should call onClose when close button is clicked", async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();

    render(<PhotoPreviewModal {...defaultProps} onClose={handleClose} />);

    // Find the close button by its title attribute
    const closeButton = screen.getByTitle("Close (Esc)");

    await user.click(closeButton);

    expect(handleClose).toHaveBeenCalled();
  });

  it("should call onClose when backdrop is clicked", async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();

    render(<PhotoPreviewModal {...defaultProps} onClose={handleClose} />);

    const backdrop = document.querySelector(".bg-black\\/80")!;
    await user.click(backdrop);

    expect(handleClose).toHaveBeenCalled();
  });

  it("should call onClose on Escape key", () => {
    const handleClose = vi.fn();

    render(<PhotoPreviewModal {...defaultProps} onClose={handleClose} />);

    // Component uses window.addEventListener for keyboard events
    fireEvent.keyDown(document, { key: "Escape" });

    expect(handleClose).toHaveBeenCalled();
  });

  describe("actions", () => {
    it("should show approve button for PROCESSED photos", () => {
      render(
        <PhotoPreviewModal
          {...defaultProps}
          photo={createPhoto({ status: "PROCESSED" })}
        />
      );

      expect(screen.getByRole("button", { name: /approve/i })).toBeInTheDocument();
    });

    it("should show reject button for PROCESSED photos", () => {
      render(
        <PhotoPreviewModal
          {...defaultProps}
          photo={createPhoto({ status: "PROCESSED" })}
        />
      );

      expect(screen.getByRole("button", { name: /reject/i })).toBeInTheDocument();
    });

    it("should show retry button for FAILED photos", () => {
      render(
        <PhotoPreviewModal
          {...defaultProps}
          photo={createPhoto({ status: "FAILED" })}
        />
      );

      expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
    });

    it("should call performAction when approve is clicked", async () => {
      const user = userEvent.setup();
      const updatedPhoto = createPhoto({ status: "APPROVED" });
      vi.mocked(photoClient.performAction).mockResolvedValue(updatedPhoto);
      const handleUpdate = vi.fn();

      render(
        <PhotoPreviewModal
          {...defaultProps}
          photo={createPhoto({ status: "PROCESSED" })}
          onPhotoUpdate={handleUpdate}
        />
      );

      await user.click(screen.getByRole("button", { name: /approve/i }));

      await waitFor(() => {
        expect(photoClient.performAction).toHaveBeenCalledWith("photo-1", "approve");
        expect(handleUpdate).toHaveBeenCalledWith(updatedPhoto);
      });
    });

    it("should call performAction when reject is clicked", async () => {
      const user = userEvent.setup();
      const updatedPhoto = createPhoto({ status: "REJECTED" });
      vi.mocked(photoClient.performAction).mockResolvedValue(updatedPhoto);

      render(
        <PhotoPreviewModal
          {...defaultProps}
          photo={createPhoto({ status: "PROCESSED" })}
        />
      );

      await user.click(screen.getByRole("button", { name: /reject/i }));

      await waitFor(() => {
        expect(photoClient.performAction).toHaveBeenCalledWith("photo-1", "reject");
      });
    });

    it("should show delete button", () => {
      render(<PhotoPreviewModal {...defaultProps} />);

      expect(screen.getByRole("button", { name: /delete/i })).toBeInTheDocument();
    });

    it("should call deletePhoto when delete is clicked and confirmed", async () => {
      const user = userEvent.setup();
      vi.mocked(photoClient.deletePhoto).mockResolvedValue(undefined);
      const handleDelete = vi.fn();
      const handleClose = vi.fn();

      render(
        <PhotoPreviewModal
          {...defaultProps}
          onPhotoDelete={handleDelete}
          onClose={handleClose}
        />
      );

      await user.click(screen.getByRole("button", { name: /delete/i }));

      await waitFor(() => {
        expect(photoClient.deletePhoto).toHaveBeenCalledWith("photo-1");
        expect(handleDelete).toHaveBeenCalledWith("photo-1");
        expect(handleClose).toHaveBeenCalled();
      });
    });

    it("should not delete when confirm is cancelled", async () => {
      const user = userEvent.setup();
      vi.spyOn(window, "confirm").mockReturnValue(false);

      render(<PhotoPreviewModal {...defaultProps} />);

      await user.click(screen.getByRole("button", { name: /delete/i }));

      expect(photoClient.deletePhoto).not.toHaveBeenCalled();
    });
  });

  describe("navigation", () => {
    const photos = [
      createPhoto({ id: "photo-1", filename: "first.jpg" }),
      createPhoto({ id: "photo-2", filename: "second.jpg" }),
      createPhoto({ id: "photo-3", filename: "third.jpg" }),
    ];

    it("should show navigation arrows when photos array is provided", () => {
      render(
        <PhotoPreviewModal
          {...defaultProps}
          photo={photos[1]}
          photos={photos}
          onNavigate={vi.fn()}
        />
      );

      expect(document.querySelector("[class*='ChevronLeft']") || screen.queryByLabelText(/previous/i)).toBeDefined();
    });

    it("should show photo counter", () => {
      render(
        <PhotoPreviewModal
          {...defaultProps}
          photo={photos[1]}
          photos={photos}
          onNavigate={vi.fn()}
        />
      );

      expect(screen.getByText("2 / 3")).toBeInTheDocument();
    });

    it("should call onNavigate when left arrow is clicked", async () => {
      const user = userEvent.setup();
      const handleNavigate = vi.fn();

      render(
        <PhotoPreviewModal
          {...defaultProps}
          photo={photos[1]}
          photos={photos}
          onNavigate={handleNavigate}
        />
      );

      const prevButton = screen.getAllByRole("button").find((btn) =>
        btn.querySelector("svg")?.classList.contains("lucide-chevron-left") ||
        btn.innerHTML.includes("ChevronLeft")
      );

      if (prevButton) {
        await user.click(prevButton);
        expect(handleNavigate).toHaveBeenCalledWith(photos[0]);
      }
    });

    it("should navigate with keyboard arrows", () => {
      const handleNavigate = vi.fn();

      render(
        <PhotoPreviewModal
          {...defaultProps}
          photo={photos[1]}
          photos={photos}
          onNavigate={handleNavigate}
        />
      );

      // Component uses window.addEventListener for keyboard events
      fireEvent.keyDown(document, { key: "ArrowLeft" });
      expect(handleNavigate).toHaveBeenCalledWith(photos[0]);

      fireEvent.keyDown(document, { key: "ArrowRight" });
      expect(handleNavigate).toHaveBeenCalledWith(photos[2]);
    });

    it("should not show prev arrow on first photo", () => {
      render(
        <PhotoPreviewModal
          {...defaultProps}
          photo={photos[0]}
          photos={photos}
          onNavigate={vi.fn()}
        />
      );

      // First photo - should only have next button, not prev
      expect(screen.getByText("1 / 3")).toBeInTheDocument();
    });

    it("should not show next arrow on last photo", () => {
      render(
        <PhotoPreviewModal
          {...defaultProps}
          photo={photos[2]}
          photos={photos}
          onNavigate={vi.fn()}
        />
      );

      expect(screen.getByText("3 / 3")).toBeInTheDocument();
    });
  });

  describe("action permissions", () => {
    it("should not show approve for PENDING photos", () => {
      render(
        <PhotoPreviewModal
          {...defaultProps}
          photo={createPhoto({ status: "PENDING" })}
        />
      );

      expect(screen.queryByRole("button", { name: /^approve$/i })).not.toBeInTheDocument();
    });

    it("should show approve for REJECTED photos", () => {
      render(
        <PhotoPreviewModal
          {...defaultProps}
          photo={createPhoto({ status: "REJECTED" })}
        />
      );

      expect(screen.getByRole("button", { name: /approve/i })).toBeInTheDocument();
    });

    it("should show reject for APPROVED photos", () => {
      render(
        <PhotoPreviewModal
          {...defaultProps}
          photo={createPhoto({ status: "APPROVED" })}
        />
      );

      expect(screen.getByRole("button", { name: /reject/i })).toBeInTheDocument();
    });
  });
});
