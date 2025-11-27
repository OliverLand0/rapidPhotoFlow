import { forwardRef } from "react";
import { Check } from "lucide-react";

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  onCheckedChange?: (checked: boolean) => void;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className = "", checked, onCheckedChange, onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(e);
      onCheckedChange?.(e.target.checked);
    };

    return (
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          ref={ref}
          checked={checked}
          onChange={handleChange}
          className="sr-only peer"
          {...props}
        />
        <div
          className={`
            w-4 h-4 rounded border-2 transition-colors
            bg-background border-muted-foreground/50
            peer-checked:bg-primary peer-checked:border-primary
            peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2
            peer-disabled:opacity-50 peer-disabled:cursor-not-allowed
            flex items-center justify-center
            ${className}
          `}
        >
          {checked && <Check className="w-3 h-3 text-primary-foreground" strokeWidth={3} />}
        </div>
      </label>
    );
  }
);

Checkbox.displayName = "Checkbox";
