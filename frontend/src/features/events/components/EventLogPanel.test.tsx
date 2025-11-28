import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import { EventLogPanel } from "./EventLogPanel";
import { useEventLog } from "../hooks/useEventLog";
import type { EventLog } from "../../../lib/api/types";

vi.mock("../hooks/useEventLog");

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const createEvent = (overrides: Partial<EventLog> = {}): EventLog => ({
  id: "event-1",
  photoId: "photo-1",
  type: "PHOTO_CREATED",
  message: "Photo uploaded: test.jpg",
  timestamp: "2024-01-15T10:00:00Z",
  ...overrides,
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe("EventLogPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("loading state", () => {
    it("should show loading skeletons when loading", () => {
      vi.mocked(useEventLog).mockReturnValue({
        events: [],
        isLoading: true,
        error: null,
        refetch: vi.fn(),
      });

      render(<EventLogPanel />, { wrapper });

      const skeletons = document.querySelectorAll(".animate-pulse");
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe("empty state", () => {
    it("should show 'No events yet' when there are no events", () => {
      vi.mocked(useEventLog).mockReturnValue({
        events: [],
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<EventLogPanel />, { wrapper });

      expect(screen.getByText("No events yet")).toBeInTheDocument();
    });

    it("should show 'No matching events' when filter returns no results", async () => {
      const user = userEvent.setup();
      vi.mocked(useEventLog).mockReturnValue({
        events: [createEvent({ type: "PHOTO_CREATED" })],
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<EventLogPanel />, { wrapper });

      // Change filter to errors only
      const select = screen.getByRole("combobox");
      await user.selectOptions(select, "errors");

      expect(screen.getByText("No matching events")).toBeInTheDocument();
    });
  });

  describe("event display", () => {
    it("should display events", () => {
      vi.mocked(useEventLog).mockReturnValue({
        events: [
          createEvent({ message: "Photo uploaded: image1.jpg" }),
          createEvent({ id: "event-2", message: "Processing started" }),
        ],
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<EventLogPanel />, { wrapper });

      expect(screen.getByText("Photo uploaded: image1.jpg")).toBeInTheDocument();
      expect(screen.getByText("Processing started")).toBeInTheDocument();
    });

    it("should show event header", () => {
      vi.mocked(useEventLog).mockReturnValue({
        events: [createEvent()],
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<EventLogPanel />, { wrapper });

      expect(screen.getByText("Event Log")).toBeInTheDocument();
    });
  });

  describe("filtering", () => {
    const mockEvents = [
      createEvent({ id: "1", type: "PHOTO_CREATED", message: "Photo created" }),
      createEvent({ id: "2", type: "PROCESSING_COMPLETED", message: "Processing done" }),
      createEvent({ id: "3", type: "PROCESSING_FAILED", message: "Processing failed" }),
      createEvent({ id: "4", type: "APPROVED", message: "Photo approved" }),
    ];

    beforeEach(() => {
      vi.mocked(useEventLog).mockReturnValue({
        events: mockEvents,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });
    });

    it("should show all events by default", () => {
      render(<EventLogPanel />, { wrapper });

      expect(screen.getByText("Photo created")).toBeInTheDocument();
      expect(screen.getByText("Processing done")).toBeInTheDocument();
      expect(screen.getByText("Processing failed")).toBeInTheDocument();
      expect(screen.getByText("Photo approved")).toBeInTheDocument();
    });

    it("should filter to errors only", async () => {
      const user = userEvent.setup();
      render(<EventLogPanel />, { wrapper });

      const select = screen.getByRole("combobox");
      await user.selectOptions(select, "errors");

      expect(screen.queryByText("Photo created")).not.toBeInTheDocument();
      expect(screen.getByText("Processing failed")).toBeInTheDocument();
    });

    it("should filter to success only", async () => {
      const user = userEvent.setup();
      render(<EventLogPanel />, { wrapper });

      const select = screen.getByRole("combobox");
      await user.selectOptions(select, "success");

      expect(screen.queryByText("Photo created")).not.toBeInTheDocument();
      expect(screen.getByText("Processing done")).toBeInTheDocument();
      expect(screen.getByText("Photo approved")).toBeInTheDocument();
    });

    it("should filter to activity only", async () => {
      const user = userEvent.setup();
      render(<EventLogPanel />, { wrapper });

      const select = screen.getByRole("combobox");
      await user.selectOptions(select, "activity");

      expect(screen.getByText("Photo created")).toBeInTheDocument();
      expect(screen.queryByText("Processing done")).not.toBeInTheDocument();
    });
  });

  describe("navigation", () => {
    it("should navigate to review page when clicking an event without onPhotoClick", async () => {
      const user = userEvent.setup();
      vi.mocked(useEventLog).mockReturnValue({
        events: [createEvent({ photoId: "photo-123" })],
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<EventLogPanel />, { wrapper });

      const eventItem = screen.getByText("Photo uploaded: test.jpg");
      await user.click(eventItem);

      expect(mockNavigate).toHaveBeenCalledWith("/review?photoId=photo-123");
    });

    it("should call onPhotoClick when provided", async () => {
      const user = userEvent.setup();
      const handlePhotoClick = vi.fn();
      vi.mocked(useEventLog).mockReturnValue({
        events: [createEvent({ photoId: "photo-456" })],
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<EventLogPanel onPhotoClick={handlePhotoClick} />, { wrapper });

      const eventItem = screen.getByText("Photo uploaded: test.jpg");
      await user.click(eventItem);

      expect(handlePhotoClick).toHaveBeenCalledWith("photo-456");
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe("photoId prop", () => {
    it("should pass photoId to useEventLog", () => {
      vi.mocked(useEventLog).mockReturnValue({
        events: [],
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<EventLogPanel photoId="specific-photo" />, { wrapper });

      expect(useEventLog).toHaveBeenCalledWith({
        photoId: "specific-photo",
        intervalMs: 5000,
        limit: 30,
      });
    });
  });

  describe("event styling", () => {
    it("should highlight the latest event", () => {
      vi.mocked(useEventLog).mockReturnValue({
        events: [
          createEvent({ id: "1", type: "PROCESSING_COMPLETED" }),
          createEvent({ id: "2", type: "PHOTO_CREATED" }),
        ],
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<EventLogPanel />, { wrapper });

      // First event should have colored indicator
      const indicators = document.querySelectorAll(".rounded-full");
      expect(indicators[0]).toHaveClass("bg-green-500"); // PROCESSING_COMPLETED color
    });
  });
});
