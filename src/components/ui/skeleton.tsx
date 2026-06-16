import type * as React from "react";
import { cn } from "@/lib/cn";

// Shown for anything >300ms (ingest poll, transcript load). Pulse honors reduced-motion.
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("animate-pulse rounded-md bg-surface-2", className)} {...props} />;
}
