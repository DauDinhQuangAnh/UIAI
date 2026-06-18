import type { FormEvent } from "react";
import { PencilSimple } from "@phosphor-icons/react";
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
import { PermissionField, StatusSelect } from "@/components/permissions/permission-ui";
import { useSystemPageDefinitions } from "@/api/hooks/system-permission-definitions";
import type { Feature } from "@/api/permission-types";

export interface PageForm {
  featureId: string;
  systemPageDefinitionId: string;
  name: string;
  route: string;
  icon: string;
  displayOrder: number;
  isMenuVisible: boolean;
  isActive: boolean;
}

export function PageDialog(props: {
  open: boolean;
  title: string;
  description: string;
  form: PageForm;
  features: Feature[];
  loading?: boolean;
  orderUnlocked: boolean;
  orderError?: string;
  onUnlockOrder: () => void;
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
            <div className="grid gap-1">
              <div className="grid grid-cols-[1fr_auto] gap-2">
                <Input
                  id="page_order"
                  type="number"
                  min={1}
                  step={1}
                  value={props.form.displayOrder}
                  readOnly={!props.orderUnlocked}
                  disabled={loading}
                  invalid={!!props.orderError}
                  onChange={(event) => props.onFormChange({ ...props.form, displayOrder: Number(event.target.value) })}
                  required
                />
                <Button type="button" variant="secondary" size="sm" disabled={loading || props.orderUnlocked} onClick={props.onUnlockOrder}>
                  <PencilSimple className="size-4" aria-hidden />
                  Chỉnh
                </Button>
              </div>
              <p className="text-xs text-text-secondary">
                Hệ thống tự đề xuất thứ tự tiếp theo. Bấm Chỉnh nếu muốn thay đổi.
              </p>
              {props.orderError && <p className="text-xs font-medium text-danger-fg">{props.orderError}</p>}
            </div>
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
            <Button type="submit" loading={loading} disabled={!!props.orderError}>{props.submitLabel}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function FeatureSelect({ value, features, onChange }: { value: string; features: Feature[]; onChange: (value: string) => void }) {
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

