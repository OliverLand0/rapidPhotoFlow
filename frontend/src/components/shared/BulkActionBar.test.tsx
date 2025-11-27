import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BulkActionBar } from "./BulkActionBar";
import { photoClient } from "../../lib/api/client";

// Mock the API client
vi.mock("../../lib/api/client", () => ({
  photoClient: {
    performBulkAction: vi.fn(),
  },
}));

// Mock toast
vi.mock("../ui/toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe("BulkActionBar", () => {
  const mockFailedPhoto = {
    id: "1",
    filename: "test1.jpg",
    status: "FAILED" as const,
    mimeType: "image/jpeg",
    sizeBytes: 1000,
    failureReason: null,
    uploadedAt: "2024-01-01",
    updatedAt: "2024-01-01",
  };
  const mockProcessedPhoto = {
    id: "2",
    filename: "test2.jpg",
    status: "PROCESSED" as const,
    mimeType: "image/jpeg",
    sizeBytes: 1000,
    failureReason: null,
    uploadedAt: "2024-01-01",
    updatedAt: "2024-01-01",
  };

  const defaultProps = {
    selectedIds: new Set(["1", "2"]),
    selectedPhotos: [mockFailedPhoto, mockProcessedPhoto],
    onClearSelection: vi.fn(),
    onActionComplete: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return null when no items selected", () => {
    const { container } = render(
      <BulkActionBar
        selectedIds={new Set()}
        selectedPhotos={[]}
        onClearSelection={vi.fn()}
        onActionComplete={vi.fn()}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it("should display count of selected items (singular)", () => {
    render(
      <BulkActionBar
        selectedIds={new Set(["1"])}
        selectedPhotos={[mockFailedPhoto]}
        onClearSelection={vi.fn()}
        onActionComplete={vi.fn()}
      />
    );

    expect(screen.getByText("1 photo selected")).toBeInTheDocument();
  });

  it("should display count of selected items (plural)", () => {
    render(<BulkActionBar {...defaultProps} />);

    expect(screen.getByText("2 photos selected")).toBeInTheDocument();
  });

  it("should render action buttons", () => {
    render(<BulkActionBar {...defaultProps} />);

    expect(screen.getByRole("button", { name: /approve all/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /reject all/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /retry all/i })).toBeInTheDocument();
  });

  it("should call onClearSelection when close button clicked", async () => {
    const user = userEvent.setup();
    const onClearSelection = vi.fn();

    render(
      <BulkActionBar
        {...defaultProps}
        onClearSelection={onClearSelection}
      />
    );

    // Find the close button (last button without text)
    const buttons = screen.getAllByRole("button");
    const closeButton = buttons[buttons.length - 1];

    await user.click(closeButton);
    expect(onClearSelection).toHaveBeenCalledOnce();
  });

  it("should call performBulkAction with approve action", async () => {
    const user = userEvent.setup();
    vi.mocked(photoClient.performBulkAction).mockResolvedValue({
      success: [{ id: "1" }, { id: "2" }],
      errors: [],
    });

    render(<BulkActionBar {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: /approve all/i }));

    await waitFor(() => {
      expect(photoClient.performBulkAction).toHaveBeenCalledWith(
        expect.arrayContaining(["1", "2"]),
        "approve"
      );
    });
  });

  it("should call performBulkAction with reject action", async () => {
    const user = userEvent.setup();
    vi.mocked(photoClient.performBulkAction).mockResolvedValue({
      success: [{ id: "1" }, { id: "2" }],
      errors: [],
    });

    render(<BulkActionBar {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: /reject all/i }));

    await waitFor(() => {
      expect(photoClient.performBulkAction).toHaveBeenCalledWith(
        expect.arrayContaining(["1", "2"]),
        "reject"
      );
    });
  });

  it("should call onActionComplete and onClearSelection after successful action", async () => {
    const user = userEvent.setup();
    const onActionComplete = vi.fn();
    const onClearSelection = vi.fn();

    const mockResponse = {
      success: [{ id: "1" }, { id: "2" }],
      errors: [],
    };
    vi.mocked(photoClient.performBulkAction).mockResolvedValue(mockResponse);

    render(
      <BulkActionBar
        {...defaultProps}
        onActionComplete={onActionComplete}
        onClearSelection={onClearSelection}
      />
    );

    await user.click(screen.getByRole("button", { name: /approve all/i }));

    await waitFor(() => {
      expect(onActionComplete).toHaveBeenCalledWith(mockResponse);
      expect(onClearSelection).toHaveBeenCalled();
    });
  });

  it("should disable buttons while loading", async () => {
    const user = userEvent.setup();

    // Create a promise that we can control
    let resolvePromise: (value: unknown) => void;
    const pendingPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    vi.mocked(photoClient.performBulkAction).mockReturnValue(pendingPromise as never);

    render(<BulkActionBar {...defaultProps} />);

    // Click approve
    await user.click(screen.getByRole("button", { name: /approve all/i }));

    // While loading, buttons should be disabled
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /reject all/i })).toBeDisabled();
      expect(screen.getByRole("button", { name: /retry all/i })).toBeDisabled();
    });

    // Resolve the promise
    resolvePromise!({ success: [], errors: [] });
  });
});
