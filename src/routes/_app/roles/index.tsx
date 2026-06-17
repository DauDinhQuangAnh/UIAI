import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { type FormEvent, useMemo, useState } from "react";
import { Key, Plus, ShieldCheck } from "@phosphor-icons/react";
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
  apiErrorMessage,
  cleanOptional,
  formatDate,
  statusParam,
  type StatusFilterValue,
  SystemBadge,
} from "@/components/permissions/permission-ui";
import { useCreateRole, useDeleteRole, useRoles, useUpdateRole } from "@/api/hooks/roles";
import type { Role } from "@/api/permission-types";
import { PERMISSIONS, usePermissionSet } from "@/auth/permissions";

const PAGE_SIZE = 20;

interface RoleForm {
  name: string;
  code: string;
  description: string;
  isActive: boolean;
}

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
            <PermissionDataTable>
              <TableHeader className="bg-brand-700">
                <TableRow className="hover:bg-brand-700">
                  <PermissionHeadCell className="w-[18%]">Tên</PermissionHeadCell>
                  <PermissionHeadCell className="w-[16%]">Mã</PermissionHeadCell>
                  <PermissionHeadCell>Mô tả</PermissionHeadCell>
                  <PermissionHeadCell className="w-[12%]">Loại</PermissionHeadCell>
                  <PermissionHeadCell className="w-[12%]">Trạng thái</PermissionHeadCell>
                  <PermissionHeadCell className="w-[12%]">Ngày tạo</PermissionHeadCell>
                  <PermissionHeadCell className="w-32 text-right">Thao tác</PermissionHeadCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell className="font-medium text-text-primary">{role.name}</TableCell>
                    <TableCell className="font-mono text-xs text-text-secondary">{role.code}</TableCell>
                    <TableCell className="text-sm text-text-secondary">{role.description || "-"}</TableCell>
                    <TableCell>
                      <SystemBadge system={role.isSystemRole} label="System role" />
                    </TableCell>
                    <TableCell>
                      <ActiveBadge active={role.isActive} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-text-secondary">{formatDate(role.createdAt)}</TableCell>
                    <TableCell>
                      <PermissionActionButtons
                        editLabel={`Sửa ${role.name}`}
                        deleteLabel={`Xóa ${role.name}`}
                        editDisabled={!can(PERMISSIONS.roles.update)}
                        deleteDisabled={!can(PERMISSIONS.roles.delete)}
                        editTitle={
                          !can(PERMISSIONS.roles.update)
                            ? "Bạn không có quyền cập nhật"
                            : role.isSystemRole
                              ? "Vai trò hệ thống có thể được backend bảo vệ."
                              : undefined
                        }
                        deleteTitle={
                          !can(PERMISSIONS.roles.delete)
                            ? "Bạn không có quyền xóa"
                            : role.isSystemRole
                              ? "Vai trò hệ thống có thể được backend bảo vệ."
                              : undefined
                        }
                        onEdit={() => openEdit(role)}
                        onDelete={() => setDeleteTarget(role)}
                      >
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={`Phân quyền ${role.name}`}
                          className="size-8 border border-info-border bg-info-bg text-info-fg shadow-xs hover:border-info-base hover:bg-info-base hover:text-white"
                          disabled={!can(PERMISSIONS.rolePermissions.view)}
                          onClick={() => navigate({ to: "/permissions/role-permissions", search: { roleId: role.id } })}
                        >
                          <Key className="size-4" aria-hidden />
                        </Button>
                      </PermissionActionButtons>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </PermissionDataTable>
            <div className="flex items-center justify-between gap-3 text-sm text-text-secondary">
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

function RoleDialog({
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
