import { createFileRoute } from "@tanstack/react-router";
import { type FormEvent, useMemo, useState } from "react";
import { PuzzlePiece, Plus } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/empty-state";
import {
  DeletePermissionDialog,
  PermissionPageShell,
  PermissionToolbar,
  apiErrorMessage,
  cleanOptional,
  statusParam,
  type StatusFilterValue,
} from "@/components/permissions/permission-ui";
import { FeatureDialog, type FeatureForm } from "@/components/permissions/features/feature-dialog";
import { FeatureTable } from "@/components/permissions/features/feature-table";
import {
  useCreatePermissionFeature,
  useDeletePermissionFeature,
  usePermissionFeatures,
  useUpdatePermissionFeature,
} from "@/api/hooks/permission-features";
import { useSystemModuleDefinitions } from "@/api/hooks/system-permission-definitions";
import type { Feature } from "@/api/permission-types";
import { PERMISSIONS, usePermissionSet } from "@/auth/permissions";

const EMPTY_FORM: FeatureForm = {
  systemModuleDefinitionId: "",
  name: "",
  description: "",
  displayOrder: 0,
  isActive: true,
};

export const Route = createFileRoute("/_app/permissions/features")({
  component: FeatureConfigScreen,
});

function FeatureConfigScreen() {
  const can = usePermissionSet();
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>("all");
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState<FeatureForm>(EMPTY_FORM);
  const [addOrderUnlocked, setAddOrderUnlocked] = useState(false);
  const [editTarget, setEditTarget] = useState<Feature | null>(null);
  const [editForm, setEditForm] = useState<FeatureForm>(EMPTY_FORM);
  const [editOrderUnlocked, setEditOrderUnlocked] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Feature | null>(null);

  const params = useMemo(() => ({ keyword: keyword.trim() || undefined, isActive: statusParam(statusFilter) }), [keyword, statusFilter]);
  const features = usePermissionFeatures(params);
  const allFeatures = usePermissionFeatures({});
  const modules = useSystemModuleDefinitions();
  const createFeature = useCreatePermissionFeature();
  const updateFeature = useUpdatePermissionFeature();
  const deleteFeature = useDeletePermissionFeature();
  const items = features.data ?? [];
  const allFeatureItems = allFeatures.data ?? [];
  const addOrderError = displayOrderError(form.displayOrder, allFeatureItems);
  const editOrderError = displayOrderError(editForm.displayOrder, allFeatureItems, editTarget?.id);

  const submitAdd = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (addOrderError) return;
    createFeature.mutate(payloadFromForm(form), {
      onSuccess: () => {
        toast.success("Đã tạo feature.");
        setAddOpen(false);
        setForm(EMPTY_FORM);
      },
      onError: (error) => toast.error(apiErrorMessage(error, "Không thể tạo feature.")),
    });
  };

  const submitEdit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editTarget) return;
    if (editOrderError) return;
    updateFeature.mutate(
      { id: editTarget.id, body: { ...payloadFromForm(editForm), isActive: editForm.isActive } },
      {
        onSuccess: () => {
          toast.success("Đã cập nhật feature.");
          setEditTarget(null);
          setEditForm(EMPTY_FORM);
        },
        onError: (error) => toast.error(apiErrorMessage(error, "Không thể cập nhật feature.")),
      },
    );
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteFeature.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success("Đã xóa feature.");
        setDeleteTarget(null);
      },
      onError: (error) => toast.error(apiErrorMessage(error, "Không thể xóa feature.")),
    });
  };

  return (
    <PermissionPageShell title="Cấu hình feature" description="Quản lý module/feature dùng để gom nhóm page và menu." icon={PuzzlePiece}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-semibold text-text-primary">Cấu hình feature</h2>
            <p className="text-sm text-text-secondary">{items.length} feature phù hợp với bộ lọc hiện tại.</p>
          </div>
          <Button
            type="button"
            size="sm"
            disabled={!can(PERMISSIONS.features.create)}
            onClick={() => {
              setForm({ ...EMPTY_FORM, displayOrder: nextFeatureDisplayOrder(allFeatureItems) });
              setAddOrderUnlocked(false);
              setAddOpen(true);
            }}
          >
            <Plus className="size-4" aria-hidden />
            Thêm feature
          </Button>
        </div>
        <PermissionToolbar
          keyword={keyword}
          keywordPlaceholder="Tìm theo tên, mã feature..."
          status={statusFilter}
          onKeywordChange={setKeyword}
          onStatusChange={setStatusFilter}
        />
        {features.isLoading ? (
          <div className="rounded-md border border-border bg-surface p-8 text-center text-sm text-text-secondary">Đang tải feature...</div>
        ) : features.isError ? (
          <EmptyState
            icon={PuzzlePiece}
            title="Không tải được feature"
            description={apiErrorMessage(features.error, "Vui lòng thử lại sau.")}
            action={<Button type="button" variant="secondary" onClick={() => features.refetch()}>Tải lại</Button>}
          />
        ) : items.length === 0 ? (
          <EmptyState icon={PuzzlePiece} title="Chưa có feature" description="Tạo feature từ system module definition để bắt đầu cấu hình menu." />
        ) : (
          <FeatureTable
            items={items}
            canUpdate={can(PERMISSIONS.features.update)}
            canDelete={can(PERMISSIONS.features.delete)}
            onEdit={(feature) => {
              setEditTarget(feature);
              setEditForm(formFromFeature(feature));
              setEditOrderUnlocked(false);
            }}
            onDelete={setDeleteTarget}
          />
        )}
      </div>

      <FeatureDialog
        open={addOpen}
        title="Thêm feature"
        description="Chọn system module definition và đặt thông tin hiển thị cho feature."
        form={form}
        modules={modules.data ?? []}
        loading={createFeature.isPending || modules.isLoading}
        orderUnlocked={addOrderUnlocked}
        orderError={addOrderError}
        onUnlockOrder={() => setAddOrderUnlocked(true)}
        submitLabel="Tạo feature"
        onOpenChange={(open) => {
          setAddOpen(open);
          if (!open) {
            setForm(EMPTY_FORM);
            setAddOrderUnlocked(false);
          }
        }}
        onFormChange={setForm}
        onSubmit={submitAdd}
      />
      <FeatureDialog
        open={!!editTarget}
        title="Sửa feature"
        description={`Cập nhật thông tin cho ${editTarget?.name ?? "feature"}.`}
        form={editForm}
        modules={modules.data ?? []}
        loading={updateFeature.isPending || modules.isLoading}
        orderUnlocked={editOrderUnlocked}
        orderError={editOrderError}
        onUnlockOrder={() => setEditOrderUnlocked(true)}
        submitLabel="Lưu thay đổi"
        showStatus
        onOpenChange={(open) => {
          if (!open) {
            setEditTarget(null);
            setEditForm(EMPTY_FORM);
            setEditOrderUnlocked(false);
          }
        }}
        onFormChange={setEditForm}
        onSubmit={submitEdit}
      />
      <DeletePermissionDialog
        open={!!deleteTarget}
        title="Xóa feature"
        description={
          deleteTarget?.isSystemDefined
            ? `Bạn có chắc muốn xóa ${deleteTarget.name} không? Đây là dữ liệu hệ thống, backend có thể từ chối thao tác này.`
            : `Bạn có chắc muốn xóa ${deleteTarget?.name ?? "feature này"} không?`
        }
        loading={deleteFeature.isPending}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </PermissionPageShell>
  );
}

function formFromFeature(feature: Feature): FeatureForm {
  return {
    systemModuleDefinitionId: feature.systemModuleDefinitionId,
    name: feature.name,
    description: feature.description,
    displayOrder: feature.displayOrder,
    isActive: feature.isActive,
  };
}

function payloadFromForm(form: FeatureForm) {
  return {
    systemModuleDefinitionId: form.systemModuleDefinitionId,
    name: form.name.trim(),
    description: cleanOptional(form.description),
    displayOrder: form.displayOrder,
  };
}

function nextFeatureDisplayOrder(features: Feature[]): number {
  return Math.max(0, ...features.map((feature) => feature.displayOrder ?? 0)) + 1;
}

function displayOrderError(value: number, features: Feature[], currentFeatureId?: string): string | undefined {
  if (!Number.isInteger(value) || value < 1) return "Thứ tự phải là số nguyên dương.";
  const duplicate = features.some((feature) => feature.id !== currentFeatureId && (feature.displayOrder ?? 0) === value);
  return duplicate ? "Thứ tự này đã được dùng bởi feature khác." : undefined;
}
