import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { CircleNotch } from "@phosphor-icons/react";
import { cn } from "@/lib/cn";

// Coral-forward button system (design §5). Min height 40px; primary=coral fill,
// secondary=outline, ghost=coral text, danger=crimson tint.
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-semibold transition-colors duration-150 ease-brand focus-visible:outline-none disabled:pointer-events-none disabled:opacity-45 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground shadow-xs hover:bg-brand-600 active:bg-brand-700",
        secondary: "border border-border-strong bg-surface text-text-primary shadow-xs hover:bg-surface-2",
        ghost: "text-brand-700 hover:bg-brand-50",
        danger: "bg-danger-bg text-danger-fg border border-danger-border hover:bg-danger-base hover:text-white",
        link: "text-brand-700 underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-9 px-3 text-sm",
        md: "h-10 px-4 text-sm",
        lg: "h-11 px-5 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, disabled, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {/* asChild → Slot requires exactly ONE child, so pass children through
            untouched; the loading spinner only applies to real <button> usage. */}
        {asChild ? (
          children
        ) : (
          <>
            {loading && <CircleNotch className="size-4 animate-spin" aria-hidden />}
            {children}
          </>
        )}
      </Comp>
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
