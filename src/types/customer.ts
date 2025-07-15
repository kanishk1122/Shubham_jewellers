export interface Customer {
  _id?: string;
  id?: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  gstNumber?: string;
  panNumber?: string;
  notes?: string;
  totalPurchases?: number;
  lastPurchaseDate?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
