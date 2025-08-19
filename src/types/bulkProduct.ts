export interface BulkProduct {
  _id?: string;
  id?: string;
  name: string;
  slug?: string;
  category?: string; // category slug
  metal?: "gold" | "silver" | "platinum" | string;
  purity?: string;
  totalWeight: number; // grams
  remainingWeight: number; // grams
  packageWeight?: number; // grams
  makingCharges?: number; // ₹
  supplier?: string;
  purchaseDate?: string; // ISO date string
  batchNumber?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  // allow additional backend fields
  [key: string]: any;
}
