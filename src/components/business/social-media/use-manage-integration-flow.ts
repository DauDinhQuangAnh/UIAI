import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { socialMediaKeys, useUpdateSocialMediaPage } from "@/api/hooks/social-media-integrations";
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
    manageTarget,
    setManageTarget,
    saving: updatePage.isPending,
    saveConfig,
  };
}
