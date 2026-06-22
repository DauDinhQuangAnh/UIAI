import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LinkSimple, ShieldWarning } from "@phosphor-icons/react";
import { toast } from "sonner";
import { META_OAUTH_CALLBACK_PATH, META_OAUTH_CALLBACK_URL } from "@/api/config";
import { completeMetaOAuthCallback } from "@/api/hooks/social-media-integrations";
import { ApiRequestError, errorMessage } from "@/api/errors";
import { Button } from "@/components/ui/button";
import { BusinessPageShell } from "@/components/business/business-page-shell";
import { EmptyState } from "@/components/common/empty-state";
import {
  clearMetaCreatePendingContext,
  readMetaCreatePendingContext,
  storeMetaCreateOAuthResult,
} from "@/lib/meta-oauth-create-context";

export const Route = createFileRoute("/meta/callback")({
  validateSearch: (search: Record<string, unknown>) => ({
    code: typeof search.code === "string" ? search.code : undefined,
    state: typeof search.state === "string" ? search.state : undefined,
    error: typeof search.error === "string" ? search.error : undefined,
    error_reason: typeof search.error_reason === "string" ? search.error_reason : undefined,
    error_description: typeof search.error_description === "string" ? search.error_description : undefined,
  }),
  component: MetaOAuthCallbackScreen,
});

function MetaOAuthCallbackScreen() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [callbackError, setCallbackError] = useState<unknown>(null);
  const pending = readMetaCreatePendingContext();

  useEffect(() => {
    if (!pending) return;
    let cancelled = false;

    completeMetaOAuthCallback({
      redirectUrl: metaOAuthRedirectUrl(),
      code: search.code ?? null,
      state: search.state ?? null,
      error: search.error ?? null,
      errorReason: search.error_reason ?? null,
      errorDescription: search.error_description ?? null,
    })
      .then((result) => {
        if (cancelled) return;
        if (!result.success) {
          setCallbackError(result.message || "Meta OAuth không thành công.");
          return;
        }

        storeMetaCreateOAuthResult({
          businessPartnerId: pending.businessPartnerId,
          appId: pending.appId,
          pages: result.pages,
        });
        clearMetaCreatePendingContext();
        toast.success("Đã lấy danh sách page Facebook.");
        navigate({
          to: "/business/social-media",
          search: { businessPartnerId: pending.businessPartnerId },
        });
      })
      .catch((error: unknown) => {
        if (!cancelled) setCallbackError(error);
      });

    return () => {
      cancelled = true;
    };
  }, [navigate, pending, search.code, search.error, search.error_description, search.error_reason, search.state]);

  const backToSocialMedia = () => {
    const businessPartnerId = pending?.businessPartnerId;
    clearMetaCreatePendingContext();
    navigate({ to: "/business/social-media", search: { businessPartnerId } });
  };

  if (!pending) {
    return (
      <CallbackShell>
        <EmptyState
          icon={ShieldWarning}
          title="Không tìm thấy phiên tạo liên kết"
          description="Vui lòng quay lại màn hình social media và bắt đầu lại."
          action={<Button type="button" onClick={backToSocialMedia}>Quay lại</Button>}
        />
      </CallbackShell>
    );
  }

  if (callbackError) {
    return (
      <CallbackShell>
        <EmptyState
          icon={ShieldWarning}
          title="Không thể hoàn tất Meta OAuth"
          description={apiErrorMessage(callbackError, "Vui lòng thử lại.")}
          action={<Button type="button" onClick={backToSocialMedia}>Quay lại</Button>}
        />
      </CallbackShell>
    );
  }

  return (
    <CallbackShell>
      <div className="rounded-md border border-border bg-card px-6 py-16 text-center shadow-xs">
        <span className="mx-auto mb-4 block size-8 animate-spin rounded-full border-2 border-border border-t-brand-500" aria-hidden />
        <h2 className="text-xl font-semibold text-text-primary">Đang lấy danh sách page Facebook...</h2>
        <p className="mt-2 text-sm text-text-secondary">Vui lòng chờ trong giây lát.</p>
      </div>
    </CallbackShell>
  );
}

function CallbackShell({ children }: { children: React.ReactNode }) {
  return (
    <BusinessPageShell
      title="Liên kết mạng xã hội"
      description="Hoàn tất Meta OAuth để lấy danh sách page."
      icon={LinkSimple}
      className="max-w-3xl"
    >
      {children}
    </BusinessPageShell>
  );
}

function metaOAuthRedirectUrl(): string {
  const configured = META_OAUTH_CALLBACK_URL.trim() || import.meta.env.VITE_FACEBOOK_OAUTH_CALLBACK_URL?.trim();
  if (configured) return configured;
  return `${window.location.origin}${META_OAUTH_CALLBACK_PATH}`;
}

function apiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiRequestError) return errorMessage(error.body, fallback);
  if (typeof error === "string") return error;
  return fallback;
}
