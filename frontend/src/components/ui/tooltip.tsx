import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "../../lib/utils";

interface TooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  className?: string;
}

export function Tooltip({ children, content, className }: TooltipProps) {
  const [isVisible, setIsVisible] = React.useState(false);
  const [position, setPosition] = React.useState({ top: 0, left: 0 });
  const triggerRef = React.useRef<HTMLDivElement>(null);

  const updatePosition = React.useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({
        top: rect.top - 8, // Position above with small gap
        left: rect.left + rect.width / 2,
      });
    }
  }, []);

  const handleMouseEnter = () => {
    updatePosition();
    setIsVisible(true);
  };

  return (
    <>
      <div
        ref={triggerRef}
        className="inline-flex"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setIsVisible(false)}
      >
        {children}
      </div>
      {isVisible && createPortal(
        <div
          className={cn(
            "fixed z-[9999] px-3 py-2.5 text-sm bg-zinc-900 text-white rounded-lg shadow-xl border border-zinc-700 -translate-x-1/2 -translate-y-full pointer-events-none",
            className
          )}
          style={{
            top: position.top,
            left: position.left,
          }}
        >
          {content}
        </div>,
        document.body
      )}
    </>
  );
}
