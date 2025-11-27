import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { cn } from "../../lib/utils";

type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  toast: (toast: Omit<Toast, "id">) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

const icons: Record<ToastType, typeof CheckCircle> = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
};

const styles: Record<ToastType, string> = {
  success: "border-green-500/50 bg-green-50 dark:bg-green-950/50",
  error: "border-red-500/50 bg-red-50 dark:bg-red-950/50",
  info: "border-blue-500/50 bg-blue-50 dark:bg-blue-950/50",
  warning: "border-amber-500/50 bg-amber-50 dark:bg-amber-950/50",
};

const iconStyles: Record<ToastType, string> = {
  success: "text-green-600 dark:text-green-400",
  error: "text-red-600 dark:text-red-400",
  info: "text-blue-600 dark:text-blue-400",
  warning: "text-amber-600 dark:text-amber-400",
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const Icon = icons[toast.type];

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-4 rounded-lg border shadow-lg animate-in slide-in-from-right-full",
        styles[toast.type]
      )}
    >
      <Icon className={cn("h-5 w-5 flex-shrink-0 mt-0.5", iconStyles[toast.type])} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{toast.title}</p>
        {toast.description && (
          <p className="text-sm text-muted-foreground mt-1">{toast.description}</p>
        )}
      </div>
      <button
        onClick={onDismiss}
        className="flex-shrink-0 p-1 rounded hover:bg-black/10 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((newToast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substring(2, 9);
    const duration = newToast.duration ?? 5000;

    setToasts((prev) => [...prev, { ...newToast, id }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
