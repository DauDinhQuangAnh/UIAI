import { TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import {
  ActiveBadge,
  PermissionActionButtons,
  PermissionDataTable,
  PermissionHeadCell,
  SystemBadge,
} from "@/components/permissions/permission-ui";
import type { Feature } from "@/api/permission-types";

export function FeatureTable({
  items,
  canUpdate,
  canDelete,
  onEdit,
  onDelete,
}: {
  items: Feature[];
  canUpdate: boolean;
  canDelete: boolean;
  onEdit: (feature: Feature) => void;
  onDelete: (feature: Feature) => void;
}) {
  return (
    <PermissionDataTable>
      <TableHeader className="bg-brand-700">
        <TableRow className="hover:bg-brand-700">
          <PermissionHeadCell className="w-[18%]">Tên</PermissionHeadCell>
          <PermissionHeadCell className="w-[16%]">Mã</PermissionHeadCell>
          <PermissionHeadCell>Mô tả</PermissionHeadCell>
          <PermissionHeadCell className="w-[10%]">Thứ tự</PermissionHeadCell>
          <PermissionHeadCell className="w-[12%]">Loại</PermissionHeadCell>
          <PermissionHeadCell className="w-[12%]">Trạng thái</PermissionHeadCell>
          <PermissionHeadCell className="w-24 text-right">Thao tác</PermissionHeadCell>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((feature) => (
          <TableRow key={feature.id}>
            <TableCell className="font-medium text-text-primary">{feature.name}</TableCell>
            <TableCell className="font-mono text-xs text-text-secondary">{feature.code}</TableCell>
            <TableCell className="text-sm text-text-secondary">{feature.description || "-"}</TableCell>
            <TableCell className="font-mono text-sm">{feature.displayOrder}</TableCell>
            <TableCell><SystemBadge system={feature.isSystemDefined} /></TableCell>
            <TableCell><ActiveBadge active={feature.isActive} /></TableCell>
            <TableCell>
              <PermissionActionButtons
                editLabel={`Sửa ${feature.name}`}
                deleteLabel={`Xóa ${feature.name}`}
                editDisabled={!canUpdate}
                deleteDisabled={!canDelete}
                editTitle={
                  !canUpdate
                    ? "Bạn không có quyền cập nhật"
                    : feature.isSystemDefined
                      ? "Feature hệ thống có thể được backend bảo vệ."
                      : undefined
                }
                deleteTitle={
                  !canDelete
                    ? "Bạn không có quyền xóa"
                    : feature.isSystemDefined
                      ? "Feature hệ thống có thể được backend bảo vệ."
                      : undefined
                }
                onEdit={() => onEdit(feature)}
                onDelete={() => onDelete(feature)}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </PermissionDataTable>
  );
}

