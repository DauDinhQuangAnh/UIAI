import { createFileRoute } from "@tanstack/react-router";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { Buildings, MagnifyingGlass, Plus, ShieldWarning } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BusinessPageShell } from "@/components/business/business-page-shell";
import { EmptyState } from "@/components/common/empty-state";
import {
  EMPTY_BUSINESS_FORM,
  createPayloadFromForm,
  formFromBusinessPartner,
  updatePayloadFromForm,
  type BusinessPartner,
  type BusinessPartnerForm,
} from "@/components/business/information/business-information-data";
import {
  AddBusinessDialog,
  DeleteBusinessDialog,
  EditBusinessDialog,
} from "@/components/business/information/business-information-dialogs";
import { BusinessInformationTable } from "@/components/business/information/business-information-table";
import {
  useBusinessPartners,
  useBusinessPartner,
  useCreateBusinessPartner,
  useDeleteBusinessPartner,
  useUpdateBusinessPartner,
} from "@/api/hooks/business-partners";
import { ApiRequestError, errorMessage } from "@/api/errors";
import { PERMISSIONS, usePermissionSet } from "@/auth/permissions";

const PAGE_SIZE = 20;

export const Route = createFileRoute("/_app/business/information")({
  component: BusinessInformationScreen,
});

function BusinessInformationScreen() {
  const hasPermission = usePermissionSet();
  const canView = hasPermission(PERMISSIONS.businessPartners.view);
  const canCreate = hasPermission(PERMISSIONS.businessPartners.create);
  const canUpdate = hasPermission(PERMISSIONS.businessPartners.update);
  const canDelete = hasPermission(PERMISSIONS.businessPartners.delete);

  if (!canView) {
    return (
      <BusinessPageShell
        title="Thông tin doanh nghiệp"
        description="Quản lý business partners, tài khoản đại diện và thông tin liên hệ theo SAR Platform API."
        icon={Buildings}
        className="max-w-7xl"
      >
        <EmptyState
          icon={ShieldWarning}
          title="Bạn không có quyền xem thông tin doanh nghiệp"
          description="Cần quyền BUSINESS_PARTNER.PROFILE.VIEW để truy cập màn hình này."
        />
      </BusinessPageShell>
    );
  }

  return <BusinessInformationContent canCreate={canCreate} canUpdate={canUpdate} canDelete={canDelete} />;
}

function BusinessInformationContent({
  canCreate,
  canUpdate,
  canDelete,
}: {
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}) {
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [pageNumber, setPageNumber] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<BusinessPartner | null>(null);
  const [editTargetId, setEditTargetId] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<BusinessPartner | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState<BusinessPartnerForm>(EMPTY_BUSINESS_FORM);
  const [editForm, setEditForm] = useState<BusinessPartnerForm>(EMPTY_BUSINESS_FORM);

  const params = useMemo(
    () => ({
      keyword: keyword.trim() || undefined,
      isActive: statusFilter === "all" ? undefined : statusFilter === "active",
      pageNumber,
      pageSize: PAGE_SIZE,
    }),
    [keyword, pageNumber, statusFilter],
  );

  const businessPartners = useBusinessPartners(params);
  const editBusinessDetail = useBusinessPartner(editTargetId ?? undefined);
  const createBusiness = useCreateBusinessPartner();
  const updateBusiness = useUpdateBusinessPartner();
  const deleteBusiness = useDeleteBusinessPartner();

  const businesses = businessPartners.data?.items ?? [];
  const totalCount = businessPartners.data?.totalCount ?? 0;
  const currentPage = businessPartners.data?.pageNumber ?? pageNumber;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const openEdit = (business: BusinessPartner) => {
    if (!canUpdate) return;
    setEditTargetId(business.id);
    setEditTarget(business);
    setEditForm(formFromBusinessPartner(business));
  };

  useEffect(() => {
    if (!editBusinessDetail.data) return;
    setEditTarget(editBusinessDetail.data);
    setEditForm(formFromBusinessPartner(editBusinessDetail.data));
  }, [editBusinessDetail.data]);

  useEffect(() => {
    if (!editTargetId || !editBusinessDetail.error) return;
    toast.error(apiErrorMessage(editBusinessDetail.error, "Không thể tải chi tiết doanh nghiệp."));
    setEditTargetId(null);
    setEditTarget(null);
    setEditForm(EMPTY_BUSINESS_FORM);
  }, [editBusinessDetail.error, editTargetId]);

  const onConfirmDelete = () => {
    if (!canDelete) return;
    if (!deleteTarget) return;
    deleteBusiness.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success("Đã xóa doanh nghiệp.");
        setDeleteTarget(null);
      },
      onError: (error) => toast.error(apiErrorMessage(error, "Không thể xóa doanh nghiệp.")),
    });
  };

  const onSubmitAdd = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canCreate) return;
    createBusiness.mutate(createPayloadFromForm(form), {
      onSuccess: (partner) => {
        toast.success(createSuccessMessage(partner));
        setAddOpen(false);
        setForm(EMPTY_BUSINESS_FORM);
      },
      onError: (error) => {
        if (error instanceof ApiRequestError && error.status === 409) setStatusFilter("all");
        toast.error(apiErrorMessage(error, "Không thể tạo doanh nghiệp."));
      },
    });
  };

  const onSubmitEdit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canUpdate) return;
    if (!editTarget) return;
    updateBusiness.mutate(
      { id: editTarget.id, body: updatePayloadFromForm(editForm) },
      {
        onSuccess: () => {
          toast.success("Đã cập nhật doanh nghiệp.");
          setEditTarget(null);
          setEditForm(EMPTY_BUSINESS_FORM);
        },
        onError: (error) => toast.error(apiErrorMessage(error, "Không thể cập nhật doanh nghiệp.")),
      },
    );
  };

  const onKeywordChange = (value: string) => {
    setKeyword(value);
    setPageNumber(1);
  };

  const onStatusFilterChange = (value: "all" | "active" | "inactive") => {
    setStatusFilter(value);
    setPageNumber(1);
  };

  return (
    <BusinessPageShell
      title="Thông tin doanh nghiệp"
      description="Quản lý business partners, tài khoản đại diện và thông tin liên hệ theo SAR Platform API."
      icon={Buildings}
      className="max-w-7xl"
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-semibold text-text-primary">Danh sách doanh nghiệp</h2>
            <p className="text-sm text-text-secondary">
              {totalCount} business partner phù hợp với bộ lọc hiện tại.
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            disabled={!canCreate}
            title={!canCreate ? "Bạn không có quyền tạo doanh nghiệp" : undefined}
            onClick={() => setAddOpen(true)}
          >
            <Plus className="size-4" aria-hidden />
            Thêm doanh nghiệp
          </Button>
        </div>

        <div className="grid gap-3 rounded-md border border-border bg-surface p-3 md:grid-cols-[1fr_14rem]">
          <label className="relative flex min-w-0 items-center">
            <MagnifyingGlass className="pointer-events-none absolute left-3 size-4 text-text-dim" aria-hidden />
            <Input
              value={keyword}
              placeholder="Tìm theo tên, email, số điện thoại..."
              className="pl-9"
              onChange={(event) => onKeywordChange(event.target.value)}
            />
          </label>
          <Select value={statusFilter} onValueChange={(value) => onStatusFilterChange(value as typeof statusFilter)}>
            <SelectTrigger aria-label="Lọc trạng thái">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value="active">Hoạt động</SelectItem>
              <SelectItem value="inactive">Không hoạt động</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {businessPartners.isLoading ? (
          <div className="rounded-md border border-border bg-surface p-8 text-center text-sm text-text-secondary">
            Đang tải danh sách doanh nghiệp...
          </div>
        ) : businessPartners.isError ? (
          <EmptyState
            icon={Buildings}
            title="Không tải được danh sách doanh nghiệp"
            description={apiErrorMessage(businessPartners.error, "Vui lòng thử lại sau.")}
            action={
              <Button type="button" variant="secondary" onClick={() => businessPartners.refetch()}>
                Tải lại
              </Button>
            }
          />
        ) : businesses.length === 0 ? (
          <EmptyState
            icon={Buildings}
            title="Chưa có doanh nghiệp"
            description="Tạo business partner đầu tiên để cấu hình đại diện và các kênh social."
            action={
              <Button
                type="button"
                disabled={!canCreate}
                title={!canCreate ? "Bạn không có quyền tạo doanh nghiệp" : undefined}
                onClick={() => setAddOpen(true)}
              >
                <Plus className="size-4" aria-hidden />
                Thêm doanh nghiệp
              </Button>
            }
          />
        ) : (
          <>
            <BusinessInformationTable
              businesses={businesses}
              canEdit={canUpdate}
              canDelete={canDelete}
              onEdit={openEdit}
              onDelete={setDeleteTarget}
            />
            <div className="flex items-center justify-between gap-3 text-sm text-text-secondary">
              <span>
                Trang {currentPage} / {totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => setPageNumber((page) => Math.max(1, page - 1))}
                >
                  Trước
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => setPageNumber((page) => page + 1)}
                >
                  Sau
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      <AddBusinessDialog
        open={addOpen}
        form={form}
        loading={createBusiness.isPending}
        onOpenChange={(open) => {
          setAddOpen(open);
          if (!open) setForm(EMPTY_BUSINESS_FORM);
        }}
        onFormChange={setForm}
        onSubmit={onSubmitAdd}
      />

      <EditBusinessDialog
        target={editTarget}
        form={editForm}
        onOpenChange={(open) => {
          if (!open) {
            setEditTargetId(null);
            setEditTarget(null);
            setEditForm(EMPTY_BUSINESS_FORM);
          }
        }}
        onFormChange={setEditForm}
        onSubmit={onSubmitEdit}
        loading={updateBusiness.isPending || editBusinessDetail.isFetching}
      />

      <DeleteBusinessDialog
        target={deleteTarget}
        loading={deleteBusiness.isPending}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={onConfirmDelete}
      />
    </BusinessPageShell>
  );
}

function createSuccessMessage(partner: BusinessPartner): string {
  const notes = [
    partner.accountCreated === true ? "đã tạo account đại diện" : null,
    partner.representativeEmailSent === true ? "đã gửi email đại diện" : null,
    partner.businessOwnerEmailSent === true ? "đã gửi email chủ doanh nghiệp" : null,
  ].filter(Boolean);
  return notes.length > 0 ? `Đã tạo doanh nghiệp, ${notes.join(", ")}.` : "Đã tạo doanh nghiệp.";
}

function apiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiRequestError) {
    return errorMessage(
      error.body,
      error.status === 409
        ? "Email doanh nghiệp hoặc email đại diện đã được sử dụng."
        : fallback,
    );
  }
  return fallback;
}
