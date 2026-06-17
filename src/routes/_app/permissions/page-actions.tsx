import { createFileRoute } from "@tanstack/react-router";
import { type FormEvent, useMemo, useState } from "react";
import { LinkSimple, Plus } from "@phosphor-icons/react";
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
import { usePermissionFeatures } from "@/api/hooks/permission-features";
import { usePermissionPages } from "@/api/hooks/permission-pages";
import { usePermissionActions } from "@/api/hooks/permission-actions";
import { useCreatePageAction, useDeletePageAction, usePageActions, useUpdatePageAction } from "@/api/hooks/page-actions";
import type { Feature, Page, PageAction, PermissionAction } from "@/api/permission-types";
import { PERMISSIONS, usePermissionSet } from "@/auth/permissions";

interface PageActionForm {
  featureId: string;
  pageId: string;
  permissionActionId: string;
  description: string;
  isActive: boolean;
}

const EMPTY_FORM: PageActionForm = {
  featureId: "",
  pageId: "",
  permissionActionId: "",
  description: "",
  isActive: true,
};

export const Route = createFileRoute("/_app/permissions/page-actions")({
  component: PageActionConfigScreen,
});

function PageActionConfigScreen() {
  const can = usePermissionSet();
  const [keyword, setKeyword] = useState("");
  const [featureFilter, setFeatureFilter] = useState("all");
  const [pageFilter, setPageFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>("all");
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState<PageActionForm>(EMPTY_FORM);
  const [editTarget, setEditTarget] = useState<PageAction | null>(null);
  const [editForm, setEditForm] = useState<PageActionForm>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<PageAction | null>(null);

  const features = usePermissionFeatures({ isActive: true });
  const filterPages = usePermissionPages({ featureId: featureFilter === "all" ? undefined : featureFilter, isActive: true });
  const allPages = usePermissionPages({ isActive: true });
  const permissionActions = usePermissionActions({ isActive: true });
  const params = useMemo(
    () => ({
      featureId: featureFilter === "all" ? undefined : featureFilter,
      pageId: pageFilter === "all" ? undefined : pageFilter,
      permissionActionId: actionFilter === "all" ? undefined : actionFilter,
      keyword: keyword.trim() || undefined,
      isActive: statusParam(statusFilter),
    }),
    [actionFilter, featureFilter, keyword, pageFilter, statusFilter],
  );
  const pageActions = usePageActions(params);
  const createPageAction = useCreatePageAction();
  const updatePageAction = useUpdatePageAction();
  const deletePageAction = useDeletePageAction();
  const items = pageActions.data ?? [];

  const submitAdd = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    createPageAction.mutate(payloadFromForm(form), {
      onSuccess: () => {
        toast.success("Đã tạo page action.");
        setAddOpen(false);
        setForm(EMPTY_FORM);
      },
      onError: (error) => toast.error(apiErrorMessage(error, "Không thể tạo page action.")),
    });
  };

  const submitEdit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editTarget) return;
    updatePageAction.mutate(
      { id: editTarget.id, body: { ...payloadFromForm(editForm), isActive: editForm.isActive } },
      {
        onSuccess: () => {
          toast.success("Đã cập nhật page action.");
          setEditTarget(null);
          setEditForm(EMPTY_FORM);
        },
        onError: (error) => toast.error(apiErrorMessage(error, "Không thể cập nhật page action.")),
      },
    );
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deletePageAction.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success("Đã xóa page action.");
        setDeleteTarget(null);
      },
      onError: (error) => toast.error(apiErrorMessage(error, "Không thể xóa page action.")),
    });
  };

  return (
    <PermissionPageShell title="Cấu hình page action" description="Gắn action vào page để backend sinh permissionCode." icon={LinkSimple}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-semibold text-text-primary">Cấu hình page action</h2>
            <p className="text-sm text-text-secondary">{items.length} page action phù hợp với bộ lọc hiện tại.</p>
          </div>
          <Button type="button" size="sm" disabled={!can(PERMISSIONS.pageActions.create)} onClick={() => setAddOpen(true)}>
            <Plus className="size-4" aria-hidden />
            Thêm page action
          </Button>
        </div>
        <PermissionToolbar keyword={keyword} keywordPlaceholder="Tìm theo page, action, permission code..." status={statusFilter} onKeywordChange={setKeyword} onStatusChange={setStatusFilter}>
          <Select value={featureFilter} onValueChange={(value) => {
            setFeatureFilter(value);
            setPageFilter("all");
          }}>
            <SelectTrigger aria-label="Lọc feature" className="min-w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả feature</SelectItem>
              {(features.data ?? []).map((feature) => <SelectItem key={feature.id} value={feature.id}>{feature.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={pageFilter} onValueChange={setPageFilter}>
            <SelectTrigger aria-label="Lọc page" className="min-w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả page</SelectItem>
              {(filterPages.data ?? []).map((page) => <SelectItem key={page.id} value={page.id}>{page.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger aria-label="Lọc action" className="min-w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả action</SelectItem>
              {(permissionActions.data ?? []).map((action) => <SelectItem key={action.id} value={action.id}>{action.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </PermissionToolbar>
        {pageActions.isLoading ? (
          <div className="rounded-md border border-border bg-surface p-8 text-center text-sm text-text-secondary">Đang tải page action...</div>
        ) : pageActions.isError ? (
          <EmptyState icon={LinkSimple} title="Không tải được page action" description={apiErrorMessage(pageActions.error, "Vui lòng thử lại sau.")} action={<Button type="button" variant="secondary" onClick={() => pageActions.refetch()}>Tải lại</Button>} />
        ) : items.length === 0 ? (
          <EmptyState icon={LinkSimple} title="Chưa có page action" description="Tạo page action để sinh permission code cho role." />
        ) : (
          <PermissionDataTable>
            <TableHeader className="bg-brand-700">
              <TableRow className="hover:bg-brand-700">
                <PermissionHeadCell className="w-[14%]">Feature</PermissionHeadCell>
                <PermissionHeadCell className="w-[16%]">Page</PermissionHeadCell>
                <PermissionHeadCell className="w-[14%]">Action</PermissionHeadCell>
                <PermissionHeadCell>Permission code</PermissionHeadCell>
                <PermissionHeadCell className="w-[18%]">Mô tả</PermissionHeadCell>
                <PermissionHeadCell className="w-[10%]">Loại</PermissionHeadCell>
                <PermissionHeadCell className="w-[10%]">Trạng thái</PermissionHeadCell>
                <PermissionHeadCell className="w-24 text-right">Thao tác</PermissionHeadCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="text-sm text-text-secondary">{item.featureName}</TableCell>
                  <TableCell className="text-sm text-text-primary">{item.pageName}</TableCell>
                  <TableCell className="text-sm text-text-primary">{item.actionName}</TableCell>
                  <TableCell className="font-mono text-xs text-text-secondary">{item.permissionCode}</TableCell>
                  <TableCell className="text-sm text-text-secondary">{item.description || "-"}</TableCell>
                  <TableCell><SystemBadge system={item.isSystemDefined} /></TableCell>
                  <TableCell><ActiveBadge active={item.isActive} /></TableCell>
                  <TableCell>
                    <PermissionActionButtons
                      editLabel={`Sửa ${item.permissionCode}`}
                      deleteLabel={`Xóa ${item.permissionCode}`}
                      editDisabled={!can(PERMISSIONS.pageActions.update) || item.isSystemDefined}
                      deleteDisabled={!can(PERMISSIONS.pageActions.delete) || item.isSystemDefined}
                      deleteTitle={item.isSystemDefined ? "Page action hệ thống được backend bảo vệ." : undefined}
                      onEdit={() => {
                        setEditTarget(item);
                        setEditForm(formFromPageAction(item));
                      }}
                      onDelete={() => setDeleteTarget(item)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </PermissionDataTable>
        )}
      </div>
      <PageActionDialog
        open={addOpen}
        title="Thêm page action"
        description="Chọn page và action; permissionCode sẽ do backend sinh."
        form={form}
        features={features.data ?? []}
        pages={allPages.data ?? []}
        actions={permissionActions.data ?? []}
        loading={createPageAction.isPending || features.isLoading || allPages.isLoading || permissionActions.isLoading}
        submitLabel="Tạo page action"
        onOpenChange={(open) => {
          setAddOpen(open);
          if (!open) setForm(EMPTY_FORM);
        }}
        onFormChange={setForm}
        onSubmit={submitAdd}
      />
      <PageActionDialog
        open={!!editTarget}
        title="Sửa page action"
        description={`Cập nhật thông tin cho ${editTarget?.permissionCode ?? "page action"}.`}
        form={editForm}
        features={features.data ?? []}
        pages={allPages.data ?? []}
        actions={permissionActions.data ?? []}
        loading={updatePageAction.isPending || features.isLoading || allPages.isLoading || permissionActions.isLoading}
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
        title="Xóa page action"
        description={`Bạn có chắc muốn xóa ${deleteTarget?.permissionCode ?? "page action này"} không?`}
        loading={deletePageAction.isPending}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </PermissionPageShell>
  );
}

function PageActionDialog(props: {
  open: boolean;
  title: string;
  description: string;
  form: PageActionForm;
  features: Feature[];
  pages: Page[];
  actions: PermissionAction[];
  loading?: boolean;
  submitLabel: string;
  showStatus?: boolean;
  onOpenChange: (open: boolean) => void;
  onFormChange: (form: PageActionForm) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const pages = props.form.featureId ? props.pages.filter((page) => page.featureId === props.form.featureId) : props.pages;
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader className="items-center text-center">
          <DialogTitle className="text-brand-800">{props.title}</DialogTitle>
          <DialogDescription>{props.description}</DialogDescription>
        </DialogHeader>
        <form onSubmit={props.onSubmit} className="grid gap-4">
          <PermissionField label="Feature" htmlFor="pa_feature">
            <Select value={props.form.featureId || "all"} disabled={props.loading} onValueChange={(value) => props.onFormChange({ ...props.form, featureId: value === "all" ? "" : value, pageId: "" })}>
              <SelectTrigger id="pa_feature"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả feature</SelectItem>
                {props.features.map((feature) => <SelectItem key={feature.id} value={feature.id}>{feature.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </PermissionField>
          <PermissionField label="Page" htmlFor="pa_page" required>
            <Select value={props.form.pageId} disabled={props.loading} onValueChange={(value) => {
              const page = props.pages.find((item) => item.id === value);
              props.onFormChange({ ...props.form, pageId: value, featureId: page?.featureId ?? props.form.featureId });
            }}>
              <SelectTrigger id="pa_page"><SelectValue placeholder="Chọn page" /></SelectTrigger>
              <SelectContent>
                {pages.map((page) => <SelectItem key={page.id} value={page.id}>{page.name} ({page.featureName})</SelectItem>)}
              </SelectContent>
            </Select>
          </PermissionField>
          <PermissionField label="Action" htmlFor="pa_action" required>
            <Select value={props.form.permissionActionId} disabled={props.loading} onValueChange={(value) => props.onFormChange({ ...props.form, permissionActionId: value })}>
              <SelectTrigger id="pa_action"><SelectValue placeholder="Chọn action" /></SelectTrigger>
              <SelectContent>
                {props.actions.map((action) => <SelectItem key={action.id} value={action.id}>{action.name} ({action.code})</SelectItem>)}
              </SelectContent>
            </Select>
          </PermissionField>
          <PermissionField label="Mô tả" htmlFor="pa_description">
            <Input id="pa_description" value={props.form.description} disabled={props.loading} onChange={(event) => props.onFormChange({ ...props.form, description: event.target.value })} />
          </PermissionField>
          {props.showStatus && (
            <PermissionField label="Trạng thái" htmlFor="pa_status">
              <Select value={String(props.form.isActive)} disabled={props.loading} onValueChange={(value) => props.onFormChange({ ...props.form, isActive: value === "true" })}>
                <SelectTrigger id="pa_status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Hoạt động</SelectItem>
                  <SelectItem value="false">Không hoạt động</SelectItem>
                </SelectContent>
              </Select>
            </PermissionField>
          )}
          <DialogFooter className="mt-3">
            <Button type="button" variant="secondary" onClick={() => props.onOpenChange(false)}>Hủy</Button>
            <Button type="submit" loading={props.loading}>{props.submitLabel}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function formFromPageAction(action: PageAction): PageActionForm {
  return {
    featureId: action.featureId,
    pageId: action.pageId,
    permissionActionId: action.permissionActionId,
    description: action.description,
    isActive: action.isActive,
  };
}

function payloadFromForm(form: PageActionForm) {
  return {
    pageId: form.pageId,
    permissionActionId: form.permissionActionId,
    description: cleanOptional(form.description),
  };
}
