import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { BusinessPartner } from "@/components/business/information/business-information-data";
import type { RefreshTokenForm, SocialMediaTableRow } from "./social-media-models";
import { DetailReadOnlyField, DetailSecretField, DetailSelectField } from "./social-media-detail-fields";
import { APP_SECRET_MASK, appSecretDisplayValue } from "./social-media-utils";

export function RefreshSocialMediaTokenDialog({
  target,
  businesses,
  loading,
  onOpenChange,
  onSubmit,
}: {
  target: SocialMediaTableRow | null;
  businesses: BusinessPartner[];
  loading: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (row: SocialMediaTableRow, form: RefreshTokenForm) => void;
}) {
  const [form, setForm] = useState<RefreshTokenForm>({ businessPartnerId: "", appSecret: APP_SECRET_MASK });

  useEffect(() => {
    setForm({ businessPartnerId: target?.business.id ?? "", appSecret: appSecretDisplayValue(target?.integration) });
  }, [target?.business.id, target?.integration.id, target?.integration]);

  return (
    <Dialog open={!!target} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl rounded-md border border-brand-100 bg-card p-6 shadow-xl">
        <DialogHeader className="text-center">
          <DialogTitle className="text-base font-bold uppercase tracking-wide text-brand-800">
            Làm mới liên kết social media
          </DialogTitle>
          <DialogDescription className="sr-only">
            Nhập lại App Secret để lưu cấu hình làm mới liên kết social media.
          </DialogDescription>
        </DialogHeader>

        {target && (
          <form
            className="grid gap-4 pt-2"
            onSubmit={(event) => {
              event.preventDefault();
              onSubmit(target, form);
            }}
          >
            <DetailSelectField
              label="Doanh nghiệp"
              value={form.businessPartnerId}
              disabled
              businesses={businesses}
              onChange={(businessPartnerId) => setForm((current) => ({ ...current, businessPartnerId }))}
            />
            <DetailReadOnlyField label="App ID" value={target.integration.appId || "-"} required mono />
            <DetailSecretField
              value={form.appSecret}
              disabled={loading}
              onChange={(appSecret) => setForm((current) => ({ ...current, appSecret }))}
            />
            <div className="flex justify-center pt-2">
              <Button type="submit" loading={loading} className="min-w-32 bg-brand-700 text-white hover:bg-brand-800">
                Tiếp tục
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

