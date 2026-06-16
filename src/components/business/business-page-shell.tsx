import type { Icon } from "@phosphor-icons/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/cn";

export function BusinessPageShell({
  title,
  description,
  icon: IconCmp,
  children,
  className,
}: {
  title: string;
  description: string;
  icon: Icon;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto flex w-full max-w-4xl flex-col gap-6 p-6 sm:p-8", className)}>
      <div className="flex items-center gap-3">
        <span className="flex size-11 items-center justify-center rounded-pill bg-brand-50 text-brand-600">
          <IconCmp className="size-6" aria-hidden />
        </span>
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="font-display text-3xl font-semibold text-text-primary">{title}</h1>
          <p className="text-sm text-text-secondary">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

export function BusinessSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
