import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { SocialLink } from "./social-media-data";

export function DeleteSocialLinkDialog({
  target,
  onOpenChange,
  onConfirm,
}: {
  target: SocialLink | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={!!target} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Xóa liên kết mạng xã hội</DialogTitle>
          <DialogDescription>Bạn có chắc chắn muốn xóa {target?.page}?</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button type="button" variant="danger" onClick={onConfirm}>
            Xóa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
