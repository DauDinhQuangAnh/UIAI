import { TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import {
  ActiveBadge,
  PermissionActionButtons,
  PermissionDataTable,
  PermissionHeadCell,
  SystemBadge,
} from "@/components/permissions/permission-ui";
import type { PermissionAction } from "@/api/permission-types";

export function ActionTable({
  items,
  canUpdate,
  canDelete,
  onEdit,
  onDelete,
}: {
  items: PermissionAction[];
  canUpdate: boolean;
  canDelete: boolean;
  onEdit: (action: PermissionAction) => void;
  onDelete: (action: PermissionAction) => void;
}) {
  return (
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
                editDisabled={!canUpdate}
                deleteDisabled={!canDelete}
                editTitle={
                  !canUpdate
                    ? "Bạn không có quyền cập nhật"
                    : action.isSystemDefined
                      ? "Action hệ thống có thể được backend bảo vệ."
                      : undefined
                }
                deleteTitle={
                  !canDelete
                    ? "Bạn không có quyền xóa"
                    : action.isSystemDefined
                      ? "Action hệ thống có thể được backend bảo vệ."
                      : undefined
                }
                onEdit={() => onEdit(action)}
                onDelete={() => onDelete(action)}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </PermissionDataTable>
  );
}

