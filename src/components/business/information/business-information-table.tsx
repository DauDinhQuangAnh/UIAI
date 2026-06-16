import { Badge } from "@/components/ui/badge";
import { TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import {
  BusinessActionButtons,
  BusinessDataTable,
  BusinessHeadCell,
} from "@/components/business/business-management-table";
import type { Business } from "./business-information-data";

export function BusinessInformationTable({
  businesses,
  onEdit,
  onDelete,
}: {
  businesses: Business[];
  onEdit: (business: Business) => void;
  onDelete: (business: Business) => void;
}) {
  return (
    <BusinessDataTable>
      <TableHeader className="bg-brand-700">
        <TableRow className="hover:bg-brand-700">
          <BusinessHeadCell className="w-[24%]">Doanh nghiệp</BusinessHeadCell>
          <BusinessHeadCell className="w-[32%]">Địa chỉ</BusinessHeadCell>
          <BusinessHeadCell className="w-[12%]">SĐT</BusinessHeadCell>
          <BusinessHeadCell className="w-[16%]">Email</BusinessHeadCell>
          <BusinessHeadCell className="w-[8%]">Trạng thái</BusinessHeadCell>
          <BusinessHeadCell className="w-[10%]">Chủ doanh nghiệp</BusinessHeadCell>
          <BusinessHeadCell className="w-24 text-right">Thao tác</BusinessHeadCell>
        </TableRow>
      </TableHeader>
      <TableBody>
        {businesses.map((business) => (
          <TableRow key={business.id}>
            <TableCell className="font-medium">{business.name}</TableCell>
            <TableCell className="text-text-secondary">{business.address}</TableCell>
            <TableCell className="whitespace-nowrap font-mono text-xs text-text-secondary">{business.phone}</TableCell>
            <TableCell className="whitespace-nowrap font-mono text-xs text-text-secondary">{business.email}</TableCell>
            <TableCell>
              <Badge tone={business.status === "Hoạt động" ? "success" : "neutral"}>{business.status}</Badge>
            </TableCell>
            <TableCell className="whitespace-nowrap">{business.owner}</TableCell>
            <TableCell>
              <BusinessActionButtons
                editLabel={`Chỉnh sửa ${business.name}`}
                deleteLabel={`Xóa ${business.name}`}
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
