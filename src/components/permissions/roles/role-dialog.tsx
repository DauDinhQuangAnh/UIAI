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

export interface RoleForm {
  name: string;
  code: string;
  description: string;
  isActive: boolean;
}

export function RoleDialog({
  open,
  title,
  description,
  form,
  loading,
  submitLabel,
  showStatus,
  lockCode,
  onOpenChange,
  onFormChange,
  onSubmit,
}: {
  open: boolean;
  title: string;
  description: string;
  form: RoleForm;
  loading?: boolean;
  submitLabel: string;
  showStatus?: boolean;
  lockCode?: boolean;
  onOpenChange: (open: boolean) => void;
  onFormChange: (form: RoleForm) => void;
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
          <PermissionField label="Tên vai trò" htmlFor="role_name" required>
            <Input id="role_name" value={form.name} disabled={loading} onChange={(event) => onFormChange({ ...form, name: event.target.value })} required />
          </PermissionField>
          <PermissionField label="Mã vai trò" htmlFor="role_code" required>
            <Input
              id="role_code"
              value={form.code}
              disabled={loading || lockCode}
              onChange={(event) => onFormChange({ ...form, code: event.target.value })}
              required
            />
          </PermissionField>
          <PermissionField label="Mô tả" htmlFor="role_description">
            <Input id="role_description" value={form.description} disabled={loading} onChange={(event) => onFormChange({ ...form, description: event.target.value })} />
          </PermissionField>
          {showStatus && (
            <PermissionField label="Trạng thái" htmlFor="role_status">
              <Select value={String(form.isActive)} disabled={loading} onValueChange={(value) => onFormChange({ ...form, isActive: value === "true" })}>
                <SelectTrigger id="role_status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Hoạt động</SelectItem>
                  <SelectItem value="false">Không hoạt động</SelectItem>
                </SelectContent>
              </Select>
            </PermissionField>
          )}
          <DialogFooter className="mt-3">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" loading={loading}>
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

