import * as React from "react";
import { cn } from "../../lib/utils";

interface DropdownMenuContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const DropdownMenuContext = React.createContext<DropdownMenuContextValue | null>(null);

function useDropdownMenuContext() {
  const context = React.useContext(DropdownMenuContext);
  if (!context) {
    throw new Error("DropdownMenu components must be used within a DropdownMenu");
  }
  return context;
}

interface DropdownMenuProps {
  children: React.ReactNode;
}

const DropdownMenu = ({ children }: DropdownMenuProps) => {
  const [open, setOpen] = React.useState(false);

  return (
    <DropdownMenuContext.Provider value={{ open, setOpen }}>
      <div className="relative inline-block text-left">{children}</div>
    </DropdownMenuContext.Provider>
  );
};

interface DropdownMenuTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
  className?: string;
}

const DropdownMenuTrigger = React.forwardRef<HTMLButtonElement, DropdownMenuTriggerProps>(
  ({ children, asChild, className }, ref) => {
    const { open, setOpen } = useDropdownMenuContext();

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<{ onClick?: () => void }>, {
        onClick: () => setOpen(!open),
      });
    }

    return (
      <button
        ref={ref}
        type="button"
        onClick={() => setOpen(!open)}
        className={className}
      >
        {children}
      </button>
    );
  }
);
DropdownMenuTrigger.displayName = "DropdownMenuTrigger";

interface DropdownMenuContentProps {
  children: React.ReactNode;
  className?: string;
  align?: "start" | "center" | "end";
}

const DropdownMenuContent = ({ children, className, align = "end" }: DropdownMenuContentProps) => {
  const { open, setOpen } = useDropdownMenuContext();
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, setOpen]);

  if (!open) return null;

  return (
    <div
      ref={ref}
      className={cn(
        "absolute z-50 mt-1 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95",
        align === "start" && "left-0",
        align === "center" && "left-1/2 -translate-x-1/2",
        align === "end" && "right-0",
        className
      )}
    >
      {children}
    </div>
  );
};

interface DropdownMenuItemProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}

const DropdownMenuItem = ({ children, className, onClick, disabled }: DropdownMenuItemProps) => {
  const { setOpen } = useDropdownMenuContext();

  return (
    <div
      onClick={() => {
        if (disabled) return;
        onClick?.();
        setOpen(false);
      }}
      className={cn(
        "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
        disabled && "pointer-events-none opacity-50",
        className
      )}
    >
      {children}
    </div>
  );
};

interface DropdownMenuSeparatorProps {
  className?: string;
}

const DropdownMenuSeparator = ({ className }: DropdownMenuSeparatorProps) => {
  return <div className={cn("-mx-1 my-1 h-px bg-muted", className)} />;
};

interface DropdownMenuLabelProps {
  children: React.ReactNode;
  className?: string;
}

const DropdownMenuLabel = ({ children, className }: DropdownMenuLabelProps) => {
  return (
    <div className={cn("px-2 py-1.5 text-sm font-semibold", className)}>
      {children}
    </div>
  );
};

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
};
