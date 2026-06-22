import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import type { BusinessPartner } from "@/components/business/information/business-information-data";
import { useCreateSocialMediaIntegration } from "@/api/hooks/social-media-integrations";
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

const TEMP_AVAILABLE_PAGES: SocialMediaSelectablePage[] = [
  {
    externalPageId: "657000124932010",
    pageName: "Shah hoa Lyny Tr",
    username: "@657000124932010",
  },
  {
    externalPageId: "689000124823419",
    pageName: "Cửa Lò hội Lữ hành MT",
    username: "Type travel",
  },
  {
    externalPageId: "104678999810204",
    pageName: "Hội Kiên Giang",
    username: "@kiengiang",
  },
  {
    externalPageId: "874010932817501",
    pageName: "Xí Kho Online An Hội & Nt",
    username: "Xí Kho Queen Lotus",
  },
];

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
        pages: [],
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

    if (!form.appId.trim() || !form.appSecret.trim()) {
      toast.error("Chưa có nguồn App ID/App Secret để gửi API tạo liên kết. Cần nối API lấy cấu hình trước khi submit thật.");
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
    availablePages: TEMP_AVAILABLE_PAGES,
    submitting: createIntegration.isPending,
    openCreate,
    closeCreate,
    goToStep,
    setForm,
    submit,
  };
}
