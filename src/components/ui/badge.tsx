import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

// Pill badges. Status colors pair with icon+label at the call site (color-not-only).
const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-pill border px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      tone: {
        neutral: "border-border bg-surface-2 text-text-secondary",
        brand: "border-brand-100 bg-brand-50 text-brand-800",
        success: "border-success-border bg-success-bg text-success-fg",
        warning: "border-warning-border bg-warning-bg text-warning-fg",
        danger: "border-danger-border bg-danger-bg text-danger-fg",
        info: "border-info-border bg-info-bg text-info-fg",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}

export { badgeVariants };
