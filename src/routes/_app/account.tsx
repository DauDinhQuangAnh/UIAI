import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { SignOut } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSession } from "@/auth/session-store";
import { useMe, useLogout, useChangePassword, AuthRequestError } from "@/api/hooks/auth";
import { isAdmin } from "@/auth/guards";

const passwordSchema = z
  .object({
    current_password: z.string().min(1, "Required"),
    new_password: z.string().min(8, "At least 8 characters"),
    confirm: z.string().min(1, "Required"),
  })
  .refine((v) => v.new_password === v.confirm, {
    path: ["confirm"],
    message: "Passwords do not match",
  });
type PasswordForm = z.infer<typeof passwordSchema>;

export const Route = createFileRoute("/_app/account")({
  component: AccountScreen,
});

function AccountScreen() {
  const navigate = useNavigate();
  const user = useSession((s) => s.user);
  const { isLoading } = useMe();
  const logout = useLogout();
  const changePassword = useChangePassword();
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) });

  const onChangePassword = handleSubmit((values) => {
    changePassword.mutate(
      { current_password: values.current_password, new_password: values.new_password },
      {
        onSuccess: () => {
          reset();
          toast.success("Password changed. Sign in again to continue.");
          navigate({ to: "/login" });
        },
        onError: (err) => {
          if (err instanceof AuthRequestError && err.status === 401) {
            setError("current_password", { message: "Current password is incorrect" });
          } else {
            toast.error("Couldn't change password. Please try again.");
          }
        },
      },
    );
  });

  const onLogout = () =>
    logout.mutate(undefined, { onSettled: () => navigate({ to: "/login" }) });

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-6 sm:p-8">
      <h1 className="font-display text-3xl font-semibold text-text-primary">Account</h1>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your workspace identity.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {isLoading && !user ? (
            <p className="text-sm text-text-dim">Loading…</p>
          ) : (
            <>
              <Row label="Name" value={user?.display_name || "—"} />
              <Row label="Email" value={user?.email ?? "—"} mono />
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">Role</span>
                <Badge tone={isAdmin(user?.role) ? "brand" : "neutral"}>{user?.role ?? "—"}</Badge>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change password</CardTitle>
          <CardDescription>
            Signs you out everywhere — background sessions end within ~15 minutes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onChangePassword} className="flex flex-col gap-4" noValidate>
            <PasswordField
              id="current_password"
              label="Current password"
              autoComplete="current-password"
              error={errors.current_password?.message}
              register={register("current_password")}
            />
            <PasswordField
              id="new_password"
              label="New password"
              autoComplete="new-password"
              error={errors.new_password?.message}
              register={register("new_password")}
            />
            <PasswordField
              id="confirm"
              label="Confirm new password"
              autoComplete="new-password"
              error={errors.confirm?.message}
              register={register("confirm")}
            />
            <Button type="submit" className="mt-1 w-fit" loading={changePassword.isPending}>
              Update password
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sign out</CardTitle>
          <CardDescription>
            Ends your current session; background access ends within ~15 minutes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="secondary" onClick={onLogout} loading={logout.isPending}>
            <SignOut className="size-4" aria-hidden /> Sign out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-text-secondary">{label}</span>
      <span className={mono ? "font-mono text-sm text-text-primary" : "text-sm text-text-primary"}>
        {value}
      </span>
    </div>
  );
}

function PasswordField({
  id,
  label,
  autoComplete,
  error,
  register,
}: {
  id: string;
  label: string;
  autoComplete: string;
  error?: string;
  register: ReturnType<ReturnType<typeof useForm<PasswordForm>>["register"]>;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type="password" autoComplete={autoComplete} invalid={!!error} {...register} />
      {error && (
        <p className="text-xs text-danger-fg" aria-live="polite">
          {error}
        </p>
      )}
    </div>
  );
}
