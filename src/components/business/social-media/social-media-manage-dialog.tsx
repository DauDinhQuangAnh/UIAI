import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { BusinessPartner } from "@/components/business/information/business-information-data";
import type { ManageConfigForm, SocialMediaTableRow } from "./social-media-models";
import { ManageBotStatusEditor } from "./bot-status-editor";
import { DetailReadOnlyField, DetailSelectField } from "./social-media-detail-fields";
import {
  blankScheduleDraft,
  displayPageName,
  isFacebookIntegration,
  manageBotModeFromPage,
  pageInitials,
  providerCode,
  scheduleDraftFromPage,
} from "./social-media-utils";

export function SocialMediaIntegrationManageDialog({
  row,
  businesses,
  canUpdate,
  saving,
  detailLoading,
  onOpenChange,
  onSaveConfig,
}: {
  row: SocialMediaTableRow | null;
  businesses: BusinessPartner[];
  canUpdate: boolean;
  saving: boolean;
  detailLoading: boolean;
  onOpenChange: (open: boolean) => void;
  onSaveConfig: (row: SocialMediaTableRow, form: ManageConfigForm) => void;
}) {
  const integration = row?.integration;
  const page = row?.page ?? null;
  const isFacebook = integration ? isFacebookIntegration(integration) : false;
  const [form, setForm] = useState<ManageConfigForm>({
    businessPartnerId: "",
    botMode: "inactive",
    schedule: blankScheduleDraft(),
  });

  useEffect(() => {
    setForm({
      businessPartnerId: row?.business.id ?? "",
      botMode: manageBotModeFromPage(page),
      schedule: scheduleDraftFromPage(page),
    });
  }, [row?.business.id, row?.integration.id, page]);

  return (
    <Dialog open={!!row} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-[760px] overflow-y-auto rounded-md border border-brand-100 bg-card p-6 shadow-xl">
        <DialogHeader className="grid grid-cols-[4rem_1fr_4rem] items-start gap-3 text-center">
          <div className="justify-self-start">
            <ManageDialogAvatar
              name={row?.business.brandName ?? (isFacebook ? "Facebook" : "Social")}
              url={row?.business.logoUrl ?? page?.pageAvatarUrl}
              fallback={isFacebook ? "FB" : integration ? providerCode(integration).slice(0, 2) || "SM" : "SM"}
            />
          </div>
          <DialogTitle className="pt-2 text-base font-bold uppercase tracking-wide text-brand-800">
            Thông tin liên kết social media
          </DialogTitle>
          <span aria-hidden />
          <DialogDescription className="sr-only">Chi tiết liên kết mạng xã hội</DialogDescription>
        </DialogHeader>

        {row && integration && (
          <form className="grid gap-4 pt-2" onSubmit={(event) => {
            event.preventDefault();
            onSaveConfig(row, form);
          }}>
            <DetailSelectField
              label="Doanh nghiệp"
              value={form.businessPartnerId}
              disabled
              businesses={businesses}
              onChange={(businessPartnerId) => setForm((current) => ({ ...current, businessPartnerId }))}
            />
            <DetailReadOnlyField label="App ID" value={integration.appId || "-"} required mono />
            {detailLoading ? (
              <>
                <div className="grid gap-2 sm:grid-cols-[9.5rem_1fr] sm:items-center">
                  <span className="text-sm font-medium text-brand-800">Trang</span>
                  <Skeleton className="h-9 w-full" />
                </div>
                <div className="grid gap-2 sm:grid-cols-[9.5rem_1fr] sm:items-center">
                  <span className="text-sm font-medium text-brand-800">ID Trang</span>
                  <Skeleton className="h-9 w-full" />
                </div>
              </>
            ) : (
              <>
                <DetailReadOnlyField label="Trang" value={displayPageName(page, integration)} />
                <DetailReadOnlyField label="ID Trang" value={page?.externalPageId || "-"} mono />
              </>
            )}

            <ManageBotStatusEditor
              value={form.botMode}
              schedule={form.schedule}
              disabled={saving || !canUpdate || !page?.id || detailLoading}
              onModeChange={(botMode) => setForm((current) => ({ ...current, botMode }))}
              onScheduleChange={(schedule) => setForm((current) => ({ ...current, schedule }))}
            />
            <div className="mt-4 flex justify-end">
              <Button
                type="submit"
                loading={saving}
                disabled={!canUpdate}
                title={!canUpdate ? "Bạn không có quyền cập nhật liên kết Facebook." : undefined}
                className="min-w-28 bg-brand-700 text-white hover:bg-brand-800"
              >
                Lưu
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ManageDialogAvatar({
  name,
  url,
  fallback,
}: {
  name: string;
  url?: string | null;
  fallback: string;
}) {
  const [imgError, setImgError] = useState(false);

  if (url && !imgError) {
    return (
      <img
        src={url}
        alt=""
        className="size-16 rounded-pill border border-brand-700 bg-white object-cover p-0.5 shadow-xs"
        referrerPolicy="no-referrer"
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <span className="flex size-16 items-center justify-center rounded-pill border border-brand-200 bg-brand-50 text-sm font-bold text-brand-800 shadow-xs">
      {fallback || pageInitials(name)}
    </span>
  );
}
