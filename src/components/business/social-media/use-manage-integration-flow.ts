import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { socialMediaKeys, useIntegrationDetail, useUpdateSocialMediaPage } from "@/api/hooks/social-media-integrations";
import type { ManageConfigForm, SocialMediaTableRow } from "./social-media-models";
import {
  apiErrorMessage,
  displayPageName,
  managePagePayload,
  validateScheduleDraft,
} from "./social-media-utils";

export function useManageIntegrationFlow() {
  const queryClient = useQueryClient();
  const [manageTarget, setManageTarget] = useState<SocialMediaTableRow | null>(null);

  const updatePage = useUpdateSocialMediaPage();

  const detailQuery = useIntegrationDetail(
    manageTarget?.business.id,
    manageTarget?.integration.id,
    !!manageTarget,
  );

  const resolvedManageTarget = useMemo<SocialMediaTableRow | null>(() => {
    if (!manageTarget) return null;
    if (manageTarget.page?.id) return manageTarget;

    const pages = detailQuery.data?.pages;
    if (!pages?.length) return manageTarget;

    const targetExtId = manageTarget.page?.externalPageId;
    const page = targetExtId
      ? (pages.find((p) => p.externalPageId === targetExtId) ?? pages[0])
      : pages[0];

    return { ...manageTarget, integration: detailQuery.data!, page: page ?? null };
  }, [manageTarget, detailQuery.data]);

  const refetchAll = () => {
    queryClient.invalidateQueries({ queryKey: socialMediaKeys.all });
  };

  const saveConfig = async (row: SocialMediaTableRow, form: ManageConfigForm) => {
    if (!form.businessPartnerId) {
      toast.error("Vui lòng chọn doanh nghiệp.");
      return;
    }

    if (!row.page?.id) {
      toast.error("Liên kết này chưa có page để cập nhật trạng thái bot.");
      return;
    }

    const validationError =
      form.botMode === "part"
        ? validateScheduleDraft({ ...form.schedule, mode: "part" }, displayPageName(row.page, row.integration))
        : "";
    if (validationError) {
      toast.error(validationError);
      return;
    }

    try {
      await updatePage.mutateAsync({
        businessPartnerId: row.business.id,
        pageId: row.page.id,
        body: managePagePayload(form),
      });
      toast.success("Đã cập nhật trạng thái bot và lịch hoạt động.");
      setManageTarget(null);
      refetchAll();
    } catch (error) {
      refetchAll();
      toast.error(apiErrorMessage(error, "Không thể cập nhật trạng thái bot."));
    }
  };

  return {
    manageTarget: resolvedManageTarget,
    detailLoading: detailQuery.isLoading && !!manageTarget,
    setManageTarget,
    saving: updatePage.isPending,
    saveConfig,
  };
}
