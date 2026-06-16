import { Badge } from "@/components/ui/badge";
import { TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import {
  BusinessActionButtons,
  BusinessDataTable,
  BusinessHeadCell,
} from "@/components/business/business-management-table";
import type { BusinessPartner } from "./business-information-data";

export function BusinessInformationTable({
  businesses,
  onEdit,
  onDelete,
}: {
  businesses: BusinessPartner[];
  onEdit: (business: BusinessPartner) => void;
  onDelete: (business: BusinessPartner) => void;
}) {
  return (
    <BusinessDataTable>
      <TableHeader className="bg-brand-700">
        <TableRow className="hover:bg-brand-700">
          <BusinessHeadCell className="w-[22%]">Doanh nghiệp</BusinessHeadCell>
          <BusinessHeadCell className="w-[22%]">Liên hệ chủ doanh nghiệp</BusinessHeadCell>
          <BusinessHeadCell className="w-[22%]">Người đại diện</BusinessHeadCell>
          <BusinessHeadCell className="w-[10%]">Trạng thái</BusinessHeadCell>
          <BusinessHeadCell className="w-[12%]">Ngày tạo</BusinessHeadCell>
          <BusinessHeadCell className="w-24 text-right">Thao tác</BusinessHeadCell>
        </TableRow>
      </TableHeader>
      <TableBody>
        {businesses.map((business) => (
          <TableRow key={business.id}>
            <TableCell>
              <div className="flex min-w-0 flex-col gap-1">
                <span className="font-medium text-text-primary">{business.brandName}</span>
                {business.logoUrl && (
                  <span className="truncate text-xs text-text-dim">{business.logoUrl}</span>
                )}
              </div>
            </TableCell>
            <TableCell>
              <ContactBlock email={business.email} phone={business.phone} />
            </TableCell>
            <TableCell>
              <ContactBlock name={business.representativeName} email={business.representativeEmail} />
            </TableCell>
            <TableCell>
              <Badge tone={business.isActive ? "success" : "neutral"}>
                {business.isActive ? "Hoạt động" : "Không hoạt động"}
              </Badge>
            </TableCell>
            <TableCell className="whitespace-nowrap text-sm text-text-secondary">
              {formatDate(business.createdAt)}
            </TableCell>
            <TableCell>
              <BusinessActionButtons
                editLabel={`Chỉnh sửa ${business.brandName}`}
                deleteLabel={`Xóa ${business.brandName}`}
                onEdit={() => onEdit(business)}
                onDelete={() => onDelete(business)}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </BusinessDataTable>
  );
}

function ContactBlock({ name, email, phone }: { name?: string; email?: string; phone?: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      {name && <span className="truncate text-sm font-medium text-text-primary">{name}</span>}
      {email && <span className="truncate font-mono text-xs text-text-secondary">{email}</span>}
      {phone && <span className="whitespace-nowrap font-mono text-xs text-text-secondary">{phone}</span>}
    </div>
  );
}

function formatDate(value: string | undefined): string {
  if (!value) return "-";
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(
    new Date(value),
  );
}
