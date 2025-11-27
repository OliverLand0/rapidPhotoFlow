import { X, Keyboard } from "lucide-react";
import { Button } from "../ui/button";

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const shortcuts = [
  {
    category: "Navigation",
    items: [
      { keys: ["↑", "↓"], description: "Move focus up/down" },
      { keys: ["Enter"], description: "Open photo preview" },
      { keys: ["Esc"], description: "Close preview / Clear focus / Clear selection" },
    ],
  },
  {
    category: "Actions on focused photo",
    items: [
      { keys: ["A"], description: "Approve photo" },
      { keys: ["R"], description: "Reject photo" },
      { keys: ["T"], description: "Retry failed photo" },
      { keys: ["Space"], description: "Toggle selection" },
    ],
  },
  {
    category: "Selection",
    items: [
      { keys: ["⌘", "A"], description: "Select all photos", separator: "+" },
      { keys: ["Shift", "↑/↓"], description: "Extend selection", separator: "+" },
    ],
  },
  {
    category: "Help",
    items: [{ keys: ["?"], description: "Show this help" }],
  },
];

export function KeyboardShortcutsModal({
  isOpen,
  onClose,
}: KeyboardShortcutsModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-background rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-2">
            <Keyboard className="w-5 h-5" />
            <h2 className="text-lg font-semibold">Keyboard Shortcuts</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
          {shortcuts.map((section) => (
            <div key={section.category} className="mb-6 last:mb-0">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                {section.category}
              </h3>
              <div className="space-y-2">
                {section.items.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-sm"
                  >
                    <span>{item.description}</span>
                    <div className="flex items-center gap-1">
                      {item.keys.map((key, j) => (
                        <span key={j} className="flex items-center">
                          {j > 0 && (
                            <span className="text-muted-foreground mx-1">
                              {item.separator || " "}
                            </span>
                          )}
                          <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">
                            {key}
                          </kbd>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="px-6 py-3 border-t bg-muted/30 text-xs text-muted-foreground">
          Press <kbd className="px-1.5 py-0.5 bg-muted rounded font-mono">Esc</kbd> to close
        </div>
      </div>
    </div>
  );
}
