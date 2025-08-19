export interface Category {
  _id?: string;
  id?: string;
  name: string;
  slug?: string;
  icon?: string; // icon key like 'ring' | 'gem' | ...
  color?: string; // hex color
  description?: string;
  productCount?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}
