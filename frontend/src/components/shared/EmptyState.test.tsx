import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ImageOff } from "lucide-react";
import { EmptyState } from "./EmptyState";

describe("EmptyState", () => {
  it("should render title and description", () => {
    render(
      <EmptyState
        icon={ImageOff}
        title="No photos"
        description="Upload some photos to get started"
      />
    );

    expect(screen.getByText("No photos")).toBeInTheDocument();
    expect(screen.getByText("Upload some photos to get started")).toBeInTheDocument();
  });

  it("should render with small size", () => {
    render(
      <EmptyState
        icon={ImageOff}
        title="No items"
        description="Nothing here"
        size="sm"
      />
    );

    expect(screen.getByText("No items")).toBeInTheDocument();
  });

  it("should render with large size", () => {
    render(
      <EmptyState
        icon={ImageOff}
        title="No items"
        description="Nothing here"
        size="lg"
      />
    );

    expect(screen.getByText("No items")).toBeInTheDocument();
  });

  it("should render action button when provided", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(
      <EmptyState
        icon={ImageOff}
        title="No photos"
        description="Upload some photos"
        action={{
          label: "Upload Photos",
          onClick: handleClick,
        }}
      />
    );

    const button = screen.getByRole("button", { name: "Upload Photos" });
    expect(button).toBeInTheDocument();

    await user.click(button);
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it("should render secondary action when provided", async () => {
    const user = userEvent.setup();
    const handlePrimary = vi.fn();
    const handleSecondary = vi.fn();

    render(
      <EmptyState
        icon={ImageOff}
        title="No photos"
        description="Upload some photos"
        action={{
          label: "Upload",
          onClick: handlePrimary,
        }}
        secondaryAction={{
          label: "Learn More",
          onClick: handleSecondary,
        }}
      />
    );

    const secondaryButton = screen.getByRole("button", { name: "Learn More" });
    expect(secondaryButton).toBeInTheDocument();

    await user.click(secondaryButton);
    expect(handleSecondary).toHaveBeenCalledOnce();
  });

  it("should not render action buttons when not provided", () => {
    render(
      <EmptyState
        icon={ImageOff}
        title="No photos"
        description="Upload some photos"
      />
    );

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
