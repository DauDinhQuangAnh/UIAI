import { createFileRoute } from "@tanstack/react-router";
import { type FormEvent, useMemo, useState } from "react";
import { PuzzlePiece, Plus } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/common/empty-state";
import {
  ActiveBadge,
  DeletePermissionDialog,
  PermissionActionButtons,
  PermissionDataTable,
  PermissionField,
  PermissionHeadCell,
  PermissionPageShell,
  PermissionToolbar,
  SystemBadge,
  apiErrorMessage,
  cleanOptional,
  statusParam,
  type StatusFilterValue,
} from "@/components/permissions/permission-ui";
import {
  useCreatePermissionFeature,
  useDeletePermissionFeature,
  usePermissionFeatures,
  useUpdatePermissionFeature,
} from "@/api/hooks/permission-features";
import { useSystemModuleDefinitions } from "@/api/hooks/system-permission-definitions";
import type { Feature } from "@/api/permission-types";
import { PERMISSIONS, usePermissionSet } from "@/auth/permissions";

interface FeatureForm {
  systemModuleDefinitionId: string;
  name: string;
  description: string;
  displayOrder: number;
  isActive: boolean;
}

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
  const [editTarget, setEditTarget] = useState<Feature | null>(null);
  const [editForm, setEditForm] = useState<FeatureForm>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<Feature | null>(null);

  const params = useMemo(() => ({ keyword: keyword.trim() || undefined, isActive: statusParam(statusFilter) }), [keyword, statusFilter]);
  const features = usePermissionFeatures(params);
  const modules = useSystemModuleDefinitions();
  const createFeature = useCreatePermissionFeature();
  const updateFeature = useUpdatePermissionFeature();
  const deleteFeature = useDeletePermissionFeature();
  const items = features.data ?? [];

  const submitAdd = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
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
          <Button type="button" size="sm" disabled={!can(PERMISSIONS.features.create)} onClick={() => setAddOpen(true)}>
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
          <PermissionDataTable>
            <TableHeader className="bg-brand-700">
              <TableRow className="hover:bg-brand-700">
                <PermissionHeadCell className="w-[18%]">Tên</PermissionHeadCell>
                <PermissionHeadCell className="w-[16%]">Mã</PermissionHeadCell>
                <PermissionHeadCell>Mô tả</PermissionHeadCell>
                <PermissionHeadCell className="w-[10%]">Thứ tự</PermissionHeadCell>
                <PermissionHeadCell className="w-[12%]">Loại</PermissionHeadCell>
                <PermissionHeadCell className="w-[12%]">Trạng thái</PermissionHeadCell>
                <PermissionHeadCell className="w-24 text-right">Thao tác</PermissionHeadCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((feature) => (
                <TableRow key={feature.id}>
                  <TableCell className="font-medium text-text-primary">{feature.name}</TableCell>
                  <TableCell className="font-mono text-xs text-text-secondary">{feature.code}</TableCell>
                  <TableCell className="text-sm text-text-secondary">{feature.description || "-"}</TableCell>
                  <TableCell className="font-mono text-sm">{feature.displayOrder}</TableCell>
                  <TableCell><SystemBadge system={feature.isSystemDefined} /></TableCell>
                  <TableCell><ActiveBadge active={feature.isActive} /></TableCell>
                  <TableCell>
                    <PermissionActionButtons
                      editLabel={`Sửa ${feature.name}`}
                      deleteLabel={`Xóa ${feature.name}`}
                      editDisabled={!can(PERMISSIONS.features.update)}
                      deleteDisabled={!can(PERMISSIONS.features.delete)}
                      editTitle={
                        !can(PERMISSIONS.features.update)
                          ? "Bạn không có quyền cập nhật"
                          : feature.isSystemDefined
                            ? "Feature hệ thống có thể được backend bảo vệ."
                            : undefined
                      }
                      deleteTitle={
                        !can(PERMISSIONS.features.delete)
                          ? "Bạn không có quyền xóa"
                          : feature.isSystemDefined
                            ? "Feature hệ thống có thể được backend bảo vệ."
                            : undefined
                      }
                      onEdit={() => {
                        setEditTarget(feature);
                        setEditForm(formFromFeature(feature));
                      }}
                      onDelete={() => setDeleteTarget(feature)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </PermissionDataTable>
        )}
      </div>

      <FeatureDialog
        open={addOpen}
        title="Thêm feature"
        description="Chọn system module definition và đặt thông tin hiển thị cho feature."
        form={form}
        modules={modules.data ?? []}
        loading={createFeature.isPending || modules.isLoading}
        submitLabel="Tạo feature"
        onOpenChange={(open) => {
          setAddOpen(open);
          if (!open) setForm(EMPTY_FORM);
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
        submitLabel="Lưu thay đổi"
        showStatus
        onOpenChange={(open) => {
          if (!open) {
            setEditTarget(null);
            setEditForm(EMPTY_FORM);
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

function FeatureDialog({
  open,
  title,
  description,
  form,
  modules,
  loading,
  submitLabel,
  showStatus,
  onOpenChange,
  onFormChange,
  onSubmit,
}: {
  open: boolean;
  title: string;
  description: string;
  form: FeatureForm;
  modules: Array<{ id: string; name: string; code: string; isActive: boolean }>;
  loading?: boolean;
  submitLabel: string;
  showStatus?: boolean;
  onOpenChange: (open: boolean) => void;
  onFormChange: (form: FeatureForm) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader className="items-center text-center">
          <DialogTitle className="text-brand-800">{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-4">
          <PermissionField label="Module" htmlFor="feature_module" required>
            <Select
              value={form.systemModuleDefinitionId}
              disabled={loading}
              onValueChange={(value) => {
                const module = modules.find((item) => item.id === value);
                onFormChange({ ...form, systemModuleDefinitionId: value, name: form.name || module?.name || "" });
              }}
            >
              <SelectTrigger id="feature_module">
                <SelectValue placeholder="Chọn module" />
              </SelectTrigger>
              <SelectContent>
                {modules.filter((item) => item.isActive).map((item) => (
                  <SelectItem key={item.id} value={item.id}>{item.name} ({item.code})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </PermissionField>
          <PermissionField label="Tên feature" htmlFor="feature_name" required>
            <Input id="feature_name" value={form.name} disabled={loading} onChange={(event) => onFormChange({ ...form, name: event.target.value })} required />
          </PermissionField>
          <PermissionField label="Mô tả" htmlFor="feature_description">
            <Input id="feature_description" value={form.description} disabled={loading} onChange={(event) => onFormChange({ ...form, description: event.target.value })} />
          </PermissionField>
          <PermissionField label="Thứ tự" htmlFor="feature_order" required>
            <Input
              id="feature_order"
              type="number"
              value={form.displayOrder}
              disabled={loading}
              onChange={(event) => onFormChange({ ...form, displayOrder: Number(event.target.value) })}
              required
            />
          </PermissionField>
          {showStatus && (
            <PermissionField label="Trạng thái" htmlFor="feature_status">
              <Select value={String(form.isActive)} disabled={loading} onValueChange={(value) => onFormChange({ ...form, isActive: value === "true" })}>
                <SelectTrigger id="feature_status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Hoạt động</SelectItem>
                  <SelectItem value="false">Không hoạt động</SelectItem>
                </SelectContent>
              </Select>
            </PermissionField>
          )}
          <DialogFooter className="mt-3">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>Hủy</Button>
            <Button type="submit" loading={loading}>{submitLabel}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
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
