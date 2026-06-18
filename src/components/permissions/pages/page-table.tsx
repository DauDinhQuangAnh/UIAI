import { TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import {
  ActiveBadge,
  PermissionActionButtons,
  PermissionDataTable,
  PermissionHeadCell,
  SystemBadge,
} from "@/components/permissions/permission-ui";
import type { Page } from "@/api/permission-types";

export function PageTable({
  items,
  canUpdate,
  canDelete,
  onEdit,
  onDelete,
}: {
  items: Page[];
  canUpdate: boolean;
  canDelete: boolean;
  onEdit: (page: Page) => void;
  onDelete: (page: Page) => void;
}) {
  return (
    <PermissionDataTable>
      <TableHeader className="bg-brand-700">
        <TableRow className="hover:bg-brand-700">
          <PermissionHeadCell className="w-[14%]">Feature</PermissionHeadCell>
          <PermissionHeadCell className="w-[16%]">Tên</PermissionHeadCell>
          <PermissionHeadCell className="w-[14%]">Mã</PermissionHeadCell>
          <PermissionHeadCell>Route</PermissionHeadCell>
          <PermissionHeadCell className="w-[10%]">Icon</PermissionHeadCell>
          <PermissionHeadCell className="w-[8%]">Thứ tự</PermissionHeadCell>
          <PermissionHeadCell className="w-[10%]">Menu</PermissionHeadCell>
          <PermissionHeadCell className="w-[10%]">Trạng thái</PermissionHeadCell>
          <PermissionHeadCell className="w-24 text-right">Thao tác</PermissionHeadCell>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((page) => (
          <TableRow key={page.id}>
            <TableCell className="text-sm text-text-secondary">{page.featureName}</TableCell>
            <TableCell className="font-medium text-text-primary">{page.name}</TableCell>
            <TableCell className="font-mono text-xs text-text-secondary">{page.code}</TableCell>
            <TableCell className="font-mono text-xs text-text-secondary">{page.route || "-"}</TableCell>
            <TableCell className="font-mono text-xs text-text-secondary">{page.icon || "-"}</TableCell>
            <TableCell className="font-mono text-sm">{page.displayOrder}</TableCell>
            <TableCell><SystemBadge system={page.isMenuVisible} label="Hiện" /></TableCell>
            <TableCell><ActiveBadge active={page.isActive} /></TableCell>
            <TableCell>
              <PermissionActionButtons
                editLabel={`Sửa ${page.name}`}
                deleteLabel={`Xóa ${page.name}`}
                editDisabled={!canUpdate}
                deleteDisabled={!canDelete}
                editTitle={
                  !canUpdate
                    ? "Bạn không có quyền cập nhật"
                    : page.isSystemDefined
                      ? "Page hệ thống có thể được backend bảo vệ."
                      : undefined
                }
                deleteTitle={
                  !canDelete
                    ? "Bạn không có quyền xóa"
                    : page.isSystemDefined
                      ? "Page hệ thống có thể được backend bảo vệ."
                      : undefined
                }
                onEdit={() => onEdit(page)}
                onDelete={() => onDelete(page)}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </PermissionDataTable>
  );
}

