import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  useUpdateFacebookAppConfig,
  useUpdateSocialMediaPage,
  socialMediaKeys,
} from "@/api/hooks/social-media-integrations";
import type { ManageConfigForm, RefreshTokenForm, SocialMediaTableRow } from "./social-media-models";
import {
  apiErrorMessage,
  displayPageName,
  isEditedAppSecret,
  managePagePayload,
  validateScheduleDraft,
} from "./social-media-utils";

export function useManageIntegrationFlow() {
  const queryClient = useQueryClient();
  const [manageTarget, setManageTarget] = useState<SocialMediaTableRow | null>(null);
  const [refreshTarget, setRefreshTarget] = useState<SocialMediaTableRow | null>(null);

  const updateConfig = useUpdateFacebookAppConfig();
  const updatePage = useUpdateSocialMediaPage();

  const refetchAll = () => {
    queryClient.invalidateQueries({ queryKey: socialMediaKeys.all });
  };

  const saveConfig = async (row: SocialMediaTableRow, form: ManageConfigForm) => {
    const appSecret = form.appSecret.trim();
    if (!form.businessPartnerId) {
      toast.error("Vui lòng chọn doanh nghiệp.");
      return;
    }

    const shouldUpdateConfig = isEditedAppSecret(appSecret);
    const shouldUpdatePage = !!row.page?.id;
    if (!shouldUpdateConfig && !shouldUpdatePage) {
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
      if (shouldUpdateConfig) {
        await updateConfig.mutateAsync({
          businessPartnerId: form.businessPartnerId,
          body: { appId: row.integration.appId, appSecret },
        });
      }
      if (shouldUpdatePage && row.page?.id) {
        await updatePage.mutateAsync({
          businessPartnerId: row.business.id,
          pageId: row.page.id,
          body: managePagePayload(form),
        });
      }
      toast.success("Đã cập nhật liên kết social media.");
      setManageTarget(null);
      refetchAll();
    } catch (error) {
      refetchAll();
      toast.error(apiErrorMessage(error, "Không thể cập nhật liên kết social media."));
    }
  };

  const openRefreshToken = (row: SocialMediaTableRow) => {
    setManageTarget(null);
    setRefreshTarget(row);
  };

  const saveRefreshToken = (row: SocialMediaTableRow, form: RefreshTokenForm) => {
    const appSecret = form.appSecret.trim();
    if (!form.businessPartnerId) {
      toast.error("Vui lòng chọn doanh nghiệp.");
      return;
    }
    if (!isEditedAppSecret(appSecret)) {
      toast.error("Vui lòng nhập App Secret mới nếu muốn cập nhật cấu hình.");
      return;
    }

    updateConfig.mutate(
      { businessPartnerId: form.businessPartnerId, body: { appId: row.integration.appId, appSecret } },
      {
        onSuccess: () => {
          toast.success("Đã lưu cấu hình làm mới liên kết social media.");
          setRefreshTarget(null);
          refetchAll();
        },
        onError: (error) =>
          toast.error(apiErrorMessage(error, "Không thể lưu cấu hình làm mới liên kết social media.")),
      },
    );
  };

  return {
    manageTarget,
    setManageTarget,
    refreshTarget,
    setRefreshTarget,
    saving: updateConfig.isPending || updatePage.isPending,
    saveConfig,
    openRefreshToken,
    saveRefreshToken,
  };
}
