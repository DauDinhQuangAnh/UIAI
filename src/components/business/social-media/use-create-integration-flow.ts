import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import type { BusinessPartner } from "@/components/business/information/business-information-data";
import { useCreateSocialMediaIntegration } from "@/api/hooks/social-media-integrations";
import type { CreateFormErrors, CreateStep, SocialMediaCreateForm } from "./social-media-models";
import {
  apiErrorMessage,
  createBlankPageDraft,
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

  const createIntegration = useCreateSocialMediaIntegration();

  const openCreate = () => {
    setStep("config");
    setFormState(defaultCreateForm(defaultBusinessId));
    setErrors({});
    setOpen(true);
  };

  const closeCreate = () => {
    setOpen(false);
    setStep("config");
    setErrors({});
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

      setFormState((current) => ({
        ...current,
        businessPartnerId: current.businessPartnerId,
        appId: current.appId.trim(),
        appSecret: current.appSecret.trim(),
        pages: current.pages.length > 0 ? current.pages : [createBlankPageDraft()],
      }));
      setStep("pages");
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
    submitting: createIntegration.isPending,
    openCreate,
    closeCreate,
    goToStep,
    setForm,
    submit,
  };
}
