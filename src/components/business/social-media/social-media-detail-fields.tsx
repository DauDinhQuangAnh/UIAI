import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { BusinessPartner } from "@/components/business/information/business-information-data";
import { APP_SECRET_MASK } from "./social-media-utils";

export function DetailReadOnlyField({
  label,
  value,
  required,
  mono,
}: {
  label: string;
  value: string;
  required?: boolean;
  mono?: boolean;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-[9.5rem_1fr] sm:items-center">
      <Label className="text-brand-800">
        {label}
        {required && <span className="ml-0.5 text-[#bb18b8]">*</span>}
      </Label>
      <Input
        value={value}
        readOnly
        className={[
          "border-[#d6dce5] bg-[#f7f7f7] shadow-xs focus-visible:!border-[#2f63a8] focus-visible:!shadow-[0_0_0_3px_rgba(47,99,168,0.16)]",
          mono ? "font-mono" : "",
        ].join(" ")}
        aria-label={label}
      />
    </div>
  );
}

export function DetailSelectField({
  label,
  value,
  disabled,
  businesses,
  onChange,
}: {
  label: string;
  value: string;
  disabled?: boolean;
  businesses: BusinessPartner[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-[9.5rem_1fr] sm:items-center">
      <Label className="text-brand-800">{label}</Label>
      <Select value={value} disabled={disabled} onValueChange={onChange}>
        <SelectTrigger className="border-[#d6dce5] bg-white shadow-xs focus:!ring-[#2f63a8]">
          <SelectValue placeholder="Chọn doanh nghiệp" />
        </SelectTrigger>
        <SelectContent>
          {businesses.map((business) => (
            <SelectItem key={business.id} value={business.id}>
              {business.brandName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function DetailSecretField({
  value,
  disabled,
  onChange,
}: {
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-[9.5rem_1fr] sm:items-center">
      <Label htmlFor="manage_app_secret" className="text-brand-800">
        App Secret <span className="ml-0.5 text-[#bb18b8]">*</span>
      </Label>
      <Input
        id="manage_app_secret"
        type="password"
        value={value}
        disabled={disabled}
        placeholder="App Secret"
        className="border-[#d6dce5] bg-white shadow-xs focus-visible:!border-[#2f63a8] focus-visible:!shadow-[0_0_0_3px_rgba(47,99,168,0.16)]"
        autoComplete="new-password"
        onFocus={(event) => {
          if (event.currentTarget.value === APP_SECRET_MASK) event.currentTarget.select();
        }}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

