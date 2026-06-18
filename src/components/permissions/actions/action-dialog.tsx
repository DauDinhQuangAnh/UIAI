import type { FormEvent } from "react";
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
import type { SystemActionDefinition } from "@/api/permission-types";

export interface ActionForm {
  systemActionDefinitionId: string;
  name: string;
  description: string;
  isActive: boolean;
}

export function ActionDialog({
  open,
  title,
  description,
  form,
  definitions,
  loading,
  submitLabel,
  showStatus,
  onOpenChange,
  onFormChange,
  onSubmit,
}: {
  open: boolean;
  title: string;
  description: string;
  form: ActionForm;
  definitions: SystemActionDefinition[];
  loading?: boolean;
  submitLabel: string;
  showStatus?: boolean;
  onOpenChange: (open: boolean) => void;
  onFormChange: (form: ActionForm) => void;
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
          <PermissionField label="Action definition" htmlFor="action_definition" required>
            <Select
              value={form.systemActionDefinitionId}
              disabled={loading}
              onValueChange={(value) => {
                const definition = definitions.find((item) => item.id === value);
                onFormChange({ ...form, systemActionDefinitionId: value, name: form.name || definition?.name || "" });
              }}
            >
              <SelectTrigger id="action_definition"><SelectValue placeholder="Chọn action definition" /></SelectTrigger>
              <SelectContent>
                {definitions.filter((item) => item.isActive).map((item) => (
                  <SelectItem key={item.id} value={item.id}>{item.name} ({item.code})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </PermissionField>
          <PermissionField label="Tên action" htmlFor="action_name" required>
            <Input id="action_name" value={form.name} disabled={loading} onChange={(event) => onFormChange({ ...form, name: event.target.value })} required />
          </PermissionField>
          <PermissionField label="Mô tả" htmlFor="action_description">
            <Input id="action_description" value={form.description} disabled={loading} onChange={(event) => onFormChange({ ...form, description: event.target.value })} />
          </PermissionField>
          {showStatus && (
            <PermissionField label="Trạng thái" htmlFor="action_status">
              <Select value={String(form.isActive)} disabled={loading} onValueChange={(value) => onFormChange({ ...form, isActive: value === "true" })}>
                <SelectTrigger id="action_status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Hoạt động</SelectItem>
                  <SelectItem value="false">Không hoạt động</SelectItem>
                </SelectContent>
              </Select>
            </PermissionField>
          )}
          <DialogFooter className="mt-3">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>Hủy</Button>
            <Button type="submit" loading={loading}>{submitLabel}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

