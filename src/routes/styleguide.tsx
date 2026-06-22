import { createFileRoute } from "@tanstack/react-router";
import {
  CheckCircle,
  WarningCircle,
  Info,
  XCircle,
  Sparkle,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Dev-only parity check against design-guidelines-style-tile.html. The plan calls
// this "_styleguide"; in TanStack Router a leading underscore is a pathless layout,
// so the viewable route is /styleguide.
export const Route = createFileRoute("/styleguide")({
  component: Styleguide,
});

// Full class strings (Tailwind JIT can't see runtime-built names).
const CORAL: Array<[number, string]> = [
  [50, "bg-brand-50"],
  [100, "bg-brand-100"],
  [200, "bg-brand-200"],
  [300, "bg-brand-300"],
  [400, "bg-brand-400"],
  [500, "bg-brand-500"],
  [600, "bg-brand-600"],
  [700, "bg-brand-700"],
  [800, "bg-brand-800"],
];
const SHADOWS: Array<[string, string]> = [
  ["xs", "shadow-xs"],
  ["sm", "shadow-sm"],
  ["md", "shadow-md"],
  ["lg", "shadow-lg"],
];
const TYPE = [
  ["38 / display", "text-4xl font-display"],
  ["30 / display", "text-3xl font-display"],
  ["24 / heading", "text-2xl font-display"],
  ["20", "text-xl"],
  ["16 / body", "text-base"],
  ["14", "text-sm"],
  ["12 / meta", "text-xs"],
] as const;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-2xl text-text-primary">{title}</h2>
      {children}
    </section>
  );
}

function Styleguide() {
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-12 p-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-4xl text-text-primary">REO - AI — reply enterprise operation</h1>
        <p className="text-text-secondary">
          Kiểm tra đồng bộ token. Mẫu tiếng Việt: <span className="font-display">REO - reply enterprise operation — Tổng quan</span>
        </p>
      </header>

      <Section title="Brand — coral ramp">
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-9">
          {CORAL.map(([step, bg]) => (
            <div key={step} className="flex flex-col items-center gap-1">
              <div className={`h-14 w-full rounded-md border border-border ${bg}`} />
              <span className="font-mono text-xs text-text-dim">{step}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Type scale (Bricolage / Inter)">
        <div className="flex flex-col gap-2">
          {TYPE.map(([label, cls]) => (
            <div key={label} className="flex items-baseline gap-4">
              <span className="w-28 font-mono text-xs text-text-dim">{label}</span>
              <span className={cls}>Warm, scannable, bold-not-loud</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Buttons">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="primary" loading>
            Loading
          </Button>
          <Button variant="primary" disabled>
            Disabled
          </Button>
        </div>
      </Section>

      <Section title="Input & toggle">
        <div className="flex max-w-sm flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sg-email">Email</Label>
            <Input id="sg-email" placeholder="acme-support@example.com" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sg-err">With error</Label>
            <Input id="sg-err" invalid defaultValue="bad-value" />
            <p className="text-xs text-danger-fg">This field has an error.</p>
          </div>
          <div className="flex items-center gap-3">
            <Switch id="sg-kg" defaultChecked />
            <Label htmlFor="sg-kg">KG grounding</Label>
          </div>
        </div>
      </Section>

      <Section title="Status chips (color + icon + label)">
        <div className="flex flex-wrap gap-2">
          <Badge tone="warning">
            <span className="size-1.5 animate-pulse-dot rounded-pill bg-warning-base" /> queued
          </Badge>
          <Badge tone="info">
            <Info className="size-3.5" aria-hidden /> extracting
          </Badge>
          <Badge tone="success">
            <CheckCircle className="size-3.5" aria-hidden /> ready
          </Badge>
          <Badge tone="danger">
            <XCircle className="size-3.5" aria-hidden /> failed
          </Badge>
          <Badge tone="warning">
            <WarningCircle className="size-3.5" aria-hidden /> pending
          </Badge>
          <Badge tone="brand">
            <Sparkle className="size-3.5" aria-hidden /> brand
          </Badge>
        </div>
      </Section>

      <Section title="KPI cards">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            ["messages / 30d", "8,412"],
            ["conversations", "1,204"],
            ["pending dedup", "6"],
          ].map(([label, value]) => (
            <Card key={label} className="border-l-4 border-l-brand-500">
              <CardContent className="flex flex-col gap-1 p-5">
                <span className="font-mono text-xs uppercase tracking-wide text-text-dim">{label}</span>
                <span className="tabular text-3xl font-display text-text-primary">{value}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>

      <Section title="Table">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Document</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-mono">pricing-2026.pdf</TableCell>
              <TableCell className="tabular">248 KB</TableCell>
              <TableCell>
                <Badge tone="success">
                  <CheckCircle className="size-3.5" aria-hidden /> ready
                </Badge>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-mono">faq.md</TableCell>
              <TableCell className="tabular">12 KB</TableCell>
              <TableCell>
                <Badge tone="info">
                  <Info className="size-3.5" aria-hidden /> extracting
                </Badge>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Section>

      <Card className="bg-surface-2">
        <CardHeader>
          <CardTitle>Shadow & radius</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          {SHADOWS.map(([s, shadow]) => (
            <div key={s} className={`flex h-20 w-28 items-center justify-center rounded-2xl bg-surface ${shadow}`}>
              <span className="font-mono text-xs text-text-dim">shadow-{s}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </main>
  );
}
