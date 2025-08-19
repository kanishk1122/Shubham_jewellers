export type ExpenseCategory =
  | "operational"
  | "loan"
  | "rent"
  | "salary"
  | "utility"
  | "misc"
  | "purchase" // purchase = buying metal (customer exchange) / inventory acquisition
  | "other";

export interface Expense {
  _id?: string;
  id?: string;
  date: string; // ISO date
  amount: number; // money out (₹)
  category: ExpenseCategory;
  description?: string;
  vendor?: string; // vendor / payee
  relatedCustomerId?: string; // for purchase entries (exchanged with customer)
  // for purchase entries (metal exchanged from customer)
  metalWeight?: number; // grams
  metalType?: "gold" | "silver" | "platinum" | string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}
