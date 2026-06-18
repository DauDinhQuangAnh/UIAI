import type { FormEvent } from "react";
import { PencilSimple } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PermissionField } from "@/components/permissions/permission-ui";

export interface FeatureForm {
  systemModuleDefinitionId: string;
  name: string;
  description: string;
  displayOrder: number;
  isActive: boolean;
}

export function FeatureDialog({
  open,
  title,
  description,
  form,
  modules,
  loading,
  submitLabel,
  showStatus,
  orderUnlocked,
  orderError,
  onUnlockOrder,
  onOpenChange,
  onFormChange,
  onSubmit,
}: {
  open: boolean;
  title: string;
  description: string;
  form: FeatureForm;
  modules: Array<{ id: string; name: string; code: string; isActive: boolean }>;
  loading?: boolean;
  submitLabel: string;
  showStatus?: boolean;
  orderUnlocked: boolean;
  orderError?: string;
  onUnlockOrder: () => void;
  onOpenChange: (open: boolean) => void;
  onFormChange: (form: FeatureForm) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader className="items-center text-center">
          <DialogTitle className="text-brand-800">{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-4">
          <PermissionField label="Module" htmlFor="feature_module" required>
            <Select
              value={form.systemModuleDefinitionId}
              disabled={loading}
              onValueChange={(value) => {
                const module = modules.find((item) => item.id === value);
                onFormChange({ ...form, systemModuleDefinitionId: value, name: form.name || module?.name || "" });
              }}
            >
              <SelectTrigger id="feature_module">
                <SelectValue placeholder="Chọn module" />
              </SelectTrigger>
              <SelectContent>
                {modules.filter((item) => item.isActive).map((item) => (
                  <SelectItem key={item.id} value={item.id}>{item.name} ({item.code})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </PermissionField>
          <PermissionField label="Tên feature" htmlFor="feature_name" required>
            <Input id="feature_name" value={form.name} disabled={loading} onChange={(event) => onFormChange({ ...form, name: event.target.value })} required />
          </PermissionField>
          <PermissionField label="Mô tả" htmlFor="feature_description">
            <Input id="feature_description" value={form.description} disabled={loading} onChange={(event) => onFormChange({ ...form, description: event.target.value })} />
          </PermissionField>
          <PermissionField label="Thứ tự" htmlFor="feature_order" required>
            <div className="grid gap-1">
              <div className="grid grid-cols-[1fr_auto] gap-2">
                <Input
                  id="feature_order"
                  type="number"
                  min={1}
                  step={1}
                  value={form.displayOrder}
                  readOnly={!orderUnlocked}
                  disabled={loading}
                  invalid={!!orderError}
                  onChange={(event) => onFormChange({ ...form, displayOrder: Number(event.target.value) })}
                  required
                />
                <Button type="button" variant="secondary" size="sm" disabled={loading || orderUnlocked} onClick={onUnlockOrder}>
                  <PencilSimple className="size-4" aria-hidden />
                  Chỉnh
                </Button>
              </div>
              <p className="text-xs text-text-secondary">
                Hệ thống tự đề xuất thứ tự tiếp theo. Bấm Chỉnh nếu muốn thay đổi.
              </p>
              {orderError && <p className="text-xs font-medium text-danger-fg">{orderError}</p>}
            </div>
          </PermissionField>
          {showStatus && (
            <PermissionField label="Trạng thái" htmlFor="feature_status">
              <Select value={String(form.isActive)} disabled={loading} onValueChange={(value) => onFormChange({ ...form, isActive: value === "true" })}>
                <SelectTrigger id="feature_status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Hoạt động</SelectItem>
                  <SelectItem value="false">Không hoạt động</SelectItem>
                </SelectContent>
              </Select>
            </PermissionField>
          )}
          <DialogFooter className="mt-3">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>Hủy</Button>
            <Button type="submit" loading={loading} disabled={!!orderError}>{submitLabel}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

