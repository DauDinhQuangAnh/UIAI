import { createFileRoute } from "@tanstack/react-router";
import { type FormEvent, useMemo, useState } from "react";
import { Files, Plus } from "@phosphor-icons/react";
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
  StatusSelect,
  SystemBadge,
  apiErrorMessage,
  statusParam,
  type StatusFilterValue,
} from "@/components/permissions/permission-ui";
import { usePermissionFeatures } from "@/api/hooks/permission-features";
import { useCreatePermissionPage, useDeletePermissionPage, usePermissionPages, useUpdatePermissionPage } from "@/api/hooks/permission-pages";
import { useSystemPageDefinitions } from "@/api/hooks/system-permission-definitions";
import type { Feature, Page } from "@/api/permission-types";
import { PERMISSIONS, usePermissionSet } from "@/auth/permissions";

type MenuFilterValue = "all" | "visible" | "hidden";

interface PageForm {
  featureId: string;
  systemPageDefinitionId: string;
  name: string;
  route: string;
  icon: string;
  displayOrder: number;
  isMenuVisible: boolean;
  isActive: boolean;
}

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
  const [editTarget, setEditTarget] = useState<Page | null>(null);
  const [editForm, setEditForm] = useState<PageForm>(EMPTY_FORM);
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
  const createPage = useCreatePermissionPage();
  const updatePage = useUpdatePermissionPage();
  const deletePage = useDeletePermissionPage();
  const items = pages.data ?? [];

  const submitAdd = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
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
          <Button type="button" size="sm" disabled={!can(PERMISSIONS.pages.create)} onClick={() => setAddOpen(true)}>
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
          <PermissionDataTable>
            <TableHeader className="bg-brand-700">
              <TableRow className="hover:bg-brand-700">
                <PermissionHeadCell className="w-[14%]">Feature</PermissionHeadCell>
                <PermissionHeadCell className="w-[16%]">Tên</PermissionHeadCell>
                <PermissionHeadCell className="w-[14%]">Mã</PermissionHeadCell>
                <PermissionHeadCell>Route</PermissionHeadCell>
                <PermissionHeadCell className="w-[10%]">Icon</PermissionHeadCell>
                <PermissionHeadCell className="w-[8%]">Thứ tự</PermissionHeadCell>
                <PermissionHeadCell className="w-[10%]">Menu</PermissionHeadCell>
                <PermissionHeadCell className="w-[10%]">Trạng thái</PermissionHeadCell>
                <PermissionHeadCell className="w-24 text-right">Thao tác</PermissionHeadCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((page) => (
                <TableRow key={page.id}>
                  <TableCell className="text-sm text-text-secondary">{page.featureName}</TableCell>
                  <TableCell className="font-medium text-text-primary">{page.name}</TableCell>
                  <TableCell className="font-mono text-xs text-text-secondary">{page.code}</TableCell>
                  <TableCell className="font-mono text-xs text-text-secondary">{page.route || "-"}</TableCell>
                  <TableCell className="font-mono text-xs text-text-secondary">{page.icon || "-"}</TableCell>
                  <TableCell className="font-mono text-sm">{page.displayOrder}</TableCell>
                  <TableCell><SystemBadge system={page.isMenuVisible} label="Hiện" /></TableCell>
                  <TableCell><ActiveBadge active={page.isActive} /></TableCell>
                  <TableCell>
                    <PermissionActionButtons
                      editLabel={`Sửa ${page.name}`}
                      deleteLabel={`Xóa ${page.name}`}
                      editDisabled={!can(PERMISSIONS.pages.update) || page.isSystemDefined}
                      deleteDisabled={!can(PERMISSIONS.pages.delete) || page.isSystemDefined}
                      deleteTitle={page.isSystemDefined ? "Page hệ thống được backend bảo vệ." : undefined}
                      onEdit={() => {
                        setEditTarget(page);
                        setEditForm(formFromPage(page));
                      }}
                      onDelete={() => setDeleteTarget(page)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </PermissionDataTable>
        )}
      </div>
      <PageDialog
        open={addOpen}
        title="Thêm page"
        description="Chọn feature rồi chọn page definition tương ứng với module của feature."
        form={form}
        features={features.data ?? []}
        loading={createPage.isPending || features.isLoading}
        submitLabel="Tạo page"
        onOpenChange={(open) => {
          setAddOpen(open);
          if (!open) setForm(EMPTY_FORM);
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
        title="Xóa page"
        description={`Bạn có chắc muốn xóa ${deleteTarget?.name ?? "page này"} không?`}
        loading={deletePage.isPending}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </PermissionPageShell>
  );
}

function PageDialog(props: {
  open: boolean;
  title: string;
  description: string;
  form: PageForm;
  features: Feature[];
  loading?: boolean;
  submitLabel: string;
  showStatus?: boolean;
  onOpenChange: (open: boolean) => void;
  onFormChange: (form: PageForm) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const selectedFeature = props.features.find((feature) => feature.id === props.form.featureId);
  const pageDefinitions = useSystemPageDefinitions(selectedFeature?.systemModuleDefinitionId || undefined);
  const loading = props.loading || pageDefinitions.isLoading;
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader className="items-center text-center">
          <DialogTitle className="text-brand-800">{props.title}</DialogTitle>
          <DialogDescription>{props.description}</DialogDescription>
        </DialogHeader>
        <form onSubmit={props.onSubmit} className="grid gap-4">
          <PermissionField label="Feature" htmlFor="page_feature" required>
            <Select
              value={props.form.featureId}
              disabled={loading}
              onValueChange={(value) => props.onFormChange({ ...props.form, featureId: value, systemPageDefinitionId: "" })}
            >
              <SelectTrigger id="page_feature"><SelectValue placeholder="Chọn feature" /></SelectTrigger>
              <SelectContent>
                {props.features.map((feature) => (
                  <SelectItem key={feature.id} value={feature.id}>{feature.name} ({feature.code})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </PermissionField>
          <PermissionField label="Page definition" htmlFor="page_definition" required>
            <Select
              value={props.form.systemPageDefinitionId}
              disabled={loading || !selectedFeature}
              onValueChange={(value) => {
                const definition = pageDefinitions.data?.find((item) => item.id === value);
                props.onFormChange({
                  ...props.form,
                  systemPageDefinitionId: value,
                  name: props.form.name || definition?.name || "",
                  route: props.form.route || definition?.route || "",
                  icon: props.form.icon || definition?.icon || "",
                  displayOrder: props.form.displayOrder || definition?.displayOrder || 0,
                });
              }}
            >
              <SelectTrigger id="page_definition"><SelectValue placeholder="Chọn page definition" /></SelectTrigger>
              <SelectContent>
                {(pageDefinitions.data ?? []).filter((item) => item.isActive).map((item) => (
                  <SelectItem key={item.id} value={item.id}>{item.name} ({item.code})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </PermissionField>
          <PermissionField label="Tên page" htmlFor="page_name" required>
            <Input id="page_name" value={props.form.name} disabled={loading} onChange={(event) => props.onFormChange({ ...props.form, name: event.target.value })} required />
          </PermissionField>
          <PermissionField label="Route" htmlFor="page_route" required>
            <Input id="page_route" value={props.form.route} disabled={loading} onChange={(event) => props.onFormChange({ ...props.form, route: event.target.value })} required />
          </PermissionField>
          <PermissionField label="Icon" htmlFor="page_icon">
            <Input id="page_icon" value={props.form.icon} disabled={loading} onChange={(event) => props.onFormChange({ ...props.form, icon: event.target.value })} />
          </PermissionField>
          <PermissionField label="Thứ tự" htmlFor="page_order" required>
            <Input id="page_order" type="number" value={props.form.displayOrder} disabled={loading} onChange={(event) => props.onFormChange({ ...props.form, displayOrder: Number(event.target.value) })} required />
          </PermissionField>
          <PermissionField label="Hiển thị menu" htmlFor="page_menu">
            <Select value={String(props.form.isMenuVisible)} disabled={loading} onValueChange={(value) => props.onFormChange({ ...props.form, isMenuVisible: value === "true" })}>
              <SelectTrigger id="page_menu"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Hiện trong menu</SelectItem>
                <SelectItem value="false">Ẩn khỏi menu</SelectItem>
              </SelectContent>
            </Select>
          </PermissionField>
          {props.showStatus && (
            <PermissionField label="Trạng thái" htmlFor="page_status">
              <StatusSelect value={props.form.isActive ? "active" : "inactive"} disabled={loading} onChange={(value) => props.onFormChange({ ...props.form, isActive: value !== "inactive" })} />
            </PermissionField>
          )}
          <DialogFooter className="mt-3">
            <Button type="button" variant="secondary" onClick={() => props.onOpenChange(false)}>Hủy</Button>
            <Button type="submit" loading={loading}>{props.submitLabel}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function FeatureSelect({ value, features, onChange }: { value: string; features: Feature[]; onChange: (value: string) => void }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger aria-label="Lọc feature" className="min-w-48"><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Tất cả feature</SelectItem>
        {features.map((feature) => (
          <SelectItem key={feature.id} value={feature.id}>{feature.name}</SelectItem>
        ))}
      </SelectContent>
    </Select>
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
