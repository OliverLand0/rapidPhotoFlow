import type { LucideIcon } from "lucide-react";
import { Button } from "../ui/button";

type EmptyStateSize = "sm" | "md" | "lg";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  size?: EmptyStateSize;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

const sizeStyles = {
  sm: {
    container: "py-6",
    iconWrapper: "p-2.5 mb-2",
    icon: "h-5 w-5",
    title: "text-sm font-medium mb-0.5",
    description: "text-xs max-w-xs mb-2",
    buttonSize: "sm" as const,
  },
  md: {
    container: "py-12",
    iconWrapper: "p-4 mb-4",
    icon: "h-8 w-8",
    title: "text-lg font-semibold mb-1",
    description: "text-sm max-w-sm mb-4",
    buttonSize: "default" as const,
  },
  lg: {
    container: "py-16",
    iconWrapper: "p-6 mb-6",
    icon: "h-12 w-12",
    title: "text-xl font-bold mb-2",
    description: "text-base max-w-md mb-6",
    buttonSize: "lg" as const,
  },
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  size = "md",
  action,
  secondaryAction,
}: EmptyStateProps) {
  const styles = sizeStyles[size];

  return (
    <div className={`flex flex-col items-center justify-center text-center ${styles.container}`}>
      <div className={`rounded-full bg-muted ${styles.iconWrapper}`}>
        <Icon className={`text-muted-foreground ${styles.icon}`} />
      </div>
      <h3 className={styles.title}>{title}</h3>
      <p className={`text-muted-foreground ${styles.description}`}>
        {description}
      </p>
      {(action || secondaryAction) && (
        <div className="flex items-center gap-2">
          {action && (
            <Button onClick={action.onClick} size={styles.buttonSize}>
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button onClick={secondaryAction.onClick} variant="ghost" size={styles.buttonSize}>
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
