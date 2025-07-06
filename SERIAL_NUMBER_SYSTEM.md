# Product Serial Number & Slug Generation System

## 🆔 Serial Number Format

**Format:** `SJ{YEAR}{MONTH}{CATEGORY}{METAL}{SEQUENCE}`

### Components:

- **SJ**: Shubham Jewellers prefix
- **YEAR**: Current year (e.g., 2025)
- **MONTH**: Current month (01-12)
- **CATEGORY**: Two-letter category code
- **METAL**: Single-letter metal code
- **SEQUENCE**: 4-digit sequential number

### Category Codes:

- **RG**: Ring
- **NK**: Necklace
- **BR**: Bracelet
- **ER**: Earring
- **PD**: Pendant
- **CH**: Chain
- **OT**: Other

### Metal Codes:

- **G**: Gold
- **S**: Silver
- **P**: Platinum

## 📋 Examples

| Product           | Serial Number     | Description                                |
| ----------------- | ----------------- | ------------------------------------------ |
| Gold Ring         | `SJ202507RGG0001` | July 2025, Ring, Gold, 1st product         |
| Silver Necklace   | `SJ202507NKS0002` | July 2025, Necklace, Silver, 2nd product   |
| Platinum Earrings | `SJ202507ERP0003` | July 2025, Earrings, Platinum, 3rd product |

## 🔗 Slug Generation

**Format:** Lowercase, hyphen-separated, URL-friendly

### Examples:

- "Gold Diamond Ring" → `gold-diamond-ring`
- "Silver Chain with Pendant" → `silver-chain-with-pendant`
- "22K Gold Necklace (Heavy)" → `22k-gold-necklace-heavy`

## ✨ Features Implemented

### ✅ Automatic Generation:

- **Unique Product ID**: `prod_{timestamp}_{random}`
- **Serial Number**: Business-friendly format
- **Slug**: SEO and URL-friendly identifier

### ✅ Display Integration:

- Serial number shown on product cards
- Slug displayed for identification
- Serial numbers in billing system
- Print-friendly bill formats include serial numbers

### ✅ Search & Filter:

- Search by name, description, serial number, slug, or ID
- Enhanced product selection in billing
- Quick identification in bills history

### ✅ Migration Support:

- Automatically migrates existing products
- Generates serial numbers for legacy data
- Preserves existing product information

## 🔄 Data Migration

The system automatically handles existing products:

1. **Detects** products without serial numbers/slugs
2. **Generates** missing identifiers using current date
3. **Preserves** all existing product data
4. **Updates** localStorage with migrated data

## 💾 Data Structure

```typescript
interface Product {
  id: string; // Unique internal ID
  serialNumber: string; // Business serial number
  slug: string; // URL-friendly identifier
  name: string;
  category: string;
  metal: string;
  purity: string;
  weight: number;
  // ... other fields
}
```

## 🧾 Billing Integration

- Bill items include product serial numbers
- Print bills show serial numbers
- Enhanced product selection dropdown
- Bills history displays serial numbers
- Product traceability throughout system

## 🎯 Benefits

1. **Professional Identification**: Business-friendly serial numbers
2. **Easy Search**: Multiple search criteria including serial numbers
3. **Traceability**: Track products from creation to sale
4. **SEO-Friendly**: URL-safe slugs for future web features
5. **Migration Safe**: Backwards compatible with existing data
6. **Print Ready**: Professional bills with serial numbers

## 🔧 Usage

### Creating Products:

1. Go to `/products`
2. Click "Add New Product"
3. Fill product details
4. Serial number and slug generated automatically

### Billing:

1. Go to `/billing`
2. Select customer
3. Add products (shows serial numbers)
4. Complete billing process

### Search:

- Use search box in products page
- Search by name, serial number, slug, or ID
- Filter by category and metal type
