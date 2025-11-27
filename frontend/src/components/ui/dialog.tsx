import * as React from "react";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function Dialog({ open, onClose, children }: DialogProps) {
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-2xl max-h-[85vh] overflow-auto bg-background rounded-lg shadow-lg border m-4">
        {children}
      </div>
    </div>
  );
}

interface DialogHeaderProps {
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

export function DialogHeader({ children, onClose, className }: DialogHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between p-4 border-b", className)}>
      <div className="font-semibold text-lg">{children}</div>
      {onClose && (
        <button
          onClick={onClose}
          className="p-1 rounded-md hover:bg-muted transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}

interface DialogContentProps {
  children: React.ReactNode;
  className?: string;
}

export function DialogContent({ children, className }: DialogContentProps) {
  return <div className={cn("p-4", className)}>{children}</div>;
}
