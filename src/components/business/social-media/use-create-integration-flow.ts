import { type FormEvent, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { BusinessPartner } from "@/components/business/information/business-information-data";
import {
  useCreateFacebookAppConfig,
  useFacebookPages,
  useSaveFacebookPages,
  useStartFacebookOAuth,
  socialMediaKeys,
} from "@/api/hooks/social-media-integrations";
import {
  clearFacebookOAuthContext,
  readFacebookOAuthContext,
  storeFacebookOAuthContext,
} from "@/lib/facebook-oauth-context";
import type { CreateFormErrors, CreateStep, SocialMediaCreateForm } from "./social-media-models";
import {
  apiErrorMessage,
  defaultCreateForm,
  facebookOAuthCallbackUrl,
  hasErrors,
  saveFacebookPagePayload,
  validateCreateConfig,
  validateCreateForm,
  validateCreateUntilStep,
} from "./social-media-utils";

export function useCreateIntegrationFlow({
  businesses,
  defaultBusinessId,
  integrationsLoading,
  isLoadingBusinesses,
  isFetchingBusinesses,
  onResumeOAuth,
}: {
  businesses: BusinessPartner[];
  defaultBusinessId: string;
  integrationsLoading: boolean;
  isLoadingBusinesses: boolean;
  isFetchingBusinesses: boolean;
  onResumeOAuth?: () => void;
}) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<CreateStep>("config");
  const [form, setFormState] = useState<SocialMediaCreateForm>(() => defaultCreateForm(""));
  const [errors, setErrors] = useState<CreateFormErrors>({});
  const [resumeHandled, setResumeHandled] = useState(false);

  const createConfig = useCreateFacebookAppConfig();
  const startOAuth = useStartFacebookOAuth();
  const facebookPages = useFacebookPages(form.businessPartnerId, open && step === "pages");
  const savePages = useSaveFacebookPages();

  useEffect(() => {
    if (resumeHandled || isLoadingBusinesses || integrationsLoading) return;
    const context = readFacebookOAuthContext();
    if (!context?.resumePageSelection || context.flow !== "add-link") return;

    const businessExists = businesses.some((b) => b.id === context.businessPartnerId);
    if (!businessExists) {
      if (!isFetchingBusinesses) {
        toast.error("Không tìm thấy doanh nghiệp để tiếp tục chọn trang Facebook.");
        clearFacebookOAuthContext();
        setResumeHandled(true);
      }
      return;
    }

    onResumeOAuth?.();
    setStep("pages");
    setFormState({ ...defaultCreateForm(context.businessPartnerId), appId: context.appId ?? "", appSecret: "", pages: [] });
    setErrors({});
    setOpen(true);
    setResumeHandled(true);
  }, [businesses, isFetchingBusinesses, isLoadingBusinesses, integrationsLoading, resumeHandled]);

  const openCreate = () => {
    setStep("config");
    setFormState(defaultCreateForm(defaultBusinessId));
    setErrors({});
    setOpen(true);
  };

  const closeCreate = () => {
    const businessPartnerId = form.businessPartnerId;
    setOpen(false);
    setStep("config");
    setErrors({});
    setFormState(defaultCreateForm(defaultBusinessId));
    clearFacebookOAuthContext();
    queryClient.removeQueries({ queryKey: socialMediaKeys.facebookPages(businessPartnerId) });
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

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (step === "config") {
      const nextErrors = validateCreateConfig(form);
      setErrors(nextErrors);
      if (hasErrors(nextErrors)) return;

      const trimmed = {
        businessPartnerId: form.businessPartnerId,
        appId: form.appId.trim(),
        appSecret: form.appSecret.trim(),
      };

      createConfig.mutate(
        { businessPartnerId: trimmed.businessPartnerId, body: { appId: trimmed.appId, appSecret: trimmed.appSecret } },
        {
          onSuccess: (configResult) => {
            startOAuth.mutate(
              { businessPartnerId: trimmed.businessPartnerId, body: { redirectUri: facebookOAuthCallbackUrl() } },
              {
                onSuccess: (oauthResult) => {
                  if (!oauthResult.authorizationUrl) {
                    toast.error("Không nhận được đường dẫn đăng nhập Facebook.");
                    return;
                  }
                  storeFacebookOAuthContext({
                    businessPartnerId: trimmed.businessPartnerId,
                    integrationId: configResult.integrationId,
                    appId: trimmed.appId,
                    state: oauthResult.state,
                    flow: "add-link",
                    resumePageSelection: false,
                  });
                  toast.info("Đang chuyển sang Facebook để đăng nhập...");
                  setOpen(false);
                  window.location.href = oauthResult.authorizationUrl;
                },
                onError: (error) => {
                  toast.error(apiErrorMessage(error, "Không thể bắt đầu ủy quyền Facebook."));
                  setFormState((f) => ({ ...f, appSecret: "" }));
                },
              },
            );
          },
          onError: (error) => {
            toast.error(apiErrorMessage(error, "Không thể lưu cấu hình Facebook App."));
            setFormState((f) => ({ ...f, appSecret: "" }));
          },
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

    savePages.mutate(
      { businessPartnerId: form.businessPartnerId, body: { pages: form.pages.map(saveFacebookPagePayload) } },
      {
        onSuccess: () => {
          toast.success("Đã lưu page Facebook và lịch hoạt động.");
          closeCreate();
        },
        onError: (error) => toast.error(apiErrorMessage(error, "Không thể lưu page Facebook và lịch hoạt động.")),
      },
    );
  };

  return {
    open,
    step,
    form,
    errors,
    facebookPages,
    submitting: createConfig.isPending || startOAuth.isPending || savePages.isPending,
    openCreate,
    closeCreate,
    goToStep,
    setForm,
    submit,
  };
}
