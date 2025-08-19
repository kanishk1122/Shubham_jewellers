export interface Product {
  _id?: string;
  id?: string;
  name: string;
  serialNumber?: string;
  slug?: string;
  category?: string;
  metal?: "gold" | "silver" | "platinum" | string;
  purity?: string;
  weight?: number;
  stoneWeight?: number;
  netWeight?: number;
  makingCharges?: number;
  makingChargesType?: "fixed" | "percentage";
  wastage?: number;
  wastageType?: "fixed" | "percentage";
  rate?: number;
  imageUrl?: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}
