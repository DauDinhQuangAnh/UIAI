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
import { NEW_OWNER_VALUE, type Business, type BusinessForm } from "./business-information-data";

export function AddBusinessDialog({
  open,
  form,
  ownerOptions,
  onOpenChange,
  onFormChange,
  onSubmit,
}: {
  open: boolean;
  form: BusinessForm;
  ownerOptions: string[];
  onOpenChange: (open: boolean) => void;
  onFormChange: (form: BusinessForm) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader className="items-center text-center">
          <DialogTitle className="text-brand-800">Add Business Information</DialogTitle>
          <DialogDescription>Enter the business details that will appear in the management list.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-4">
          <BusinessField label="Business" htmlFor="business_name" required>
            <Input
              id="business_name"
              value={form.name}
              placeholder="Shop ban hoa Lily"
              onChange={(event) => onFormChange({ ...form, name: event.target.value })}
              required
            />
          </BusinessField>
          <BusinessField label="Address" htmlFor="business_address">
            <Input
              id="business_address"
              value={form.address}
              placeholder="88 Bach Dang, Binh Thanh, TP.HCM"
              onChange={(event) => onFormChange({ ...form, address: event.target.value })}
            />
          </BusinessField>
          <BusinessField label="Phone" htmlFor="business_phone" required>
            <Input
              id="business_phone"
              value={form.phone}
              placeholder="0125478963"
              onChange={(event) => onFormChange({ ...form, phone: event.target.value })}
              required
            />
          </BusinessField>
          <BusinessField label="Email" htmlFor="business_email">
            <Input
              id="business_email"
              type="email"
              value={form.email}
              placeholder="lily@gmail.com"
              onChange={(event) => onFormChange({ ...form, email: event.target.value })}
            />
          </BusinessField>
          <BusinessField label="Status" htmlFor="business_status">
            <Select
              value={form.status}
              onValueChange={(status) => onFormChange({ ...form, status: status as Business["status"] })}
            >
              <SelectTrigger id="business_status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </BusinessField>
          <BusinessField label="Owner" htmlFor="business_owner">
            <Select value={form.owner} onValueChange={(owner) => onFormChange({ ...form, owner })}>
              <SelectTrigger id="business_owner">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  value={NEW_OWNER_VALUE}
                  className="bg-brand-50 font-semibold text-brand-800 focus:bg-brand-100"
                >
                  Not existing
                </SelectItem>
                {ownerOptions.map((owner) => (
                  <SelectItem key={owner} value={owner}>
                    {owner}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </BusinessField>
          {form.owner === NEW_OWNER_VALUE && (
            <>
              <BusinessField label="Representative" htmlFor="representative_name" required>
                <Input
                  id="representative_name"
                  value={form.representativeName}
                  placeholder="Nguyen Thi Anh Ly"
                  onChange={(event) => onFormChange({ ...form, representativeName: event.target.value })}
                  required
                />
              </BusinessField>
              <BusinessField label="Representative Email" htmlFor="representative_email" required>
                <Input
                  id="representative_email"
                  type="email"
                  value={form.representativeEmail}
                  placeholder="anhlynguyen@gmail.com"
                  onChange={(event) => onFormChange({ ...form, representativeEmail: event.target.value })}
                  required
                />
              </BusinessField>
            </>
          )}
          <DialogFooter className="mt-3">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function EditBusinessDialog({
  target,
  form,
  ownerOptions,
  onOpenChange,
  onFormChange,
  onSubmit,
}: {
  target: Business | null;
  form: BusinessForm;
  ownerOptions: string[];
  onOpenChange: (open: boolean) => void;
  onFormChange: (form: BusinessForm) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <Dialog open={!!target} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader className="items-center text-center">
          <DialogTitle className="text-brand-800">Edit Business Information</DialogTitle>
          <DialogDescription>Update the details for {target?.name}.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-4">
          <BusinessField label="Business" htmlFor="edit_business_name">
            <Input
              id="edit_business_name"
              value={form.name}
              onChange={(event) => onFormChange({ ...form, name: event.target.value })}
            />
          </BusinessField>
          <BusinessField label="Address" htmlFor="edit_business_address">
            <Input
              id="edit_business_address"
              value={form.address}
              onChange={(event) => onFormChange({ ...form, address: event.target.value })}
            />
          </BusinessField>
          <BusinessField label="Phone" htmlFor="edit_business_phone">
            <Input
              id="edit_business_phone"
              value={form.phone}
              onChange={(event) => onFormChange({ ...form, phone: event.target.value })}
            />
          </BusinessField>
          <BusinessField label="Email" htmlFor="edit_business_email">
            <Input
              id="edit_business_email"
              type="email"
              value={form.email}
              onChange={(event) => onFormChange({ ...form, email: event.target.value })}
            />
          </BusinessField>
          <BusinessField label="Status" htmlFor="edit_business_status">
            <Select
              value={form.status}
              onValueChange={(status) => onFormChange({ ...form, status: status as Business["status"] })}
            >
              <SelectTrigger id="edit_business_status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </BusinessField>
          <BusinessField label="Owner" htmlFor="edit_business_owner">
            <Select value={form.owner} onValueChange={(owner) => onFormChange({ ...form, owner })}>
              <SelectTrigger id="edit_business_owner">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ownerOptions.map((owner) => (
                  <SelectItem key={owner} value={owner}>
                    {owner}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </BusinessField>
          <DialogFooter className="mt-3">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function DeleteBusinessDialog({
  target,
  onOpenChange,
  onConfirm,
}: {
  target: Business | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={!!target} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete business</DialogTitle>
          <DialogDescription>Are you sure you want to delete {target?.name}?</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" variant="danger" onClick={onConfirm}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
