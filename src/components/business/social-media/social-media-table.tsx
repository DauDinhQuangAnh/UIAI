import { PencilSimple, Trash } from "@phosphor-icons/react";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { BusinessDataTable, BusinessHeadCell } from "@/components/business/business-management-table";
import type { SocialMediaTableRow } from "./social-media-models";
import { displayPageName } from "./social-media-utils";

export function SocialMediaIntegrationsTable({
  rows,
  onManage,
  onDelete,
}: {
  rows: SocialMediaTableRow[];
  onManage: (row: SocialMediaTableRow) => void;
  onDelete: (row: SocialMediaTableRow) => void;
}) {
  return (
    <BusinessDataTable className="min-w-[900px] table-fixed">
      <TableHeader className="bg-brand-700">
        <TableRow className="hover:bg-brand-700">
          <BusinessHeadCell className="w-[28%] whitespace-nowrap uppercase">Doanh nghiệp</BusinessHeadCell>
          <BusinessHeadCell className="w-[26%] whitespace-nowrap uppercase">Trang</BusinessHeadCell>
          <BusinessHeadCell className="w-[18%] whitespace-nowrap uppercase">ID trang</BusinessHeadCell>
          <BusinessHeadCell className="w-[16%] whitespace-nowrap text-center uppercase">Trạng thái</BusinessHeadCell>
          <BusinessHeadCell className="w-[12%] whitespace-nowrap text-center uppercase">Hành động</BusinessHeadCell>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <IntegrationTableRow
            key={row.rowKey}
            row={row}
            onManage={onManage}
            onDelete={onDelete}
          />
        ))}
      </TableBody>
    </BusinessDataTable>
  );
}

function IntegrationTableRow({
  row,
  onManage,
  onDelete,
}: {
  row: SocialMediaTableRow;
  onManage: (row: SocialMediaTableRow) => void;
  onDelete: (row: SocialMediaTableRow) => void;
}) {
  const { business, integration, page } = row;

  return (
    <TableRow>
      <TableCell className="h-14">
        <div className="truncate font-medium">{business.brandName}</div>
      </TableCell>
      <TableCell className="h-14">
        <span className="block truncate">{displayPageName(page, integration)}</span>
      </TableCell>
      <TableCell className="h-14 font-mono text-sm">
        <span className="block truncate">{page?.externalPageId || "-"}</span>
      </TableCell>
      <TableCell className="h-14 text-center">
        <div className="flex justify-center">
          <IntegrationStatusBadge status={page?.status || integration.status} />
        </div>
      </TableCell>
      <TableCell className="h-14 text-center">
        <div className="flex justify-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Chỉnh sửa liên kết"
            className="size-9 border border-brand-100 bg-brand-50 text-brand-700 shadow-xs hover:border-brand-300 hover:bg-brand-100 hover:text-brand-900"
            onClick={() => onManage(row)}
          >
            <PencilSimple className="size-4" aria-hidden />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Xóa liên kết"
            className="size-9 border border-danger-border bg-danger-bg text-danger-fg shadow-xs hover:border-danger-base hover:bg-danger-base hover:text-white"
            onClick={() => onDelete(row)}
          >
            <Trash className="size-4" aria-hidden />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

function IntegrationStatusBadge({ status }: { status: string }) {
  const normalized = status.trim().toLowerCase();
  const display: { label: string; tone: BadgeProps["tone"] } =
    normalized === "configured"
      ? { label: "Đã cấu hình", tone: "info" }
      : normalized === "authorized"
        ? { label: "Đã ủy quyền", tone: "success" }
        : normalized === "pendingauthorization"
          ? { label: "Chờ ủy quyền", tone: "warning" }
          : normalized === "active"
            ? { label: "Active", tone: "success" }
            : normalized === "inactive"
              ? { label: "Inactive", tone: "neutral" }
              : { label: status || "Chưa rõ", tone: "neutral" };

  return <Badge tone={display.tone}>{display.label}</Badge>;
}

