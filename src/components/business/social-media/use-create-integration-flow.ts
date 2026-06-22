import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import type { BusinessPartner } from "@/components/business/information/business-information-data";
import { useCreateSocialMediaIntegration, useFetchAvailableSocialMediaPages } from "@/api/hooks/social-media-integrations";
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
  const fetchAvailablePages = useFetchAvailableSocialMediaPages();

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

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (step === "config") {
      const nextErrors = validateCreateConfig(form);
      setErrors(nextErrors);
      if (hasErrors(nextErrors)) return;

      fetchAvailablePages.mutate(
        {
          businessPartnerId: form.businessPartnerId,
          body: {
            provider: "Facebook",
            appId: form.appId.trim(),
            appSecret: form.appSecret.trim(),
          },
        },
        {
          onSuccess: (pages) => {
            setAvailablePages(pages);
            setFormState((current) => ({ ...current, pages: [] }));
            setStep("pages");
            if (pages.length === 0) toast.warning("Không tìm thấy page nào từ tài khoản Facebook này.");
          },
          onError: (error) =>
            toast.error(apiErrorMessage(error, "Không thể lấy danh sách page Facebook. Kiểm tra App ID/App Secret hoặc endpoint backend.")),
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
    submitting: createIntegration.isPending || fetchAvailablePages.isPending,
    openCreate,
    closeCreate,
    goToStep,
    setForm,
    submit,
  };
}
