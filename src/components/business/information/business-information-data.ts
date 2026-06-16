export interface Business {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  status: "Active" | "Inactive";
  owner: string;
}

export interface BusinessForm {
  name: string;
  address: string;
  phone: string;
  email: string;
  status: Business["status"];
  owner: string;
  representativeName: string;
  representativeEmail: string;
}

export const INITIAL_BUSINESSES: Business[] = [
  {
    id: "clinic-physio",
    name: "Phong kham y duoc co truyen Lupita",
    address: "189 Nguyen Thi Minh Khai, Quan 3, TP.HCM",
    phone: "0368456329",
    email: "lupita@gmail.com",
    status: "Active",
    owner: "Lupita",
  },
  {
    id: "my-pham",
    name: "My pham cao cap Duoc si Tien",
    address: "189 Duong Quang Ham, Go Vap, TP.HCM",
    phone: "0986912354",
    email: "dst@gmail.com",
    status: "Active",
    owner: "Duocsitien",
  },
  {
    id: "shop-hoa",
    name: "Shop hoa Lily",
    address: "88 Bach Dang, Binh Thanh, TP.HCM",
    phone: "0125478963",
    email: "lily@gmail.com",
    status: "Active",
    owner: "Lily",
  },
  {
    id: "salon-minamoto",
    name: "Shop quan ao thoi trang Minamoto",
    address: "960 Au Co, Tan Phu, TP.HCM",
    phone: "0789654185",
    email: "minamoto@gmail.com",
    status: "Active",
    owner: "Minamoto",
  },
];

export const EMPTY_BUSINESS_FORM: BusinessForm = {
  name: "",
  address: "",
  phone: "",
  email: "",
  status: "Active",
  owner: "Lily",
  representativeName: "",
  representativeEmail: "",
};

export const NEW_OWNER_VALUE = "not-existing";
export const OWNER_OPTIONS = ["Lupita", "Duocsitien", "Lily", "Minamoto"];
