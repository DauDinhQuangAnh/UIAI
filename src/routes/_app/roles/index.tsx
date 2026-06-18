import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { type FormEvent, useMemo, useState } from "react";
import { Plus, ShieldCheck } from "@phosphor-icons/react";
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
import { RoleDialog, type RoleForm } from "@/components/permissions/roles/role-dialog";
import { RoleTable } from "@/components/permissions/roles/role-table";
import { useCreateRole, useDeleteRole, useRoles, useUpdateRole } from "@/api/hooks/roles";
import type { Role } from "@/api/permission-types";
import { PERMISSIONS, usePermissionSet } from "@/auth/permissions";

const PAGE_SIZE = 20;

const EMPTY_FORM: RoleForm = {
  name: "",
  code: "",
  description: "",
  isActive: true,
};

export const Route = createFileRoute("/_app/roles/")({
  component: RoleListScreen,
});

function RoleListScreen() {
  const navigate = useNavigate();
  const can = usePermissionSet();
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>("all");
  const [pageNumber, setPageNumber] = useState(1);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState<RoleForm>(EMPTY_FORM);
  const [editTarget, setEditTarget] = useState<Role | null>(null);
  const [editForm, setEditForm] = useState<RoleForm>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);

  const params = useMemo(
    () => ({
      keyword: keyword.trim() || undefined,
      isActive: statusParam(statusFilter),
      pageNumber,
      pageSize: PAGE_SIZE,
    }),
    [keyword, pageNumber, statusFilter],
  );

  const roles = useRoles(params);
  const createRole = useCreateRole();
  const updateRole = useUpdateRole();
  const deleteRole = useDeleteRole();

  const items = roles.data?.items ?? [];
  const totalCount = roles.data?.totalCount ?? 0;
  const currentPage = roles.data?.pageNumber ?? pageNumber;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const openEdit = (role: Role) => {
    setEditTarget(role);
    setEditForm(formFromRole(role));
  };

  const submitAdd = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    createRole.mutate(createPayload(form), {
      onSuccess: () => {
        toast.success("Đã tạo vai trò.");
        setAddOpen(false);
        setForm(EMPTY_FORM);
      },
      onError: (error) => toast.error(apiErrorMessage(error, "Không thể tạo vai trò.")),
    });
  };

  const submitEdit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editTarget) return;
    updateRole.mutate(
      { id: editTarget.id, body: updatePayload(editForm) },
      {
        onSuccess: () => {
          toast.success("Đã cập nhật vai trò.");
          setEditTarget(null);
          setEditForm(EMPTY_FORM);
        },
        onError: (error) => toast.error(apiErrorMessage(error, "Không thể cập nhật vai trò.")),
      },
    );
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteRole.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success("Đã xóa vai trò.");
        setDeleteTarget(null);
      },
      onError: (error) => toast.error(apiErrorMessage(error, "Không thể xóa vai trò.")),
    });
  };

  return (
    <PermissionPageShell
      title="Danh sách vai trò"
      description="Quản lý role, trạng thái hoạt động và cấu hình quyền theo SAR Platform API."
      icon={ShieldCheck}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-semibold text-text-primary">Danh sách vai trò</h2>
            <p className="text-sm text-text-secondary">{totalCount} vai trò phù hợp với bộ lọc hiện tại.</p>
          </div>
          <Button type="button" size="sm" disabled={!can(PERMISSIONS.roles.create)} onClick={() => setAddOpen(true)}>
            <Plus className="size-4" aria-hidden />
            Thêm vai trò
          </Button>
        </div>

        <PermissionToolbar
          keyword={keyword}
          keywordPlaceholder="Tìm theo tên, mã vai trò..."
          status={statusFilter}
          onKeywordChange={(value) => {
            setKeyword(value);
            setPageNumber(1);
          }}
          onStatusChange={(value) => {
            setStatusFilter(value);
            setPageNumber(1);
          }}
        />

        {roles.isLoading ? (
          <div className="rounded-md border border-border bg-surface p-8 text-center text-sm text-text-secondary">
            Đang tải danh sách vai trò...
          </div>
        ) : roles.isError ? (
          <EmptyState
            icon={ShieldCheck}
            title="Không tải được danh sách vai trò"
            description={apiErrorMessage(roles.error, "Vui lòng thử lại sau.")}
            action={
              <Button type="button" variant="secondary" onClick={() => roles.refetch()}>
                Tải lại
              </Button>
            }
          />
        ) : items.length === 0 ? (
          <EmptyState icon={ShieldCheck} title="Chưa có vai trò" description="Tạo vai trò đầu tiên để gán quyền cho người dùng." />
        ) : (
          <>
            <RoleTable
              items={items}
              canUpdate={can(PERMISSIONS.roles.update)}
              canDelete={can(PERMISSIONS.roles.delete)}
              canViewRolePermissions={can(PERMISSIONS.rolePermissions.view)}
              onEdit={openEdit}
              onDelete={setDeleteTarget}
              onPermissions={(role) => navigate({ to: "/permissions/role-permissions", search: { roleId: role.id } })}
            />            <div className="flex items-center justify-between gap-3 text-sm text-text-secondary">
              <span>
                Trang {currentPage} / {totalPages}
              </span>
              <div className="flex gap-2">
                <Button type="button" variant="secondary" size="sm" disabled={currentPage <= 1} onClick={() => setPageNumber((page) => Math.max(1, page - 1))}>
                  Trước
                </Button>
                <Button type="button" variant="secondary" size="sm" disabled={currentPage >= totalPages} onClick={() => setPageNumber((page) => page + 1)}>
                  Sau
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      <RoleDialog
        open={addOpen}
        title="Thêm vai trò"
        description="Tạo role mới để gán nhóm quyền cho người dùng."
        form={form}
        loading={createRole.isPending}
        submitLabel="Tạo vai trò"
        onOpenChange={(open) => {
          setAddOpen(open);
          if (!open) setForm(EMPTY_FORM);
        }}
        onFormChange={setForm}
        onSubmit={submitAdd}
      />
      <RoleDialog
        open={!!editTarget}
        title="Sửa vai trò"
        description={`Cập nhật thông tin cho ${editTarget?.name ?? "vai trò"}.`}
        form={editForm}
        loading={updateRole.isPending}
        submitLabel="Lưu thay đổi"
        showStatus
        lockCode
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
        title="Xóa vai trò"
        description={
          deleteTarget?.isSystemRole
            ? `Bạn có chắc muốn xóa ${deleteTarget.name} không? Đây là vai trò hệ thống, backend có thể từ chối thao tác này.`
            : `Bạn có chắc muốn xóa ${deleteTarget?.name ?? "vai trò này"} không?`
        }
        loading={deleteRole.isPending}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </PermissionPageShell>
  );
}

function formFromRole(role: Role): RoleForm {
  return {
    name: role.name,
    code: role.code,
    description: role.description,
    isActive: role.isActive,
  };
}

function createPayload(form: RoleForm) {
  return {
    name: form.name.trim(),
    code: form.code.trim(),
    description: cleanOptional(form.description),
  };
}

function updatePayload(form: RoleForm) {
  return {
    name: form.name.trim(),
    description: cleanOptional(form.description),
    isActive: form.isActive,
  };
}
