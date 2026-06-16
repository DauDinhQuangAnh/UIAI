export interface BusinessPartner {
  id: string;
  brandName: string;
  logoUrl: string | null;
  email: string;
  phone: string;
  representativeName: string;
  representativeEmail: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string | null;
  accountCreated?: boolean | null;
  representativeEmailSent?: boolean | null;
  businessOwnerEmailSent?: boolean | null;
  usersCount?: number;
  integrationsCount?: number;
}

export interface BusinessPartnerList {
  items?: BusinessPartner[];
  pageNumber?: number;
  pageSize?: number;
  totalCount?: number;
}

export interface BusinessPartnerCreate {
  brandName: string;
  logoUrl: string | null;
  email: string;
  phone: string;
  representativeName: string;
  representativeEmail: string;
}

export interface BusinessPartnerUpdate extends BusinessPartnerCreate {
  isActive: boolean;
}

export interface BusinessPartnerForm {
  brandName: string;
  logoUrl: string;
  email: string;
  phone: string;
  representativeName: string;
  representativeEmail: string;
  isActive: boolean;
}

export const EMPTY_BUSINESS_FORM: BusinessPartnerForm = {
  brandName: "",
  logoUrl: "",
  email: "",
  phone: "",
  representativeName: "",
  representativeEmail: "",
  isActive: true,
};

export function formFromBusinessPartner(partner: BusinessPartner): BusinessPartnerForm {
  return {
    brandName: partner.brandName,
    logoUrl: partner.logoUrl ?? "",
    email: partner.email,
    phone: partner.phone,
    representativeName: partner.representativeName,
    representativeEmail: partner.representativeEmail,
    isActive: partner.isActive,
  };
}

export function createPayloadFromForm(form: BusinessPartnerForm): BusinessPartnerCreate {
  return {
    brandName: form.brandName.trim(),
    logoUrl: cleanOptional(form.logoUrl),
    email: form.email.trim(),
    phone: form.phone.trim(),
    representativeName: form.representativeName.trim(),
    representativeEmail: form.representativeEmail.trim(),
  };
}

export function updatePayloadFromForm(form: BusinessPartnerForm): BusinessPartnerUpdate {
  return {
    ...createPayloadFromForm(form),
    isActive: form.isActive,
  };
}

function cleanOptional(value: string): string | null {
  const next = value.trim();
  return next.length > 0 ? next : null;
}
