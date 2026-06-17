import type { Icon } from "@phosphor-icons/react";
import { PencilSimple, Trash } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
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
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BusinessDataTable, BusinessHeadCell } from "@/components/business/business-management-table";
import { BusinessPageShell } from "@/components/business/business-page-shell";
import { ApiRequestError, errorMessage } from "@/api/errors";
import { cn } from "@/lib/cn";

export type StatusFilterValue = "all" | "active" | "inactive";

export function PermissionPageShell({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description: string;
  icon: Icon;
  children: React.ReactNode;
}) {
  return (
    <BusinessPageShell title={title} description={description} icon={icon} className="max-w-7xl">
      {children}
    </BusinessPageShell>
  );
}

export function PermissionDataTable({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <BusinessDataTable className={cn("min-w-[1180px]", className)}>{children}</BusinessDataTable>;
}

export function PermissionHeadCell({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <BusinessHeadCell className={className}>{children}</BusinessHeadCell>;
}

export function ActiveBadge({ active }: { active: boolean }) {
  return <Badge tone={active ? "success" : "neutral"}>{active ? "Hoạt động" : "Không hoạt động"}</Badge>;
}

export function SystemBadge({ system, label = "System" }: { system: boolean; label?: string }) {
  return <Badge tone={system ? "info" : "neutral"}>{system ? label : "Tùy chỉnh"}</Badge>;
}

export function PermissionToolbar({
  keyword,
  keywordPlaceholder,
  status,
  children,
  onKeywordChange,
  onStatusChange,
}: {
  keyword: string;
  keywordPlaceholder: string;
  status: StatusFilterValue;
  children?: React.ReactNode;
  onKeywordChange: (value: string) => void;
  onStatusChange: (value: StatusFilterValue) => void;
}) {
  return (
    <div className="grid gap-3 rounded-md border border-border bg-surface p-3 md:grid-cols-[1fr_14rem] lg:grid-cols-[1fr_14rem_auto]">
      <Input value={keyword} placeholder={keywordPlaceholder} onChange={(event) => onKeywordChange(event.target.value)} />
      <StatusSelect value={status} onChange={onStatusChange} />
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}

export function StatusSelect({
  value,
  onChange,
  disabled,
}: {
  value: StatusFilterValue;
  onChange: (value: StatusFilterValue) => void;
  disabled?: boolean;
}) {
  return (
    <Select value={value} disabled={disabled} onValueChange={(next) => onChange(next as StatusFilterValue)}>
      <SelectTrigger aria-label="Lọc trạng thái">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Tất cả trạng thái</SelectItem>
        <SelectItem value="active">Hoạt động</SelectItem>
        <SelectItem value="inactive">Không hoạt động</SelectItem>
      </SelectContent>
    </Select>
  );
}

export function PermissionActionButtons({
  editLabel,
  deleteLabel,
  editDisabled,
  deleteDisabled,
  editTitle,
  deleteTitle,
  onEdit,
  onDelete,
  children,
}: {
  editLabel: string;
  deleteLabel: string;
  editDisabled?: boolean;
  deleteDisabled?: boolean;
  editTitle?: string;
  deleteTitle?: string;
  onEdit?: () => void;
  onDelete?: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex justify-end gap-1">
      {children}
      <span title={editTitle} className="inline-flex">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={editLabel}
          className="size-8 border border-brand-100 bg-brand-50 text-brand-700 shadow-xs hover:border-brand-300 hover:bg-brand-100 hover:text-brand-900"
          disabled={editDisabled}
          onClick={onEdit}
        >
          <PencilSimple className="size-4" aria-hidden />
        </Button>
      </span>
      <span title={deleteTitle} className="inline-flex">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={deleteLabel}
          className="size-8 border border-danger-border bg-danger-bg text-danger-fg shadow-xs hover:border-danger-base hover:bg-danger-base hover:text-white"
          disabled={deleteDisabled}
          onClick={onDelete}
        >
          <Trash className="size-4" aria-hidden />
        </Button>
      </span>
    </div>
  );
}

export function DeletePermissionDialog({
  open,
  title,
  description,
  loading,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description: string;
  loading?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button type="button" variant="danger" loading={loading} onClick={onConfirm}>
            Xóa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function PermissionField({
  label,
  htmlFor,
  required,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-[10rem_1fr] sm:items-center">
      <Label htmlFor={htmlFor} className="text-brand-800">
        {label}
        {required && <span className="ml-1 text-danger-fg">*</span>}
      </Label>
      {children}
    </div>
  );
}

export function apiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiRequestError) return errorMessage(error.body, fallback);
  if (error instanceof Error && error.message === "permission_matrix_shape_unsupported") {
    return "Backend trả dữ liệu matrix chưa đúng định dạng FE hỗ trợ.";
  }
  return fallback;
}

export function statusParam(status: StatusFilterValue): boolean | undefined {
  return status === "all" ? undefined : status === "active";
}

export function formatDate(value: string | undefined): string {
  if (!value) return "-";
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value));
}

export function cleanOptional(value: string): string | null {
  const next = value.trim();
  return next.length > 0 ? next : null;
}
