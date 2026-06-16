import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn } from "@/lib/cn";

// Coral track when on. The KG-grounding switch is the canonical instance —
// disabled+greyed when global KG infra is off (design §5).
export const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitive.Root
    ref={ref}
    className={cn(
      "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-pill border-2 border-transparent transition-colors",
      "focus-visible:outline-none focus-visible:shadow-focus",
      "disabled:cursor-not-allowed disabled:opacity-45",
      "data-[state=checked]:bg-primary data-[state=unchecked]:bg-border-strong",
      className,
    )}
    {...props}
  >
    <SwitchPrimitive.Thumb
      className={cn(
        "pointer-events-none block size-5 rounded-pill bg-white shadow-xs transition-transform",
        "data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0",
      )}
    />
  </SwitchPrimitive.Root>
));
Switch.displayName = SwitchPrimitive.Root.displayName;
