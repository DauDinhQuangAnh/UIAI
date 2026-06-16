import * as React from "react";
import { cn } from "@/lib/cn";

// 16px text (prevents mobile auto-zoom); border-strong -> coral focus; crimson on error.
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, invalid, type = "text", ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      aria-invalid={invalid || undefined}
      className={cn(
        "flex h-10 w-full rounded-md border border-border-strong bg-surface px-3 text-base text-text-primary shadow-xs transition-colors",
        "placeholder:text-text-dim",
        "focus-visible:border-brand-400 focus-visible:outline-none focus-visible:shadow-focus",
        "disabled:cursor-not-allowed disabled:opacity-45",
        invalid && "border-danger-base focus-visible:border-danger-base",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";
