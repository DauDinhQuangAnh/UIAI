import { createFileRoute } from "@tanstack/react-router";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { Files, Plus } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/common/empty-state";
import {
  DeletePermissionDialog,
  PermissionPageShell,
  PermissionToolbar,
  apiErrorMessage,
  statusParam,
  type StatusFilterValue,
} from "@/components/permissions/permission-ui";
import { FeatureSelect, PageDialog, type PageForm } from "@/components/permissions/pages/page-dialog";
import { PageTable } from "@/components/permissions/pages/page-table";
import { usePermissionFeatures } from "@/api/hooks/permission-features";
import { useCreatePermissionPage, useDeletePermissionPage, usePermissionPages, useUpdatePermissionPage } from "@/api/hooks/permission-pages";
import type { Page } from "@/api/permission-types";
import { PERMISSIONS, usePermissionSet } from "@/auth/permissions";

type MenuFilterValue = "all" | "visible" | "hidden";

const EMPTY_FORM: PageForm = {
  featureId: "",
  systemPageDefinitionId: "",
  name: "",
  route: "",
  icon: "",
  displayOrder: 0,
  isMenuVisible: true,
  isActive: true,
};

export const Route = createFileRoute("/_app/permissions/pages")({
  component: PageConfigScreen,
});

function PageConfigScreen() {
  const can = usePermissionSet();
  const [keyword, setKeyword] = useState("");
  const [featureFilter, setFeatureFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>("all");
  const [menuFilter, setMenuFilter] = useState<MenuFilterValue>("all");
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState<PageForm>(EMPTY_FORM);
  const [addOrderUnlocked, setAddOrderUnlocked] = useState(false);
  const [editTarget, setEditTarget] = useState<Page | null>(null);
  const [editForm, setEditForm] = useState<PageForm>(EMPTY_FORM);
  const [editOrderUnlocked, setEditOrderUnlocked] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Page | null>(null);

  const features = usePermissionFeatures({ isActive: true });
  const params = useMemo(
    () => ({
      featureId: featureFilter === "all" ? undefined : featureFilter,
      keyword: keyword.trim() || undefined,
      isActive: statusParam(statusFilter),
      isMenuVisible: menuFilter === "all" ? undefined : menuFilter === "visible",
    }),
    [featureFilter, keyword, menuFilter, statusFilter],
  );
  const pages = usePermissionPages(params);
  const allPages = usePermissionPages({});
  const createPage = useCreatePermissionPage();
  const updatePage = useUpdatePermissionPage();
  const deletePage = useDeletePermissionPage();
  const items = pages.data ?? [];
  const allPageItems = allPages.data ?? [];
  const addOrderError = pageDisplayOrderError(form.displayOrder, allPageItems, form.featureId);
  const editOrderError = pageDisplayOrderError(editForm.displayOrder, allPageItems, editForm.featureId, editTarget?.id);

  useEffect(() => {
    if (!addOpen || addOrderUnlocked || !form.featureId) return;
    setForm((current) => ({ ...current, displayOrder: nextPageDisplayOrder(allPageItems, current.featureId) }));
  }, [addOpen, addOrderUnlocked, allPageItems, form.featureId]);

  const submitAdd = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (addOrderError) return;
    createPage.mutate(payloadFromForm(form), {
      onSuccess: () => {
        toast.success("Đã tạo page.");
        setAddOpen(false);
        setForm(EMPTY_FORM);
      },
      onError: (error) => toast.error(apiErrorMessage(error, "Không thể tạo page.")),
    });
  };

  const submitEdit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editTarget) return;
    if (editOrderError) return;
    updatePage.mutate(
      { id: editTarget.id, body: { ...payloadFromForm(editForm), isActive: editForm.isActive } },
      {
        onSuccess: () => {
          toast.success("Đã cập nhật page.");
          setEditTarget(null);
          setEditForm(EMPTY_FORM);
        },
        onError: (error) => toast.error(apiErrorMessage(error, "Không thể cập nhật page.")),
      },
    );
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deletePage.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success("Đã xóa page.");
        setDeleteTarget(null);
      },
      onError: (error) => toast.error(apiErrorMessage(error, "Không thể xóa page.")),
    });
  };

  return (
    <PermissionPageShell title="Cấu hình page" description="Quản lý page, route, icon và khả năng hiển thị trong menu." icon={Files}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-semibold text-text-primary">Cấu hình page</h2>
            <p className="text-sm text-text-secondary">{items.length} page phù hợp với bộ lọc hiện tại.</p>
          </div>
          <Button
            type="button"
            size="sm"
            disabled={!can(PERMISSIONS.pages.create)}
            onClick={() => {
              setForm({ ...EMPTY_FORM, displayOrder: 1 });
              setAddOrderUnlocked(false);
              setAddOpen(true);
            }}
          >
            <Plus className="size-4" aria-hidden />
            Thêm page
          </Button>
        </div>
        <PermissionToolbar keyword={keyword} keywordPlaceholder="Tìm theo tên, route, mã page..." status={statusFilter} onKeywordChange={setKeyword} onStatusChange={setStatusFilter}>
          <FeatureSelect value={featureFilter} features={features.data ?? []} onChange={setFeatureFilter} />
          <Select value={menuFilter} onValueChange={(value) => setMenuFilter(value as MenuFilterValue)}>
            <SelectTrigger aria-label="Lọc hiển thị menu" className="min-w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả menu</SelectItem>
              <SelectItem value="visible">Hiện trong menu</SelectItem>
              <SelectItem value="hidden">Ẩn khỏi menu</SelectItem>
            </SelectContent>
          </Select>
        </PermissionToolbar>
        {pages.isLoading ? (
          <div className="rounded-md border border-border bg-surface p-8 text-center text-sm text-text-secondary">Đang tải page...</div>
        ) : pages.isError ? (
          <EmptyState icon={Files} title="Không tải được page" description={apiErrorMessage(pages.error, "Vui lòng thử lại sau.")} action={<Button type="button" variant="secondary" onClick={() => pages.refetch()}>Tải lại</Button>} />
        ) : items.length === 0 ? (
          <EmptyState icon={Files} title="Chưa có page" description="Tạo page từ system page definition để backend sinh mã permission đúng chuẩn." />
        ) : (
          <PageTable
            items={items}
            canUpdate={can(PERMISSIONS.pages.update)}
            canDelete={can(PERMISSIONS.pages.delete)}
            onEdit={(page) => {
              setEditTarget(page);
              setEditForm(formFromPage(page));
              setEditOrderUnlocked(false);
            }}
            onDelete={setDeleteTarget}
          />
        )}
      </div>
      <PageDialog
        open={addOpen}
        title="Thêm page"
        description="Chọn feature rồi chọn page definition tương ứng với module của feature."
        form={form}
        features={features.data ?? []}
        loading={createPage.isPending || features.isLoading}
        orderUnlocked={addOrderUnlocked}
        orderError={addOrderError}
        onUnlockOrder={() => setAddOrderUnlocked(true)}
        submitLabel="Tạo page"
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
      <PageDialog
        open={!!editTarget}
        title="Sửa page"
        description={`Cập nhật thông tin cho ${editTarget?.name ?? "page"}.`}
        form={editForm}
        features={features.data ?? []}
        loading={updatePage.isPending || features.isLoading}
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
        title="Xóa page"
        description={
          deleteTarget?.isSystemDefined
            ? `Bạn có chắc muốn xóa ${deleteTarget.name} không? Đây là dữ liệu hệ thống, backend có thể từ chối thao tác này.`
            : `Bạn có chắc muốn xóa ${deleteTarget?.name ?? "page này"} không?`
        }
        loading={deletePage.isPending}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </PermissionPageShell>
  );
}

function formFromPage(page: Page): PageForm {
  return {
    featureId: page.featureId,
    systemPageDefinitionId: page.systemPageDefinitionId,
    name: page.name,
    route: page.route,
    icon: page.icon,
    displayOrder: page.displayOrder,
    isMenuVisible: page.isMenuVisible,
    isActive: page.isActive,
  };
}

function payloadFromForm(form: PageForm) {
  return {
    featureId: form.featureId,
    systemPageDefinitionId: form.systemPageDefinitionId,
    name: form.name.trim(),
    route: form.route.trim(),
    icon: form.icon.trim() || null,
    displayOrder: form.displayOrder,
    isMenuVisible: form.isMenuVisible,
  };
}

function nextPageDisplayOrder(pages: Page[], featureId: string): number {
  const pagesInFeature = pages.filter((page) => page.featureId === featureId);
  return Math.max(0, ...pagesInFeature.map((page) => page.displayOrder ?? 0)) + 1;
}

function pageDisplayOrderError(value: number, pages: Page[], featureId: string, currentPageId?: string): string | undefined {
  if (!Number.isInteger(value) || value < 1) return "Thứ tự phải là số nguyên dương.";
  if (!featureId) return undefined;
  const duplicate = pages.some((page) => page.id !== currentPageId && page.featureId === featureId && (page.displayOrder ?? 0) === value);
  return duplicate ? "Thứ tự này đã được dùng bởi page khác trong feature này." : undefined;
}
