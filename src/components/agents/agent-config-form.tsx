import { forwardRef, useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useUpdateAgent, type Agent, type AgentPatch } from "@/api/hooks/agents";
import { ApiRequestError } from "@/api/errors";

// Retrieval ranges are NOT in the OpenAPI schema; mirror the server clamp
// constants (internal/agent agents.go: top_k 1–20, weights 0–1). The server
// clamps regardless, so on success we refetch the clamped server values.
const configSchema = z.object({
  display_name: z.string().max(200).optional(),
  system_prompt: z.string().max(20000).optional(),
  model: z.string().max(200).optional(),
  debounce_ms: z.coerce.number().int().min(0).max(600000).optional(),
  history_turns: z.coerce.number().int().min(0).max(100).optional(),
  max_output_tokens: z.coerce.number().int().min(1).max(32000).optional(),
  top_k: z.coerce.number().int().min(1).max(20),
  vector_weight: z.coerce.number().min(0).max(1),
  fts_weight: z.coerce.number().min(0).max(1),
  kg_enabled: z.boolean(),
});
type ConfigForm = z.infer<typeof configSchema>;

function toDefaults(a: Agent): ConfigForm {
  return {
    display_name: a.display_name ?? "",
    system_prompt: a.system_prompt ?? "",
    model: a.model ?? "",
    debounce_ms: a.debounce_ms ?? 0,
    history_turns: a.history_turns ?? 0,
    max_output_tokens: a.max_output_tokens ?? 1,
    top_k: a.retrieval_config?.top_k ?? 5,
    vector_weight: a.retrieval_config?.vector_weight ?? 0.5,
    fts_weight: a.retrieval_config?.fts_weight ?? 0.5,
    kg_enabled: a.kg_enabled ?? false,
  };
}

export function AgentConfigForm({ agent, readOnly }: { agent: Agent; readOnly: boolean }) {
  const update = useUpdateAgent(agent.id!);
  const [kgError, setKgError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isDirty },
    // zod 4 types `z.coerce.number()` input as `unknown` (string from the <input>,
    // coerced to number on parse). Pass input/output generics so the registered
    // field values stay loose while handleSubmit receives the coerced ConfigForm.
  } = useForm<z.input<typeof configSchema>, unknown, ConfigForm>({
    resolver: zodResolver(configSchema),
    defaultValues: toDefaults(agent),
  });

  // Refetch-on-success replaces the form with the clamped server truth.
  useEffect(() => {
    reset(toDefaults(agent));
  }, [agent, reset]);

  const onSubmit = handleSubmit((v) => {
    setKgError(null);
    const patch: AgentPatch = {
      display_name: v.display_name,
      system_prompt: v.system_prompt,
      model: v.model,
      debounce_ms: v.debounce_ms,
      history_turns: v.history_turns,
      max_output_tokens: v.max_output_tokens,
      kg_enabled: v.kg_enabled,
      retrieval_config: { top_k: v.top_k, vector_weight: v.vector_weight, fts_weight: v.fts_weight },
    };
    update.mutate(patch, {
      onSuccess: () => toast.success("Cấu hình đã được lưu."),
      onError: (err) => {
        // Flat {code,message} body -> form-level message keyed by code. The KG
        // infra-off case is the canonical instance: attach to the toggle inline.
        if (err instanceof ApiRequestError && err.code === "kg_infra_unavailable") {
          setKgError("Không thể sử dụng Knowledge Graph grounding trong workspace này lúc này.");
        } else {
          toast.error(err instanceof ApiRequestError ? `Không thể lưu (${err.code ?? "error"}).` : "Không thể lưu.");
        }
      },
    });
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Chung</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <TextField id="display_name" label="Display name" disabled={readOnly} error={errors.display_name?.message} {...register("display_name")} />
          <TextField id="model" label="Model" disabled={readOnly} error={errors.model?.message} {...register("model")} />
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="system_prompt">System prompt</Label>
            <textarea
              id="system_prompt"
              rows={5}
              disabled={readOnly}
              className="flex w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-base text-text-primary shadow-xs focus-visible:border-brand-400 focus-visible:outline-none focus-visible:shadow-focus disabled:opacity-60"
              {...register("system_prompt")}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Chạy thời gian</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <NumberField id="debounce_ms" label="Debounce (ms)" disabled={readOnly} error={errors.debounce_ms?.message} {...register("debounce_ms")} />
          <NumberField id="history_turns" label="Số lượt lịch sử" disabled={readOnly} error={errors.history_turns?.message} {...register("history_turns")} />
          <NumberField id="max_output_tokens" label="Số token đầu ra tối đa" disabled={readOnly} error={errors.max_output_tokens?.message} {...register("max_output_tokens")} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Truy xuất</CardTitle>
          <CardDescription>Máy chủ tự giới hạn theo ngưỡng (top_k 1–20, trọng số 0–1).</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <NumberField id="top_k" label="Top K (1–20)" step="1" disabled={readOnly} error={errors.top_k?.message} {...register("top_k")} />
          <NumberField id="vector_weight" label="Trọng số vector (0–1)" step="0.05" disabled={readOnly} error={errors.vector_weight?.message} {...register("vector_weight")} />
          <NumberField id="fts_weight" label="Trọng số FTS (0–1)" step="0.05" disabled={readOnly} error={errors.fts_weight?.message} {...register("fts_weight")} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Knowledge Graph</CardTitle>
          <CardDescription>Dùng entity graph để làm nền cho phản hồi.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Controller
            control={control}
            name="kg_enabled"
            render={({ field }) => (
              <div className="flex items-center gap-3">
                <Switch id="kg_enabled" checked={field.value} onCheckedChange={field.onChange} disabled={readOnly} />
                <Label htmlFor="kg_enabled">Grounding KG {field.value ? "bật" : "tắt"}</Label>
              </div>
            )}
          />
          {kgError && (
            <p className="text-sm text-danger-fg" role="alert" aria-live="polite">
              {kgError}
            </p>
          )}
        </CardContent>
      </Card>

      {!readOnly && (
        <div className="flex justify-end">
          <Button type="submit" loading={update.isPending} disabled={!isDirty}>
            Lưu thay đổi
          </Button>
        </div>
      )}
    </form>
  );
}

interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  error?: string;
}

// forwardRef so react-hook-form's register() ref (spread onto the field) reaches
// the underlying <input> — a plain function component would swallow it.
function fieldFactory(type: string) {
  return forwardRef<HTMLInputElement, FieldProps>(function FieldImpl({ id, label, error, ...rest }, ref) {
    return (
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={id}>{label}</Label>
        <Input id={id} type={type} invalid={!!error} ref={ref} {...rest} />
        {error && (
          <p className="text-xs text-danger-fg" aria-live="polite">
            {error}
          </p>
        )}
      </div>
    );
  });
}

const TextField = fieldFactory("text");
const NumberField = fieldFactory("number");
