import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { LinkSimple, ShieldWarning } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { BusinessPageShell } from "@/components/business/business-page-shell";
import { EmptyState } from "@/components/common/empty-state";
import { completeFacebookOAuthCallback } from "@/api/hooks/social-media-integrations";
import type { FacebookOAuthCallbackResponse } from "@/api/social-media-types";
import { ApiRequestError, errorMessage } from "@/api/errors";
import {
  clearFacebookOAuthContext,
  readFacebookOAuthContext,
} from "@/lib/facebook-oauth-context";

export const Route = createFileRoute("/business/social-media/oauth/callback")({
  validateSearch: (search: Record<string, unknown>) => ({
    code: typeof search.code === "string" ? search.code : undefined,
    state: typeof search.state === "string" ? search.state : undefined,
    error: typeof search.error === "string" ? search.error : undefined,
    error_description: typeof search.error_description === "string" ? search.error_description : undefined,
  }),
  component: FacebookOAuthCallbackScreen,
});

function FacebookOAuthCallbackScreen() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const storedContext = useMemo(() => readFacebookOAuthContext(), []);
  const hasProviderError = !!search.error;
  const canComplete = !!search.code && !!search.state && !hasProviderError;
  const [callbackData, setCallbackData] = useState<FacebookOAuthCallbackResponse | null>(null);
  const [callbackError, setCallbackError] = useState<unknown>(null);

  useEffect(() => {
    if (!canComplete) return;
    let cancelled = false;
    setCallbackData(null);
    setCallbackError(null);
    completeFacebookOAuthCallback({
      code: search.code!,
      state: search.state!,
    })
      .then((result) => {
        if (!cancelled) setCallbackData(result);
      })
      .catch((error: unknown) => {
        if (!cancelled) setCallbackError(error);
      });
    return () => {
      cancelled = true;
    };
  }, [canComplete, search.code, search.state]);

  useEffect(() => {
    if (!callbackData?.success) return;
    const businessPartnerId = callbackData.businessPartnerId || storedContext?.businessPartnerId;
    clearFacebookOAuthContext();
    toast.success("Đã ủy quyền Facebook thành công.");
    navigate({
      to: "/business/social-media",
      search: { businessPartnerId },
    });
  }, [callbackData, navigate, storedContext]);

  const backToSocialMedia = () => {
    const businessPartnerId = storedContext?.businessPartnerId;
    navigate({
      to: "/business/social-media",
      search: { businessPartnerId },
    });
  };

  if (hasProviderError) {
    return (
      <OAuthCallbackShell>
        <EmptyState
          icon={ShieldWarning}
          title="Facebook authorization bị hủy hoặc thất bại."
          description="Vui lòng quay lại màn hình liên kết mạng xã hội và thử ủy quyền lại."
          action={
            <Button type="button" onClick={backToSocialMedia}>
              Quay lại liên kết mạng xã hội
            </Button>
          }
        />
      </OAuthCallbackShell>
    );
  }

  if (!canComplete) {
    return (
      <OAuthCallbackShell>
        <EmptyState
          icon={ShieldWarning}
          title="Thiếu thông tin ủy quyền Facebook"
          description="Không tìm thấy mã xác thực hợp lệ trong callback."
          action={
            <Button type="button" onClick={backToSocialMedia}>
              Quay lại liên kết mạng xã hội
            </Button>
          }
        />
      </OAuthCallbackShell>
    );
  }

  if (callbackError) {
    return (
      <OAuthCallbackShell>
        <EmptyState
          icon={ShieldWarning}
          title="Không thể hoàn tất ủy quyền Facebook"
          description={apiErrorMessage(callbackError, "Vui lòng thử đăng nhập Facebook lại.")}
          action={
            <Button type="button" onClick={backToSocialMedia}>
              Quay lại liên kết mạng xã hội
            </Button>
          }
        />
      </OAuthCallbackShell>
    );
  }

  if (callbackData && !callbackData.success) {
    return (
      <OAuthCallbackShell>
        <EmptyState
          icon={ShieldWarning}
          title="Facebook authorization bị hủy hoặc thất bại."
          description={callbackData.message || "Backend không xác nhận được trạng thái ủy quyền."}
          action={
            <Button type="button" onClick={backToSocialMedia}>
              Quay lại liên kết mạng xã hội
            </Button>
          }
        />
      </OAuthCallbackShell>
    );
  }

  return (
    <OAuthCallbackShell>
      <div className="rounded-2xl border border-border bg-card px-6 py-16 text-center shadow-xs">
        <span className="mx-auto mb-4 block size-8 animate-spin rounded-full border-2 border-border border-t-brand-500" aria-hidden />
        <h2 className="font-display text-xl font-semibold text-text-primary">Đang hoàn tất ủy quyền Facebook...</h2>
        <p className="mt-2 text-sm text-text-secondary">Vui lòng chờ trong giây lát.</p>
      </div>
    </OAuthCallbackShell>
  );
}

function OAuthCallbackShell({ children }: { children: React.ReactNode }) {
  return (
    <BusinessPageShell
      title="Liên kết mạng xã hội"
      description="Hoàn tất ủy quyền Facebook cho business partner."
      icon={LinkSimple}
      className="max-w-3xl"
    >
      {children}
    </BusinessPageShell>
  );
}

function apiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiRequestError) return errorMessage(error.body, fallback);
  return fallback;
}
