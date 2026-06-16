import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/common/empty-state";
import { useCreateAgent } from "@/api/hooks/agents";
import { useSession } from "@/auth/session-store";
import { isAdmin } from "@/auth/guards";
import { ApiRequestError } from "@/api/errors";

const createSchema = z.object({
  agent_ref: z.string().min(1, "Required").max(120),
  display_name: z.string().max(200).optional(),
  model: z.string().max(200).optional(),
  system_prompt: z.string().max(20000).optional(),
});
type CreateForm = z.infer<typeof createSchema>;

export const Route = createFileRoute("/_app/agents/new")({
  component: CreateAgent,
});

function CreateAgent() {
  const navigate = useNavigate();
  const role = useSession((s) => s.user?.role);
  const create = useCreateAgent();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<CreateForm>({ resolver: zodResolver(createSchema) });

  // Server enforces admin (403); this keeps members from seeing the form.
  if (!isAdmin(role)) {
    return (
      <div className="mx-auto w-full max-w-xl p-6 sm:p-8">
        <EmptyState
          title="Chỉ dành cho quản trị viên"
          description="Cần vai trò quản trị để tạo tác nhân."
          action={
            <Button asChild variant="secondary">
              <Link to="/agents">Quay lại danh sách tác nhân</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const onSubmit = handleSubmit((v) => {
    create.mutate(
      { agent_ref: v.agent_ref, display_name: v.display_name, model: v.model, system_prompt: v.system_prompt },
      {
        onSuccess: (agent) => navigate({ to: "/agents/$agentId", params: { agentId: agent.id! } }),
        onError: (err) => {
          // 409 (duplicate ref) attributes to the conflicting field; everything
          // else is form-level keyed by error.code — the flat {code,message} body
          // has no field array, so 422s are never field-attributed.
          if (err instanceof ApiRequestError && err.status === 409) {
            setError("agent_ref", { message: "Tác nhân với mã tham chiếu này đã tồn tại." });
          } else if (err instanceof ApiRequestError && err.status === 422) {
            setError("root", { message: `Không thể tạo tác nhân (${err.code ?? "validation failed"}).` });
          } else {
            setError("root", { message: "Không thể tạo tác nhân. Vui lòng thử lại." });
          }
        },
      },
    );
  });

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6 p-6 sm:p-8">
      <Link to="/agents" className="flex w-fit items-center gap-1 text-sm text-text-secondary hover:text-text-primary">
        <ArrowLeft className="size-4" aria-hidden /> Agents
      </Link>
      <h1 className="font-display text-3xl font-semibold text-text-primary">Tạo tác nhân</h1>

      <Card>
        <CardHeader>
          <CardTitle>Tác nhân mới</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
            {errors.root && (
              <p className="rounded-md border border-danger-border bg-danger-bg px-3 py-2 text-sm text-danger-fg" role="alert">
                {errors.root.message}
              </p>
            )}
            <Field id="agent_ref" label="Mã tham chiếu tác nhân" hint="Mã ổn định, ví dụ acme-support" error={errors.agent_ref?.message}>
              <Input id="agent_ref" placeholder="acme-support" className="font-mono" invalid={!!errors.agent_ref} {...register("agent_ref")} />
            </Field>
            <Field id="display_name" label="Tên hiển thị" error={errors.display_name?.message}>
              <Input id="display_name" placeholder="Acme Support" invalid={!!errors.display_name} {...register("display_name")} />
            </Field>
            <Field id="model" label="Mô hình" error={errors.model?.message}>
              <Input id="model" placeholder="gemini-2.5-flash" invalid={!!errors.model} {...register("model")} />
            </Field>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="system_prompt">Prompt hệ thống</Label>
              <textarea
                id="system_prompt"
                rows={4}
                className="flex w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-base text-text-primary shadow-xs focus-visible:border-brand-400 focus-visible:outline-none focus-visible:shadow-focus"
                {...register("system_prompt")}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button asChild variant="secondary" type="button">
                <Link to="/agents">Hủy</Link>
              </Button>
              <Button type="submit" loading={create.isPending}>
                Tạo tác nhân
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && !error && <p className="text-xs text-text-dim">{hint}</p>}
      {error && (
        <p className="text-xs text-danger-fg" aria-live="polite">
          {error}
        </p>
      )}
    </div>
  );
}
