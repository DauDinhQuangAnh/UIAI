import { createFileRoute } from "@tanstack/react-router";
import { type FormEvent, useMemo, useState } from "react";
import { Lightning, Plus } from "@phosphor-icons/react";
import { toast } from "sonner";
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
import { TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/common/empty-state";
import {
  ActiveBadge,
  DeletePermissionDialog,
  PermissionActionButtons,
  PermissionDataTable,
  PermissionField,
  PermissionHeadCell,
  PermissionPageShell,
  PermissionToolbar,
  SystemBadge,
  apiErrorMessage,
  cleanOptional,
  statusParam,
  type StatusFilterValue,
} from "@/components/permissions/permission-ui";
import {
  useCreatePermissionAction,
  useDeletePermissionAction,
  usePermissionActions,
  useUpdatePermissionAction,
} from "@/api/hooks/permission-actions";
import { useSystemActionDefinitions } from "@/api/hooks/system-permission-definitions";
import type { PermissionAction, SystemActionDefinition } from "@/api/permission-types";
import { PERMISSIONS, usePermissionSet } from "@/auth/permissions";

interface ActionForm {
  systemActionDefinitionId: string;
  name: string;
  description: string;
  isActive: boolean;
}

const EMPTY_FORM: ActionForm = {
  systemActionDefinitionId: "",
  name: "",
  description: "",
  isActive: true,
};

export const Route = createFileRoute("/_app/permissions/actions")({
  component: ActionConfigScreen,
});

function ActionConfigScreen() {
  const can = usePermissionSet();
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>("all");
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState<ActionForm>(EMPTY_FORM);
  const [editTarget, setEditTarget] = useState<PermissionAction | null>(null);
  const [editForm, setEditForm] = useState<ActionForm>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<PermissionAction | null>(null);

  const params = useMemo(() => ({ keyword: keyword.trim() || undefined, isActive: statusParam(statusFilter) }), [keyword, statusFilter]);
  const actions = usePermissionActions(params);
  const definitions = useSystemActionDefinitions();
  const createAction = useCreatePermissionAction();
  const updateAction = useUpdatePermissionAction();
  const deleteAction = useDeletePermissionAction();
  const items = actions.data ?? [];

  const submitAdd = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    createAction.mutate(payloadFromForm(form), {
      onSuccess: () => {
        toast.success("Đã tạo action.");
        setAddOpen(false);
        setForm(EMPTY_FORM);
      },
      onError: (error) => toast.error(apiErrorMessage(error, "Không thể tạo action.")),
    });
  };

  const submitEdit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editTarget) return;
    updateAction.mutate(
      { id: editTarget.id, body: { ...payloadFromForm(editForm), isActive: editForm.isActive } },
      {
        onSuccess: () => {
          toast.success("Đã cập nhật action.");
          setEditTarget(null);
          setEditForm(EMPTY_FORM);
        },
        onError: (error) => toast.error(apiErrorMessage(error, "Không thể cập nhật action.")),
      },
    );
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteAction.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success("Đã xóa action.");
        setDeleteTarget(null);
      },
      onError: (error) => toast.error(apiErrorMessage(error, "Không thể xóa action.")),
    });
  };

  return (
    <PermissionPageShell title="Cấu hình action" description="Quản lý các hành động quyền như VIEW, CREATE, UPDATE, DELETE." icon={Lightning}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-semibold text-text-primary">Cấu hình action</h2>
            <p className="text-sm text-text-secondary">{items.length} action phù hợp với bộ lọc hiện tại.</p>
          </div>
          <Button type="button" size="sm" disabled={!can(PERMISSIONS.actions.create)} onClick={() => setAddOpen(true)}>
            <Plus className="size-4" aria-hidden />
            Thêm action
          </Button>
        </div>
        <PermissionToolbar keyword={keyword} keywordPlaceholder="Tìm theo tên, mã action..." status={statusFilter} onKeywordChange={setKeyword} onStatusChange={setStatusFilter} />
        {actions.isLoading ? (
          <div className="rounded-md border border-border bg-surface p-8 text-center text-sm text-text-secondary">Đang tải action...</div>
        ) : actions.isError ? (
          <EmptyState icon={Lightning} title="Không tải được action" description={apiErrorMessage(actions.error, "Vui lòng thử lại sau.")} action={<Button type="button" variant="secondary" onClick={() => actions.refetch()}>Tải lại</Button>} />
        ) : items.length === 0 ? (
          <EmptyState icon={Lightning} title="Chưa có action" description="Tạo action từ system action definition để cấu hình permission code." />
        ) : (
          <PermissionDataTable className="min-w-[900px]">
            <TableHeader className="bg-brand-700">
              <TableRow className="hover:bg-brand-700">
                <PermissionHeadCell className="w-[22%]">Tên</PermissionHeadCell>
                <PermissionHeadCell className="w-[18%]">Mã</PermissionHeadCell>
                <PermissionHeadCell>Mô tả</PermissionHeadCell>
                <PermissionHeadCell className="w-[12%]">Loại</PermissionHeadCell>
                <PermissionHeadCell className="w-[12%]">Trạng thái</PermissionHeadCell>
                <PermissionHeadCell className="w-24 text-right">Thao tác</PermissionHeadCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((action) => (
                <TableRow key={action.id}>
                  <TableCell className="font-medium text-text-primary">{action.name}</TableCell>
                  <TableCell className="font-mono text-xs text-text-secondary">{action.code}</TableCell>
                  <TableCell className="text-sm text-text-secondary">{action.description || "-"}</TableCell>
                  <TableCell><SystemBadge system={action.isSystemDefined} /></TableCell>
                  <TableCell><ActiveBadge active={action.isActive} /></TableCell>
                  <TableCell>
                    <PermissionActionButtons
                      editLabel={`Sửa ${action.name}`}
                      deleteLabel={`Xóa ${action.name}`}
                      editDisabled={!can(PERMISSIONS.actions.update)}
                      deleteDisabled={!can(PERMISSIONS.actions.delete)}
                      editTitle={
                        !can(PERMISSIONS.actions.update)
                          ? "Bạn không có quyền cập nhật"
                          : action.isSystemDefined
                            ? "Action hệ thống có thể được backend bảo vệ."
                            : undefined
                      }
                      deleteTitle={
                        !can(PERMISSIONS.actions.delete)
                          ? "Bạn không có quyền xóa"
                          : action.isSystemDefined
                            ? "Action hệ thống có thể được backend bảo vệ."
                            : undefined
                      }
                      onEdit={() => {
                        setEditTarget(action);
                        setEditForm(formFromAction(action));
                      }}
                      onDelete={() => setDeleteTarget(action)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </PermissionDataTable>
        )}
      </div>
      <ActionDialog
        open={addOpen}
        title="Thêm action"
        description="Chọn system action definition và đặt tên hiển thị."
        form={form}
        definitions={definitions.data ?? []}
        loading={createAction.isPending || definitions.isLoading}
        submitLabel="Tạo action"
        onOpenChange={(open) => {
          setAddOpen(open);
          if (!open) setForm(EMPTY_FORM);
        }}
        onFormChange={setForm}
        onSubmit={submitAdd}
      />
      <ActionDialog
        open={!!editTarget}
        title="Sửa action"
        description={`Cập nhật thông tin cho ${editTarget?.name ?? "action"}.`}
        form={editForm}
        definitions={definitions.data ?? []}
        loading={updateAction.isPending || definitions.isLoading}
        submitLabel="Lưu thay đổi"
        showStatus
        onOpenChange={(open) => {
          if (!open) {
            setEditTarget(null);
            setEditForm(EMPTY_FORM);
          }
        }}
        onFormChange={setEditForm}
        onSubmit={submitEdit}
      />
      <DeletePermissionDialog
        open={!!deleteTarget}
        title="Xóa action"
        description={
          deleteTarget?.isSystemDefined
            ? `Bạn có chắc muốn xóa ${deleteTarget.name} không? Đây là dữ liệu hệ thống, backend có thể từ chối thao tác này.`
            : `Bạn có chắc muốn xóa ${deleteTarget?.name ?? "action này"} không?`
        }
        loading={deleteAction.isPending}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </PermissionPageShell>
  );
}

function ActionDialog({
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

function formFromAction(action: PermissionAction): ActionForm {
  return {
    systemActionDefinitionId: action.systemActionDefinitionId,
    name: action.name,
    description: action.description,
    isActive: action.isActive,
  };
}

function payloadFromForm(form: ActionForm) {
  return {
    systemActionDefinitionId: form.systemActionDefinitionId,
    name: form.name.trim(),
    description: cleanOptional(form.description),
  };
}
