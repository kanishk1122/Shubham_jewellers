export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  material: Material;
  weight: number; // in grams
  purity?: string; // for gold: 22k, 24k, etc.
  stoneDetails?: StoneDetails[];
  makingCharges: number; // percentage or fixed amount
  wastage: number; // percentage
  basePrice: number; // per gram
  description?: string;
  hsn?: string; // HSN code for GST
}

export interface StoneDetails {
  type: StoneType;
  count: number;
  weight: number; // in carats
  quality: string;
  pricePerCarat: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: Address;
  gstNumber?: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

export interface BillItem {
  id: string;
  product: Product;
  quantity: number;
  discount: number; // percentage
  finalPrice: number;
}

export interface Bill {
  id: string;
  billNumber: string;
  date: Date;
  customer: Customer;
  items: BillItem[];
  subtotal: number;
  totalDiscount: number;
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalTax: number;
  grandTotal: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  notes?: string;
}

export enum ProductCategory {
  RING = "Ring",
  NECKLACE = "Necklace",
  EARRINGS = "Earrings",
  BRACELET = "Bracelet",
  PENDANT = "Pendant",
  CHAIN = "Chain",
  BANGLE = "Bangle",
  MANGALSUTRA = "Mangalsutra",
  NOSE_PIN = "Nose Pin",
  ANKLET = "Anklet",
  BROOCH = "Brooch",
  CUFFLINKS = "Cufflinks",
  WATCH = "Watch",
  COIN = "Coin",
  BAR = "Bar",
  OTHER = "Other",
}

export enum Material {
  GOLD = "Gold",
  SILVER = "Silver",
  PLATINUM = "Platinum",
  PALLADIUM = "Palladium",
  RHODIUM = "Rhodium",
  COPPER = "Copper",
  BRASS = "Brass",
  STAINLESS_STEEL = "Stainless Steel",
  TITANIUM = "Titanium",
  WHITE_GOLD = "White Gold",
  ROSE_GOLD = "Rose Gold",
  MIXED_METAL = "Mixed Metal",
}

export enum StoneType {
  DIAMOND = "Diamond",
  RUBY = "Ruby",
  EMERALD = "Emerald",
  SAPPHIRE = "Sapphire",
  PEARL = "Pearl",
  TOPAZ = "Topaz",
  GARNET = "Garnet",
  AMETHYST = "Amethyst",
  AQUAMARINE = "Aquamarine",
  OPAL = "Opal",
  TURQUOISE = "Turquoise",
  CORAL = "Coral",
  ONYX = "Onyx",
  CITRINE = "Citrine",
  PERIDOT = "Peridot",
  TANZANITE = "Tanzanite",
  CUBIC_ZIRCONIA = "Cubic Zirconia",
  ARTIFICIAL = "Artificial",
  SEMI_PRECIOUS = "Semi Precious",
}

export enum PaymentMethod {
  CASH = "Cash",
  CARD = "Card",
  UPI = "UPI",
  NET_BANKING = "Net Banking",
  CHEQUE = "Cheque",
  EXCHANGE = "Exchange",
  PARTIAL = "Partial Payment",
}

export enum PaymentStatus {
  PAID = "Paid",
  PENDING = "Pending",
  PARTIAL = "Partial",
  OVERDUE = "Overdue",
}

export interface MetalRate {
  material: Material;
  rate: number; // per gram
  date: Date;
  purity?: string;
}

export interface TaxSettings {
  cgst: number;
  sgst: number;
  igst: number;
  taxableAmount: number;
}

export interface Shop {
  name: string;
  address: Address;
  phone: string;
  email?: string;
  gstNumber?: string;
  license?: string;
  logo?: string;
}
