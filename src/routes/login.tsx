import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { ArrowLeft, Sparkle } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLogin, AuthRequestError } from "@/api/hooks/auth";
import { useSession } from "@/auth/session-store";

const loginSchema = z.object({
  usernameOrEmail: z.string().min(1, "Vui lòng nhập tài khoản hoặc email"),
  password: z.string().min(1, "Vui lòng nhập mật khẩu"),
});
type LoginForm = z.infer<typeof loginSchema>;

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  beforeLoad: () => {
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
        if (err instanceof AuthRequestError && err.status === 400) {
          setFormError("Vui lòng kiểm tra thông tin và thử lại.");
        } else {
          setFormError("Tài khoản/email hoặc mật khẩu không hợp lệ.");
        }
      },
    });
  });

  return (
    <div className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-[#0a090f] px-4 py-12">
      {/* Blobs */}
      <div className="animate-blob absolute left-[10%] top-[15%] size-[460px] rounded-full bg-brand-500/[0.12] blur-[110px]" />
      <div
        className="animate-blob-slow absolute bottom-[10%] right-[5%] size-[380px] rounded-full bg-brand-600/[0.10] blur-[130px]"
        style={{ animationDelay: "4s" }}
      />

      {/* Dot grid */}
      <div className="absolute inset-0 [background-image:radial-gradient(circle,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:28px_28px]" />

      {/* Back to landing */}
      <Link
        to="/"
        className="absolute left-6 top-6 flex items-center gap-1.5 text-sm text-white/40 transition-colors hover:text-white/70"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Trang chủ
      </Link>

      {/* Card */}
      <div className="animate-fade-up relative z-10 w-full max-w-sm rounded-2xl border border-white/[0.09] bg-white/[0.03] p-8 shadow-[0_24px_80px_rgba(0,0,0,0.5)] backdrop-blur-xl">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-2">
          <div className="flex size-11 items-center justify-center rounded-xl bg-brand-500/20">
            <Sparkle weight="fill" className="size-5 text-brand-400" aria-hidden />
          </div>
          <div className="text-center">
            <p className="font-display text-base font-semibold text-white">REO – AI</p>
            <p className="text-xs text-white/40">reply enterprise operation</p>
          </div>
        </div>

        {/* Heading */}
        <div className="mb-6 flex flex-col gap-1">
          <h1 className="font-display text-xl font-semibold text-white">Đăng nhập</h1>
          <p className="text-sm text-white/40">Nhập tài khoản SAR Platform của bạn.</p>
        </div>

        {formError && (
          <div
            role="alert"
            aria-live="assertive"
            className="mb-5 rounded-lg border border-red-500/20 bg-red-500/[0.08] px-3 py-2.5 text-sm text-red-300"
          >
            {formError}
          </div>
        )}

        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          <Field label="Tài khoản hoặc email" htmlFor="usernameOrEmail" error={errors.usernameOrEmail?.message}>
            <Input
              id="usernameOrEmail"
              autoComplete="username"
              placeholder="admin"
              invalid={!!errors.usernameOrEmail}
              className="border-white/[0.12] bg-white/[0.05] text-white placeholder:text-white/25 focus:border-brand-500/60"
              {...register("usernameOrEmail")}
            />
          </Field>
          <Field label="Mật khẩu" htmlFor="password" error={errors.password?.message}>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              invalid={!!errors.password}
              className="border-white/[0.12] bg-white/[0.05] text-white placeholder:text-white/25 focus:border-brand-500/60"
              {...register("password")}
            />
          </Field>
          <Button type="submit" className="mt-2 w-full" loading={login.isPending}>
            Đăng nhập
          </Button>
        </form>
      </div>
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
      <Label htmlFor={htmlFor} className="text-white/70">
        {label}
      </Label>
      {children}
      {error && (
        <p className="text-xs text-red-400" aria-live="polite">
          {error}
        </p>
      )}
    </div>
  );
}
