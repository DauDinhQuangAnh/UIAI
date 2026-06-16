import { Badge } from "@/components/ui/badge";
import { TabsContent } from "@/components/ui/tabs";
import { TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import {
  BusinessActionButtons,
  BusinessDataTable,
  BusinessHeadCell,
} from "@/components/business/business-management-table";
import { STATUS_TONE, type Platform, type SocialLink } from "./social-media-data";

export function SocialLinksTable({
  platform,
  links,
  onEdit,
  onDelete,
}: {
  platform: Platform;
  links: SocialLink[];
  onEdit: (link: SocialLink) => void;
  onDelete: (link: SocialLink) => void;
}) {
  const rows = links.filter((link) => link.platform === platform);

  return (
    <TabsContent value={platform} className="mt-0">
      <BusinessDataTable className="min-w-[980px]">
        <TableHeader className="bg-brand-700">
          <TableRow className="hover:bg-brand-700">
            <BusinessHeadCell className="w-[28%]">Doanh nghiệp</BusinessHeadCell>
            <BusinessHeadCell className="w-[28%]">Trang</BusinessHeadCell>
            <BusinessHeadCell className="w-[18%]">Mã trang</BusinessHeadCell>
            <BusinessHeadCell className="w-[14%]">Trạng thái</BusinessHeadCell>
            <BusinessHeadCell className="w-28 text-right">Thao tác</BusinessHeadCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((link) => (
            <TableRow key={link.id}>
              <TableCell className="font-medium">{link.business}</TableCell>
              <TableCell className="text-text-secondary">{link.page}</TableCell>
              <TableCell className="whitespace-nowrap font-mono text-xs text-text-secondary">{link.pageId}</TableCell>
              <TableCell>
                <Badge tone={STATUS_TONE[link.status]}>{link.status}</Badge>
              </TableCell>
              <TableCell>
                <BusinessActionButtons
                  editLabel={`Chỉnh sửa ${link.page}`}
                  deleteLabel={`Xóa ${link.page}`}
                  onEdit={() => onEdit(link)}
                  onDelete={() => onDelete(link)}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </BusinessDataTable>
    </TabsContent>
  );
}
