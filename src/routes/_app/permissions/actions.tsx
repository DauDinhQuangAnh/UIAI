import { createFileRoute } from "@tanstack/react-router";
import { type FormEvent, useMemo, useState } from "react";
import { Lightning, Plus } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/empty-state";
import {
  DeletePermissionDialog,
  PermissionPageShell,
  PermissionToolbar,
  apiErrorMessage,
  cleanOptional,
  statusParam,
  type StatusFilterValue,
} from "@/components/permissions/permission-ui";
import { ActionDialog, type ActionForm } from "@/components/permissions/actions/action-dialog";
import { ActionTable } from "@/components/permissions/actions/action-table";
import {
  useCreatePermissionAction,
  useDeletePermissionAction,
  usePermissionActions,
  useUpdatePermissionAction,
} from "@/api/hooks/permission-actions";
import { useSystemActionDefinitions } from "@/api/hooks/system-permission-definitions";
import type { PermissionAction } from "@/api/permission-types";
import { PERMISSIONS, usePermissionSet } from "@/auth/permissions";

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
          <ActionTable
            items={items}
            canUpdate={can(PERMISSIONS.actions.update)}
            canDelete={can(PERMISSIONS.actions.delete)}
            onEdit={(action) => {
              setEditTarget(action);
              setEditForm(formFromAction(action));
            }}
            onDelete={setDeleteTarget}
          />
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
