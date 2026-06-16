import { createFileRoute } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";
import { Buildings, Plus } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { BusinessPageShell } from "@/components/business/business-page-shell";
import {
  EMPTY_BUSINESS_FORM,
  INITIAL_BUSINESSES,
  NEW_OWNER_VALUE,
  OWNER_OPTIONS,
  type Business,
  type BusinessForm,
} from "@/components/business/information/business-information-data";
import {
  AddBusinessDialog,
  DeleteBusinessDialog,
  EditBusinessDialog,
} from "@/components/business/information/business-information-dialogs";
import { BusinessInformationTable } from "@/components/business/information/business-information-table";

export const Route = createFileRoute("/_app/business/information")({
  component: BusinessInformationScreen,
});

function BusinessInformationScreen() {
  const [businesses, setBusinesses] = useState<Business[]>(INITIAL_BUSINESSES);
  const [deleteTarget, setDeleteTarget] = useState<Business | null>(null);
  const [editTarget, setEditTarget] = useState<Business | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState<BusinessForm>(EMPTY_BUSINESS_FORM);
  const [editForm, setEditForm] = useState<BusinessForm>(EMPTY_BUSINESS_FORM);
  const ownerOptions = Array.from(new Set([...OWNER_OPTIONS, ...businesses.map((business) => business.owner)]));

  const openEdit = (business: Business) => {
    setEditTarget(business);
    setEditForm({
      name: business.name,
      address: business.address,
      phone: business.phone,
      email: business.email,
      status: business.status,
      owner: business.owner,
      representativeName: "",
      representativeEmail: "",
    });
  };

  const onConfirmDelete = () => {
    if (!deleteTarget) return;
    setBusinesses((current) => current.filter((business) => business.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  const onSubmitAdd = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const owner = form.owner === NEW_OWNER_VALUE ? form.representativeName : form.owner;
    const nextBusiness: Business = {
      name: form.name,
      address: form.address,
      phone: form.phone,
      email: form.email,
      status: form.status,
      owner,
      id: `${form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`,
    };
    setBusinesses((current) => [nextBusiness, ...current]);
    setAddOpen(false);
    setForm(EMPTY_BUSINESS_FORM);
  };

  const onSubmitEdit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editTarget) return;
    setBusinesses((current) =>
      current.map((business) =>
        business.id === editTarget.id
          ? {
              ...business,
              name: editForm.name,
              address: editForm.address,
              phone: editForm.phone,
              email: editForm.email,
              status: editForm.status,
              owner: editForm.owner,
            }
          : business,
      ),
    );
    setEditTarget(null);
    setEditForm(EMPTY_BUSINESS_FORM);
  };

  return (
    <BusinessPageShell
      title="Thông tin doanh nghiệp"
      description="Quản lý hồ sơ công khai và thông tin liên hệ dùng cho các kênh tương tác với khách hàng."
      icon={Buildings}
      className="max-w-7xl"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-semibold text-text-primary">Danh sách doanh nghiệp</h2>
          <p className="text-sm text-text-secondary">
            {businesses.length} hồ sơ doanh nghiệp đang sẵn sàng để kết nối với agent và các kênh.
          </p>
        </div>
        <Button type="button" size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="size-4" aria-hidden />
          Thêm doanh nghiệp
        </Button>
      </div>

      <BusinessInformationTable businesses={businesses} onEdit={openEdit} onDelete={setDeleteTarget} />

      <AddBusinessDialog
        open={addOpen}
        form={form}
        ownerOptions={ownerOptions}
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
        ownerOptions={ownerOptions}
        onOpenChange={(open) => {
          if (!open) {
            setEditTarget(null);
            setEditForm(EMPTY_BUSINESS_FORM);
          }
        }}
        onFormChange={setEditForm}
        onSubmit={onSubmitEdit}
      />

      <DeleteBusinessDialog
        target={deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={onConfirmDelete}
      />
    </BusinessPageShell>
  );
}
