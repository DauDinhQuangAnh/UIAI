import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { Sparkle } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLogin, AuthRequestError } from "@/api/hooks/auth";
import { useSession } from "@/auth/session-store";

const loginSchema = z.object({
  tenant_slug: z.string().min(1, "Vui lòng nhập không gian làm việc"),
  email: z.string().min(1, "Vui lòng nhập email").email("Email không hợp lệ"),
  password: z.string().min(1, "Vui lòng nhập mật khẩu"),
});
type LoginForm = z.infer<typeof loginSchema>;

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  beforeLoad: () => {
    // Already signed in -> skip the login screen.
    if (useSession.getState().accessToken) throw redirect({ to: "/agents" });
  },
  component: LoginScreen,
});

function LoginScreen() {
  const navigate = useNavigate();
  const { redirect: redirectTo } = Route.useSearch();
  const login = useLogin();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const onSubmit = handleSubmit((values) => {
    setFormError(null);
    login.mutate(values, {
      onSuccess: () => navigate({ to: redirectTo ?? "/agents" }),
      onError: (err) => {
        // 401 must be ONE generic message (never field-attributed) to preserve the
        // server's anti-enumeration design; 400 = malformed input.
        if (err instanceof AuthRequestError && err.status === 400) {
          setFormError("Vui lòng kiểm tra thông tin và thử lại.");
        } else {
          setFormError("Không gian làm việc, email hoặc mật khẩu không hợp lệ.");
        }
      },
    });
  });

  return (
    <div className="grid min-h-[100dvh] lg:grid-cols-2">
      {/* Brand panel (left) — warm coral gradient, hidden on small screens. */}
      <aside className="relative hidden flex-col justify-between bg-gradient-to-br from-brand-500 to-brand-700 p-12 text-white lg:flex">
        <div className="flex items-center gap-2 font-display text-lg font-semibold">
          <Sparkle weight="fill" className="size-6" aria-hidden />
          social-ai
        </div>
        <div className="flex flex-col gap-3">
          <h1 className="font-display text-4xl font-bold leading-tight">
            Trợ lý khách hàng của bạn, dựa trên tri thức riêng của bạn.
          </h1>
          <p className="max-w-md text-white/80">
            Quản lý tác nhân, tài liệu và đồ thị tri thức để tạo phản hồi có nền tảng.
          </p>
        </div>
        <p className="text-sm text-white/60">Trợ lý hỗ trợ khách hàng</p>
      </aside>

      {/* Form panel (right). */}
      <main className="flex items-center justify-center p-6 sm:p-12">
        <div className="flex w-full max-w-sm flex-col gap-6">
          <div className="flex flex-col gap-1.5">
            <h2 className="font-display text-2xl font-semibold text-text-primary">Đăng nhập</h2>
            <p className="text-sm text-text-secondary">Nhập thông tin không gian làm việc của bạn.</p>
          </div>

          {formError && (
            <div
              role="alert"
              aria-live="assertive"
              className="rounded-md border border-danger-border bg-danger-bg px-3 py-2 text-sm text-danger-fg"
            >
              {formError}
            </div>
          )}

          <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
            <Field label="Không gian làm việc" htmlFor="tenant_slug" error={errors.tenant_slug?.message}>
              <Input
                id="tenant_slug"
                autoComplete="organization"
                placeholder="acme-support"
                invalid={!!errors.tenant_slug}
                {...register("tenant_slug")}
              />
            </Field>
            <Field label="Email" htmlFor="email" error={errors.email?.message}>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                invalid={!!errors.email}
                {...register("email")}
              />
            </Field>
            <Field label="Mật khẩu" htmlFor="password" error={errors.password?.message}>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                invalid={!!errors.password}
                {...register("password")}
              />
            </Field>
            <Button type="submit" className="mt-2 w-full" loading={login.isPending}>
              Đăng nhập
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error && (
        <p className="text-xs text-danger-fg" aria-live="polite">
          {error}
        </p>
      )}
    </div>
  );
}
