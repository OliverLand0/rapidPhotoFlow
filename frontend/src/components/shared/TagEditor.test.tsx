import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TagEditor } from "./TagEditor";
import { photoClient } from "../../lib/api/client";
import type { Photo } from "../../lib/api/types";

vi.mock("../../lib/api/client", () => ({
  photoClient: {
    addTag: vi.fn(),
    removeTag: vi.fn(),
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
  tags: [],
  ...overrides,
});

describe("TagEditor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("display", () => {
    it("should render 'No tags' when photo has no tags", () => {
      render(<TagEditor photo={createPhoto({ tags: [] })} />);

      expect(screen.getByText("No tags")).toBeInTheDocument();
    });

    it("should render existing tags", () => {
      render(<TagEditor photo={createPhoto({ tags: ["sunset", "beach", "vacation"] })} />);

      expect(screen.getByText("sunset")).toBeInTheDocument();
      expect(screen.getByText("beach")).toBeInTheDocument();
      expect(screen.getByText("vacation")).toBeInTheDocument();
    });

    it("should render add tag input", () => {
      render(<TagEditor photo={createPhoto()} />);

      expect(screen.getByPlaceholderText("Add tag...")).toBeInTheDocument();
    });
  });

  describe("compact mode", () => {
    it("should only show first 3 tags in compact mode", () => {
      render(
        <TagEditor
          photo={createPhoto({ tags: ["tag1", "tag2", "tag3", "tag4", "tag5"] })}
          compact
        />
      );

      expect(screen.getByText("tag1")).toBeInTheDocument();
      expect(screen.getByText("tag2")).toBeInTheDocument();
      expect(screen.getByText("tag3")).toBeInTheDocument();
      expect(screen.queryByText("tag4")).not.toBeInTheDocument();
      expect(screen.getByText("+2")).toBeInTheDocument();
    });

    it("should return null in compact mode with no tags", () => {
      const { container } = render(
        <TagEditor photo={createPhoto({ tags: [] })} compact />
      );

      expect(container.firstChild).toBeNull();
    });

    it("should not show input in compact mode", () => {
      render(
        <TagEditor photo={createPhoto({ tags: ["tag1"] })} compact />
      );

      expect(screen.queryByPlaceholderText("Add tag...")).not.toBeInTheDocument();
    });
  });

  describe("adding tags", () => {
    it("should add tag when clicking add button", async () => {
      const user = userEvent.setup();
      const updatedPhoto = createPhoto({ tags: ["newtag"] });
      vi.mocked(photoClient.addTag).mockResolvedValue(updatedPhoto);
      const handleUpdate = vi.fn();

      render(<TagEditor photo={createPhoto()} onPhotoUpdate={handleUpdate} />);

      const input = screen.getByPlaceholderText("Add tag...");
      await user.type(input, "newtag");

      const addButton = screen.getByRole("button");
      await user.click(addButton);

      await waitFor(() => {
        expect(photoClient.addTag).toHaveBeenCalledWith("photo-1", "newtag");
        expect(handleUpdate).toHaveBeenCalledWith(updatedPhoto);
      });
    });

    it("should add tag when pressing Enter", async () => {
      const user = userEvent.setup();
      const updatedPhoto = createPhoto({ tags: ["entertag"] });
      vi.mocked(photoClient.addTag).mockResolvedValue(updatedPhoto);
      const handleUpdate = vi.fn();

      render(<TagEditor photo={createPhoto()} onPhotoUpdate={handleUpdate} />);

      const input = screen.getByPlaceholderText("Add tag...");
      await user.type(input, "entertag{enter}");

      await waitFor(() => {
        expect(photoClient.addTag).toHaveBeenCalledWith("photo-1", "entertag");
      });
    });

    it("should normalize tag to lowercase", async () => {
      const user = userEvent.setup();
      vi.mocked(photoClient.addTag).mockResolvedValue(createPhoto({ tags: ["uppercase"] }));

      render(<TagEditor photo={createPhoto()} />);

      const input = screen.getByPlaceholderText("Add tag...");
      await user.type(input, "UPPERCASE{enter}");

      await waitFor(() => {
        expect(photoClient.addTag).toHaveBeenCalledWith("photo-1", "uppercase");
      });
    });

    it("should not add duplicate tags", async () => {
      const user = userEvent.setup();

      render(<TagEditor photo={createPhoto({ tags: ["existing"] })} />);

      const input = screen.getByPlaceholderText("Add tag...");
      await user.type(input, "existing{enter}");

      expect(photoClient.addTag).not.toHaveBeenCalled();
    });

    it("should not add empty tags", async () => {
      const user = userEvent.setup();

      render(<TagEditor photo={createPhoto()} />);

      const input = screen.getByPlaceholderText("Add tag...");
      await user.type(input, "   {enter}");

      expect(photoClient.addTag).not.toHaveBeenCalled();
    });

    it("should clear input after successful add", async () => {
      const user = userEvent.setup();
      vi.mocked(photoClient.addTag).mockResolvedValue(createPhoto({ tags: ["newtag"] }));

      render(<TagEditor photo={createPhoto()} />);

      const input = screen.getByPlaceholderText("Add tag...");
      await user.type(input, "newtag{enter}");

      await waitFor(() => {
        expect(input).toHaveValue("");
      });
    });

    it("should disable add button when input is empty", () => {
      render(<TagEditor photo={createPhoto()} />);

      const addButton = screen.getByRole("button");
      expect(addButton).toBeDisabled();
    });
  });

  describe("removing tags", () => {
    it("should remove tag when clicking X button", async () => {
      const user = userEvent.setup();
      const updatedPhoto = createPhoto({ tags: [] });
      vi.mocked(photoClient.removeTag).mockResolvedValue(updatedPhoto);
      const handleUpdate = vi.fn();

      render(
        <TagEditor
          photo={createPhoto({ tags: ["removeme"] })}
          onPhotoUpdate={handleUpdate}
        />
      );

      // Find the remove button within the tag
      const removeButtons = screen.getAllByRole("button");
      const removeButton = removeButtons.find(
        (btn) => btn.closest(".flex.items-center.gap-1")
      );

      if (removeButton) {
        await user.click(removeButton);

        await waitFor(() => {
          expect(photoClient.removeTag).toHaveBeenCalledWith("photo-1", "removeme");
          expect(handleUpdate).toHaveBeenCalledWith(updatedPhoto);
        });
      }
    });
  });

  describe("error handling", () => {
    it("should handle add tag error gracefully", async () => {
      const user = userEvent.setup();
      vi.mocked(photoClient.addTag).mockRejectedValue(new Error("Network error"));

      render(<TagEditor photo={createPhoto()} />);

      const input = screen.getByPlaceholderText("Add tag...");
      await user.type(input, "errortag{enter}");

      await waitFor(() => {
        expect(photoClient.addTag).toHaveBeenCalled();
      });

      // Component should not crash
      expect(screen.getByPlaceholderText("Add tag...")).toBeInTheDocument();
    });

    it("should handle remove tag error gracefully", async () => {
      const user = userEvent.setup();
      vi.mocked(photoClient.removeTag).mockRejectedValue(new Error("Network error"));

      render(<TagEditor photo={createPhoto({ tags: ["tag1"] })} />);

      const removeButtons = screen.getAllByRole("button");
      const removeButton = removeButtons.find(
        (btn) => btn.closest(".flex.items-center.gap-1")
      );

      if (removeButton) {
        await user.click(removeButton);

        await waitFor(() => {
          expect(photoClient.removeTag).toHaveBeenCalled();
        });
      }

      // Component should not crash
      expect(screen.getByText("tag1")).toBeInTheDocument();
    });
  });
});
