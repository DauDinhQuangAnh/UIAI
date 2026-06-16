import { type FormEvent } from "react";
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
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { BusinessPartner, BusinessPartnerForm } from "./business-information-data";

export function AddBusinessDialog({
  open,
  form,
  loading,
  onOpenChange,
  onFormChange,
  onSubmit,
}: {
  open: boolean;
  form: BusinessPartnerForm;
  loading?: boolean;
  onOpenChange: (open: boolean) => void;
  onFormChange: (form: BusinessPartnerForm) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader className="items-center text-center">
          <DialogTitle className="text-brand-800">Thêm doanh nghiệp</DialogTitle>
          <DialogDescription>
            Backend sẽ tự tạo account người đại diện và gửi email nếu cấu hình gửi mail hoạt động.
          </DialogDescription>
        </DialogHeader>
        <BusinessPartnerFormFields
          form={form}
          loading={loading}
          submitLabel="Tạo doanh nghiệp"
          onFormChange={onFormChange}
          onSubmit={onSubmit}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

export function EditBusinessDialog({
  target,
  form,
  loading,
  onOpenChange,
  onFormChange,
  onSubmit,
}: {
  target: BusinessPartner | null;
  form: BusinessPartnerForm;
  loading?: boolean;
  onOpenChange: (open: boolean) => void;
  onFormChange: (form: BusinessPartnerForm) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <Dialog open={!!target} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader className="items-center text-center">
          <DialogTitle className="text-brand-800">Sửa doanh nghiệp</DialogTitle>
          <DialogDescription>Cập nhật thông tin cho {target?.brandName}.</DialogDescription>
        </DialogHeader>
        <BusinessPartnerFormFields
          form={form}
          loading={loading}
          submitLabel="Lưu thay đổi"
          showStatus
          onFormChange={onFormChange}
          onSubmit={onSubmit}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

export function DeleteBusinessDialog({
  target,
  loading,
  onOpenChange,
  onConfirm,
}: {
  target: BusinessPartner | null;
  loading?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={!!target} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Xóa doanh nghiệp</DialogTitle>
          <DialogDescription>Bạn có chắc muốn xóa {target?.brandName} không?</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button type="button" variant="danger" loading={loading} onClick={onConfirm}>
            Xóa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function BusinessPartnerFormFields({
  form,
  loading,
  submitLabel,
  showStatus,
  onFormChange,
  onSubmit,
  onCancel,
}: {
  form: BusinessPartnerForm;
  loading?: boolean;
  submitLabel: string;
  showStatus?: boolean;
  onFormChange: (form: BusinessPartnerForm) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}) {
  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <BusinessField label="Tên thương hiệu" htmlFor="business_brand_name" required>
        <Input
          id="business_brand_name"
          value={form.brandName}
          placeholder="SAR Coffee"
          disabled={loading}
          onChange={(event) => onFormChange({ ...form, brandName: event.target.value })}
          required
        />
      </BusinessField>
      <BusinessField label="Logo URL" htmlFor="business_logo_url">
        <Input
          id="business_logo_url"
          value={form.logoUrl}
          placeholder="https://cdn.example.com/logo.png"
          disabled={loading}
          onChange={(event) => onFormChange({ ...form, logoUrl: event.target.value })}
        />
      </BusinessField>
      <BusinessField label="Email chủ DN" htmlFor="business_email" required>
        <Input
          id="business_email"
          type="email"
          value={form.email}
          placeholder="owner@sarcoffee.vn"
          disabled={loading}
          onChange={(event) => onFormChange({ ...form, email: event.target.value })}
          required
        />
      </BusinessField>
      <BusinessField label="Số điện thoại" htmlFor="business_phone" required>
        <Input
          id="business_phone"
          value={form.phone}
          placeholder="0900000000"
          disabled={loading}
          onChange={(event) => onFormChange({ ...form, phone: event.target.value })}
          required
        />
      </BusinessField>
      <BusinessField label="Người đại diện" htmlFor="representative_name" required>
        <Input
          id="representative_name"
          value={form.representativeName}
          placeholder="Nguyễn Văn A"
          disabled={loading}
          onChange={(event) => onFormChange({ ...form, representativeName: event.target.value })}
          required
        />
      </BusinessField>
      <BusinessField label="Email đại diện" htmlFor="representative_email" required>
        <Input
          id="representative_email"
          type="email"
          value={form.representativeEmail}
          placeholder="rep@sarcoffee.vn"
          disabled={loading}
          onChange={(event) => onFormChange({ ...form, representativeEmail: event.target.value })}
          required
        />
      </BusinessField>
      {showStatus && (
        <BusinessField label="Trạng thái" htmlFor="business_status">
          <Select
            value={String(form.isActive)}
            disabled={loading}
            onValueChange={(value) => onFormChange({ ...form, isActive: value === "true" })}
          >
            <SelectTrigger id="business_status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Hoạt động</SelectItem>
              <SelectItem value="false">Không hoạt động</SelectItem>
            </SelectContent>
          </Select>
        </BusinessField>
      )}
      <DialogFooter className="mt-3">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Hủy
        </Button>
        <Button type="submit" loading={loading}>
          {submitLabel}
        </Button>
      </DialogFooter>
    </form>
  );
}

function BusinessField({
  label,
  htmlFor,
  required,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-[9.5rem_1fr] sm:items-center">
      <Label htmlFor={htmlFor} className="text-brand-800">
        {label}
        {required && <span className="ml-1 text-danger-fg">*</span>}
      </Label>
      {children}
    </div>
  );
}
