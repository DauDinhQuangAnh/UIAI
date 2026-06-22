import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import type { BusinessPartner } from "@/components/business/information/business-information-data";
import {
  useCreateFacebookAppConfig,
  useCreateSocialMediaIntegration,
  useFetchFacebookPages,
} from "@/api/hooks/social-media-integrations";
import type { FacebookManagedPage } from "@/api/social-media-types";
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
  const createFacebookAppConfig = useCreateFacebookAppConfig();
  const fetchFacebookPages = useFetchFacebookPages();

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

  const loadFacebookPages = (currentForm: SocialMediaCreateForm) => {
    createFacebookAppConfig.mutate(
      {
        businessPartnerId: currentForm.businessPartnerId,
        body: {
          appId: currentForm.appId.trim(),
          appSecret: currentForm.appSecret.trim(),
        },
      },
      {
        onSuccess: () => {
          fetchFacebookPages.mutate(
            { businessPartnerId: currentForm.businessPartnerId },
            {
              onSuccess: (result) => {
                const pages = result.pages.map(selectablePageFromFacebookPage);
                setAvailablePages(pages);
                setFormState((current) => ({ ...current, pages: [] }));
                setStep("pages");
                if (pages.length === 0) toast.warning("Không tìm thấy page Facebook nào từ cấu hình hiện tại.");
              },
              onError: (error) =>
                toast.error(apiErrorMessage(error, "Không thể lấy danh sách page Facebook từ API legacy.")),
            },
          );
        },
        onError: (error) => toast.error(apiErrorMessage(error, "Không thể lưu cấu hình Facebook App.")),
      },
    );
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (step === "config") {
      const nextErrors = validateCreateConfig(form);
      setErrors(nextErrors);
      if (hasErrors(nextErrors)) return;

      setAvailablePages([]);
      setFormState((current) => ({ ...current, pages: [] }));
      loadFacebookPages(form);
      return;
    }

    if (step === "pages") {
      goToStep("schedule");
      return;
    }

    const nextErrors = validateCreateForm(form);
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) return;

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
    submitting: createIntegration.isPending || createFacebookAppConfig.isPending || fetchFacebookPages.isPending,
    openCreate,
    closeCreate,
    goToStep,
    setForm,
    submit,
  };
}

function selectablePageFromFacebookPage(page: FacebookManagedPage): SocialMediaSelectablePage {
  return {
    externalPageId: page.externalPageId,
    pageName: page.pageName,
    username: page.username,
    pageAvatarUrl: page.avatarUrl,
    pageImageUrl: page.avatarUrl,
  };
}
