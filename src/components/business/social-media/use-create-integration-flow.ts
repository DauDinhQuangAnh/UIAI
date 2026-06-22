import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { META_APP_ID, META_OAUTH_CALLBACK_PATH } from "@/api/config";
import type { BusinessPartner } from "@/components/business/information/business-information-data";
import { useCreateMetaLoginUrl, useCreateSocialMediaIntegration } from "@/api/hooks/social-media-integrations";
import type { MetaOAuthPage } from "@/api/social-media-types";
import { storeMetaCreatePendingContext } from "@/lib/meta-oauth-create-context";
import type { CreateFormErrors, CreateStep, SocialMediaCreateForm, SocialMediaSelectablePage } from "./social-media-models";
import {
  apiErrorMessage,
  createSocialMediaIntegrationPayload,
  defaultCreateForm,
  hasErrors,
  validateCreateConfig,
  validateCreateForm,
  validateCreateUntilStep,
} from "./social-media-utils";

export function useCreateIntegrationFlow({
  defaultBusinessId,
}: {
  businesses: BusinessPartner[];
  defaultBusinessId: string;
}) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<CreateStep>("config");
  const [form, setFormState] = useState<SocialMediaCreateForm>(() => defaultCreateForm(""));
  const [errors, setErrors] = useState<CreateFormErrors>({});
  const [availablePages, setAvailablePages] = useState<SocialMediaSelectablePage[]>([]);

  const createIntegration = useCreateSocialMediaIntegration();
  const createMetaLoginUrl = useCreateMetaLoginUrl();

  const openCreate = () => {
    setStep("config");
    setFormState(defaultCreateForm(defaultBusinessId));
    setErrors({});
    setAvailablePages([]);
    setOpen(true);
  };

  const closeCreate = () => {
    setOpen(false);
    setStep("config");
    setErrors({});
    setAvailablePages([]);
    setFormState(defaultCreateForm(defaultBusinessId));
  };

  const goToStep = (nextStep: CreateStep) => {
    const nextErrors = validateCreateUntilStep(form, nextStep);
    setErrors(nextErrors);
    if (!hasErrors(nextErrors)) setStep(nextStep);
  };

  const setForm = (updated: SocialMediaCreateForm) => {
    setFormState(updated);
    setErrors({});
  };

  const resumeFromMetaOAuth = ({
    businessPartnerId,
    pages,
  }: {
    businessPartnerId: string;
    pages: MetaOAuthPage[];
  }) => {
    setStep("pages");
    setErrors({});
    setAvailablePages(pages.map(selectablePageFromMetaPage));
    setFormState(defaultCreateForm(businessPartnerId));
    setOpen(true);
    if (pages.length === 0) toast.warning("Không tìm thấy page Facebook nào từ tài khoản đã cấp quyền.");
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (step === "config") {
      const nextErrors = validateCreateConfig(form);
      setErrors(nextErrors);
      if (hasErrors(nextErrors)) return;

      if (!META_APP_ID) {
        toast.error("Chưa cấu hình VITE_META_APP_ID để tạo Meta Login URL.");
        return;
      }

      const redirectUrl = metaOAuthRedirectUrl();
      storeMetaCreatePendingContext({ businessPartnerId: form.businessPartnerId, appId: META_APP_ID });
      createMetaLoginUrl.mutate(
        { appId: META_APP_ID, redirectUrl },
        {
          onSuccess: (result) => {
            if (!result.loginUrl) {
              toast.error("API không trả về Meta Login URL.");
              return;
            }
            window.location.href = result.loginUrl;
          },
          onError: (error) => toast.error(apiErrorMessage(error, "Không thể tạo Meta Login URL.")),
        },
      );
      return;
    }

    if (step === "pages") {
      goToStep("schedule");
      return;
    }

    const nextErrors = validateCreateForm(form);
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) return;

    if (!form.appId.trim() || !form.appSecret.trim()) {
      toast.error("Chưa cấu hình Meta App ID/App Secret để tạo integration.");
      return;
    }

    createIntegration.mutate(
      { businessPartnerId: form.businessPartnerId, body: createSocialMediaIntegrationPayload(form) },
      {
        onSuccess: (result) => {
          toast.success(result.message || "Đã tạo liên kết Facebook và lịch hoạt động.");
          closeCreate();
        },
        onError: (error) => toast.error(apiErrorMessage(error, "Không thể tạo liên kết Facebook.")),
      },
    );
  };

  return {
    open,
    step,
    form,
    errors,
    availablePages,
    submitting: createIntegration.isPending || createMetaLoginUrl.isPending,
    openCreate,
    closeCreate,
    goToStep,
    setForm,
    resumeFromMetaOAuth,
    submit,
  };
}

function selectablePageFromMetaPage(page: MetaOAuthPage): SocialMediaSelectablePage {
  return {
    externalPageId: page.pageId,
    pageName: page.pageName,
    username: page.pageId,
    pageAvatarUrl: page.avatarUrl,
    pageImageUrl: page.avatarUrl,
  };
}

function metaOAuthRedirectUrl(): string {
  const configured = import.meta.env.VITE_FACEBOOK_OAUTH_CALLBACK_URL?.trim();
  if (configured) return configured;
  return `${window.location.origin}${META_OAUTH_CALLBACK_PATH}`;
}
