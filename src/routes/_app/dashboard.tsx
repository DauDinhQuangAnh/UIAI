import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Robot,
  Buildings,
  LinkSimple,
  Plus,
  ArrowRight,
  Sparkle,
  CheckCircle,
  ShieldCheck,
  UserCircle,
  type Icon,
} from "@phosphor-icons/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSession } from "@/auth/session-store";
import { isAdmin } from "@/auth/guards";
import { cn } from "@/lib/cn";

export const Route = createFileRoute("/_app/dashboard")({
  component: DashboardPage,
});

const DEMO_AGENTS = [
  { id: "1", name: "REO Messenger Bot", ref: "reo-messenger-01", status: "active" },
  { id: "2", name: "CS Support Agent", ref: "cs-support-02", status: "active" },
  { id: "3", name: "Sales Chatbot", ref: "sales-bot-03", status: "active" },
  { id: "4", name: "FAQ Bot", ref: "faq-bot-04", status: "draft" },
  { id: "5", name: "Test Agent", ref: "test-agent-05", status: "inactive" },
];

const DEMO_STATS = {
  totalAgents: 5,
  activeAgents: 3,
  businessPartners: 2,
  socialIntegrations: 3,
};

const DEMO_CHECKLIST = {
  hasAgents: true,
  hasBusinessPartner: true,
  hasIntegration: true,
};

function DashboardPage() {
  const user = useSession((s) => s.user);
  const role = useSession((s) => s.user?.role);
  const admin = isAdmin(role);
  const navigate = useNavigate();

  const today = new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date());

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-6 sm:p-8">
      {/* Welcome header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm capitalize text-text-dim">{today}</p>
          <h1 className="mt-1 font-display text-3xl font-semibold text-text-primary">
            Xin chào, {user?.display_name || user?.username || "bạn"}
          </h1>
          <p className="mt-1 text-sm text-text-secondary">Tổng quan hệ thống chatbot REO – AI</p>
        </div>
        {admin && (
          <Button asChild size="sm">
            <Link to="/agents/new">
              <Plus className="size-4" aria-hidden />
              Tạo Agent mới
            </Link>
          </Button>
        )}
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Robot} label="Tổng số Agents" value={DEMO_STATS.totalAgents} hint="chatbots đã tạo" />
        <StatCard icon={Sparkle} label="Đang hoạt động" value={DEMO_STATS.activeAgents} hint="agents bật bot" positive />
        <StatCard icon={Buildings} label="Business Partners" value={DEMO_STATS.businessPartners} hint="đối tác đăng ký" />
        <StatCard icon={LinkSimple} label="Kết nối mạng XH" value={DEMO_STATS.socialIntegrations} hint="social integrations" positive />
      </div>

      {/* Body */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Agents - 2/3 width */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Agents gần đây</CardTitle>
              <Link
                to="/agents"
                className="flex items-center gap-1 text-sm text-brand-600 transition-colors hover:text-brand-800"
              >
                Xem tất cả
                <ArrowRight className="size-3.5" aria-hidden />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border overflow-hidden rounded-xl border border-border">
              {DEMO_AGENTS.map((agent) => (
                <AgentRow
                  key={agent.id}
                  name={agent.name}
                  ref_={agent.ref}
                  status={agent.status}
                  onClick={() => navigate({ to: "/agents" })}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Right column - 1/3 width */}
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Thiết lập hệ thống</CardTitle>
            </CardHeader>
            <CardContent>
              <SetupChecklist {...DEMO_CHECKLIST} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Truy cập nhanh</CardTitle>
            </CardHeader>
            <CardContent>
              <nav className="flex flex-col gap-0.5">
                <QuickLink icon={Robot} to="/agents" label="Danh sách Agents" />
                <QuickLink icon={Buildings} to="/business/information" label="Business Profile" />
                <QuickLink icon={LinkSimple} to="/business/social-media" label="Kết nối Messenger" />
                <QuickLink icon={ShieldCheck} to="/roles" label="Quản lý phân quyền" />
                <QuickLink icon={UserCircle} to="/account" label="Tài khoản của tôi" />
              </nav>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: IconCmp,
  label,
  value,
  hint,
  positive,
}: {
  icon: Icon;
  label: string;
  value: number;
  hint?: string;
  positive?: boolean;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-2 p-5">
        <div className="flex items-center gap-2 text-text-secondary">
          <IconCmp className="size-4" aria-hidden />
          <span className="text-sm font-medium">{label}</span>
        </div>
        <div
          className={cn(
            "font-display text-3xl font-semibold tabular-nums",
            positive ? "text-success-fg" : "text-text-primary",
          )}
        >
          {value}
        </div>
        {hint && <span className="text-xs text-text-dim">{hint}</span>}
      </CardContent>
    </Card>
  );
}

const STATUS_LABEL: Record<string, string> = {
  active: "Hoạt động",
  inactive: "Tắt",
  draft: "Nháp",
};

function AgentRow({
  name,
  ref_,
  status,
  onClick,
}: {
  name: string;
  ref_: string;
  status: string;
  onClick: () => void;
}) {
  const isActive = status === "active";
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-2"
    >
      <div className="flex size-8 flex-none items-center justify-center rounded-lg bg-brand-50 text-brand-600">
        <Robot className="size-4" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-text-primary">{name}</p>
        <p className="text-xs text-text-dim">{ref_}</p>
      </div>
      <div className="flex flex-none items-center gap-1.5 text-xs text-text-secondary">
        <span className={cn("size-1.5 rounded-full", isActive ? "bg-success-base" : "bg-text-dim")} />
        {STATUS_LABEL[status] ?? status}
      </div>
    </button>
  );
}

function SetupChecklist({
  hasAgents,
  hasBusinessPartner,
  hasIntegration,
}: {
  hasAgents: boolean;
  hasBusinessPartner: boolean;
  hasIntegration: boolean;
}) {
  const steps = [
    { label: "Tạo Agent đầu tiên", done: hasAgents, to: "/agents/new" as const },
    { label: "Thiết lập Business Profile", done: hasBusinessPartner, to: "/business/information" as const },
    { label: "Kết nối Messenger", done: hasIntegration, to: "/business/social-media" as const },
  ];

  const completedCount = steps.filter((s) => s.done).length;
  const allDone = completedCount === steps.length;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between text-xs text-text-dim">
        <span>{completedCount}/{steps.length} bước hoàn thành</span>
        {allDone && <Badge tone="success">Hoàn tất</Badge>}
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
        <div
          className="h-full rounded-full bg-success-base transition-all duration-300"
          style={{ width: `${(completedCount / steps.length) * 100}%` }}
        />
      </div>
      <div className="mt-1 flex flex-col gap-1">
        {steps.map((step) => (
          <Link
            key={step.label}
            to={step.to}
            className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-surface-2"
          >
            <CheckCircle
              weight={step.done ? "fill" : "regular"}
              className={cn("size-4 flex-none", step.done ? "text-success-base" : "text-text-dim")}
            />
            <span className={step.done ? "text-text-dim line-through" : "text-text-primary"}>
              {step.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function QuickLink({ icon: IconCmp, to, label }: { icon: Icon; to: string; label: string }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm text-text-secondary transition-colors hover:bg-surface-2 hover:text-text-primary"
    >
      <IconCmp className="size-4 flex-none" aria-hidden />
      {label}
    </Link>
  );
}
