import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { SocialMediaTableRow } from "./social-media-models";
import { displayDeleteTargetName } from "./social-media-utils";

export function DeleteSocialMediaIntegrationDialog({
  target,
  loading,
  onOpenChange,
  onConfirm,
}: {
  target: SocialMediaTableRow | null;
  loading: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={!!target} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Xóa liên kết mạng xã hội</DialogTitle>
          <DialogDescription>
            Bạn có chắc muốn xóa mềm {target ? displayDeleteTargetName(target) : "liên kết này"} không? Backend sẽ soft delete integration,
            các page đã liên kết và lịch bot thuộc integration này.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="secondary" disabled={loading} onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button type="button" variant="danger" loading={loading} onClick={onConfirm}>
            Xóa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

