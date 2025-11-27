import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PhotoCard } from "./PhotoCard";
import { photoClient } from "../../../lib/api/client";
import type { Photo } from "../../../lib/api/types";

vi.mock("../../../lib/api/client", () => ({
  photoClient: {
    performAction: vi.fn(),
    getPhotoContentUrl: vi.fn((id: string) => `http://localhost/photos/${id}/content`),
  },
}));

vi.mock("../../../components/ui/toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

const createPhoto = (overrides: Partial<Photo> = {}): Photo => ({
  id: "photo-1",
  filename: "test-photo.jpg",
  status: "PROCESSED",
  mimeType: "image/jpeg",
  sizeBytes: 1024,
  failureReason: null,
  uploadedAt: "2024-01-15T10:00:00Z",
  updatedAt: "2024-01-15T10:00:00Z",
  ...overrides,
});

describe("PhotoCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render photo filename", () => {
    render(<PhotoCard photo={createPhoto({ filename: "beach.jpg" })} />);

    expect(screen.getByText("beach.jpg")).toBeInTheDocument();
  });

  it("should render photo image with correct src", () => {
    render(<PhotoCard photo={createPhoto({ id: "photo-123" })} />);

    const img = screen.getByRole("img", { name: "test-photo.jpg" });
    expect(img).toHaveAttribute("src", "http://localhost/photos/photo-123/content");
  });

  it("should render status badge", () => {
    render(<PhotoCard photo={createPhoto({ status: "PROCESSED" })} />);

    expect(screen.getByText("Ready")).toBeInTheDocument();
  });

  it("should render failure reason when present", () => {
    render(
      <PhotoCard
        photo={createPhoto({ status: "FAILED", failureReason: "Invalid format" })}
      />
    );

    expect(screen.getByText("Invalid format")).toBeInTheDocument();
  });

  it("should call onClick when card is clicked", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    const photo = createPhoto();

    render(<PhotoCard photo={photo} onClick={handleClick} />);

    await user.click(screen.getByText("test-photo.jpg").closest("div")!);

    expect(handleClick).toHaveBeenCalledWith(photo);
  });

  it("should have cursor-pointer class when onClick is provided", () => {
    const { container } = render(
      <PhotoCard photo={createPhoto()} onClick={() => {}} />
    );

    expect(container.querySelector(".cursor-pointer")).toBeInTheDocument();
  });

  it("should apply highlighted ring when highlighted is true", () => {
    const { container } = render(
      <PhotoCard photo={createPhoto()} highlighted />
    );

    expect(container.querySelector(".ring-2")).toBeInTheDocument();
  });

  describe("selection", () => {
    it("should render checkbox when selectable", () => {
      render(<PhotoCard photo={createPhoto()} selectable />);

      expect(screen.getByRole("checkbox")).toBeInTheDocument();
    });

    it("should not render checkbox when not selectable", () => {
      render(<PhotoCard photo={createPhoto()} />);

      expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    });

    it("should show checkbox as checked when selected", () => {
      render(<PhotoCard photo={createPhoto()} selectable selected />);

      expect(screen.getByRole("checkbox")).toBeChecked();
    });

    it("should call onSelectionChange when checkbox is clicked", async () => {
      const user = userEvent.setup();
      const handleSelectionChange = vi.fn();

      render(
        <PhotoCard
          photo={createPhoto({ id: "photo-123" })}
          selectable
          onSelectionChange={handleSelectionChange}
        />
      );

      await user.click(screen.getByRole("checkbox"));

      expect(handleSelectionChange).toHaveBeenCalledWith("photo-123");
    });
  });

  describe("actions", () => {
    it("should show approve button for PROCESSED photos on hover", async () => {
      const user = userEvent.setup();

      render(<PhotoCard photo={createPhoto({ status: "PROCESSED" })} />);

      const card = screen.getByText("test-photo.jpg").closest("div")!.parentElement!;
      await user.hover(card);

      expect(screen.getByRole("button", { name: /approve/i })).toBeInTheDocument();
    });

    it("should show reject button for PROCESSED photos on hover", async () => {
      const user = userEvent.setup();

      render(<PhotoCard photo={createPhoto({ status: "PROCESSED" })} />);

      const card = screen.getByText("test-photo.jpg").closest("div")!.parentElement!;
      await user.hover(card);

      expect(screen.getByRole("button", { name: /reject/i })).toBeInTheDocument();
    });

    it("should show retry button for FAILED photos on hover", async () => {
      const user = userEvent.setup();

      render(<PhotoCard photo={createPhoto({ status: "FAILED" })} />);

      const card = screen.getByText("test-photo.jpg").closest("div")!.parentElement!;
      await user.hover(card);

      expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
    });

    it("should not show actions for PENDING photos", async () => {
      const user = userEvent.setup();

      render(<PhotoCard photo={createPhoto({ status: "PENDING" })} />);

      const card = screen.getByText("test-photo.jpg").closest("div")!.parentElement!;
      await user.hover(card);

      expect(screen.queryByRole("button", { name: /approve/i })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /reject/i })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /retry/i })).not.toBeInTheDocument();
    });

    it("should call performAction when approve is clicked", async () => {
      const user = userEvent.setup();
      const updatedPhoto = createPhoto({ status: "APPROVED" });
      vi.mocked(photoClient.performAction).mockResolvedValue(updatedPhoto);
      const handleAction = vi.fn();

      render(
        <PhotoCard
          photo={createPhoto({ status: "PROCESSED" })}
          onAction={handleAction}
        />
      );

      const card = screen.getByText("test-photo.jpg").closest("div")!.parentElement!;
      await user.hover(card);
      await user.click(screen.getByRole("button", { name: /approve/i }));

      await waitFor(() => {
        expect(photoClient.performAction).toHaveBeenCalledWith("photo-1", "approve");
      });
    });

    it("should call onAction with updated photo after action", async () => {
      const user = userEvent.setup();
      const updatedPhoto = createPhoto({ status: "APPROVED" });
      vi.mocked(photoClient.performAction).mockResolvedValue(updatedPhoto);
      const handleAction = vi.fn();

      render(
        <PhotoCard
          photo={createPhoto({ status: "PROCESSED" })}
          onAction={handleAction}
        />
      );

      const card = screen.getByText("test-photo.jpg").closest("div")!.parentElement!;
      await user.hover(card);
      await user.click(screen.getByRole("button", { name: /approve/i }));

      await waitFor(() => {
        expect(handleAction).toHaveBeenCalledWith(updatedPhoto);
      });
    });
  });

  describe("action permissions", () => {
    it("should allow approve for REJECTED photos", async () => {
      const user = userEvent.setup();

      render(<PhotoCard photo={createPhoto({ status: "REJECTED" })} />);

      const card = screen.getByText("test-photo.jpg").closest("div")!.parentElement!;
      await user.hover(card);

      expect(screen.getByRole("button", { name: /approve/i })).toBeInTheDocument();
    });

    it("should allow reject for APPROVED photos", async () => {
      const user = userEvent.setup();

      render(<PhotoCard photo={createPhoto({ status: "APPROVED" })} />);

      const card = screen.getByText("test-photo.jpg").closest("div")!.parentElement!;
      await user.hover(card);

      expect(screen.getByRole("button", { name: /reject/i })).toBeInTheDocument();
    });

    it("should allow reject for FAILED photos", async () => {
      const user = userEvent.setup();

      render(<PhotoCard photo={createPhoto({ status: "FAILED" })} />);

      const card = screen.getByText("test-photo.jpg").closest("div")!.parentElement!;
      await user.hover(card);

      expect(screen.getByRole("button", { name: /reject/i })).toBeInTheDocument();
    });
  });
});
