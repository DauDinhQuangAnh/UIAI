import { Key } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import {
  ActiveBadge,
  PermissionActionButtons,
  PermissionDataTable,
  PermissionHeadCell,
  SystemBadge,
  formatDate,
} from "@/components/permissions/permission-ui";
import type { Role } from "@/api/permission-types";

export function RoleTable({
  items,
  canUpdate,
  canDelete,
  canViewRolePermissions,
  onEdit,
  onDelete,
  onPermissions,
}: {
  items: Role[];
  canUpdate: boolean;
  canDelete: boolean;
  canViewRolePermissions: boolean;
  onEdit: (role: Role) => void;
  onDelete: (role: Role) => void;
  onPermissions: (role: Role) => void;
}) {
  return (
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
                editDisabled={!canUpdate}
                deleteDisabled={!canDelete}
                editTitle={
                  !canUpdate
                    ? "Bạn không có quyền cập nhật"
                    : role.isSystemRole
                      ? "Vai trò hệ thống có thể được backend bảo vệ."
                      : undefined
                }
                deleteTitle={
                  !canDelete
                    ? "Bạn không có quyền xóa"
                    : role.isSystemRole
                      ? "Vai trò hệ thống có thể được backend bảo vệ."
                      : undefined
                }
                onEdit={() => onEdit(role)}
                onDelete={() => onDelete(role)}
              >
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Phân quyền ${role.name}`}
                  className="size-8 border border-info-border bg-info-bg text-info-fg shadow-xs hover:border-info-base hover:bg-info-base hover:text-white"
                  disabled={!canViewRolePermissions}
                  onClick={() => onPermissions(role)}
                >
                  <Key className="size-4" aria-hidden />
                </Button>
              </PermissionActionButtons>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </PermissionDataTable>
  );
}

