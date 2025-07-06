// Excel Import/Export Utility for Shubham Jewellers
// Uses SheetJS (xlsx) library for Excel operations

interface Product {
  id: string;
  serialNumber: string;
  slug: string;
  name: string;
  category: string;
  metal: string;
  purity: string;
  weight: number;
  stoneWeight?: number;
  makingCharges: number;
  description: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  gstNumber?: string;
  totalPurchases?: number;
  lastPurchaseDate?: string;
  createdAt: string;
  updatedAt: string;
}

interface Bill {
  id: string;
  billNumber: string;
  date: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerGST?: string;
  items: BillItem[];
  subtotal: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalAmount: number;
  discount: number;
  finalAmount: number;
  paymentMode: string;
  paymentStatus: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface BillItem {
  id: string;
  productId: string;
  productSerialNumber: string;
  productName: string;
  category: string;
  metal: string;
  purity: string;
  weight: number;
  netWeight: number;
  rate: number;
  makingCharges: number;
  makingChargesType: string;
  wastage: number;
  wastageType: string;
  amount: number;
}

interface MetalRate {
  id: string;
  metal: string;
  purity: string;
  rate: number;
  unit: string;
  lastUpdated: string;
  source: string;
}

// Utility to load SheetJS dynamically
const loadXLSX = async () => {
  // Try to load from CDN
  if (typeof window !== "undefined" && !window.XLSX) {
    const script = document.createElement("script");
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
    script.onload = () => console.log("XLSX library loaded");
    document.head.appendChild(script);

    // Wait for script to load
    await new Promise((resolve) => {
      const checkXLSX = () => {
        if (window.XLSX) {
          resolve(true);
        } else {
          setTimeout(checkXLSX, 100);
        }
      };
      checkXLSX();
    });
  }
  return window.XLSX;
};

export class ExcelService {
  private static async getXLSX() {
    return await loadXLSX();
  }

  // Export Products to Excel
  static async exportProducts(products: Product[]): Promise<void> {
    const XLSX = await this.getXLSX();

    const exportData = products.map((product) => ({
      "Serial Number": product.serialNumber,
      "Product ID": product.id,
      Slug: product.slug,
      Name: product.name,
      Category: product.category,
      Metal: product.metal,
      Purity: product.purity,
      "Weight (g)": product.weight,
      "Stone Weight (g)": product.stoneWeight || "",
      "Making Charges (₹)": product.makingCharges,
      Description: product.description,
      "Image URL": product.imageUrl || "",
      "Created Date": new Date(product.createdAt).toLocaleDateString(),
      "Updated Date": new Date(product.updatedAt).toLocaleDateString(),
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();

    // Add column widths
    worksheet["!cols"] = [
      { width: 15 }, // Serial Number
      { width: 20 }, // Product ID
      { width: 25 }, // Slug
      { width: 30 }, // Name
      { width: 12 }, // Category
      { width: 10 }, // Metal
      { width: 10 }, // Purity
      { width: 12 }, // Weight
      { width: 15 }, // Stone Weight
      { width: 15 }, // Making Charges
      { width: 40 }, // Description
      { width: 30 }, // Image URL
      { width: 12 }, // Created Date
      { width: 12 }, // Updated Date
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, "Products");
    XLSX.writeFile(
      workbook,
      `Shubham_Jewellers_Products_${
        new Date().toISOString().split("T")[0]
      }.xlsx`
    );
  }

  // Export Customers to Excel
  static async exportCustomers(customers: Customer[]): Promise<void> {
    const XLSX = await this.getXLSX();

    const exportData = customers.map((customer) => ({
      "Customer ID": customer.id,
      Name: customer.name,
      Phone: customer.phone,
      Email: customer.email || "",
      Address: customer.address || "",
      "GST Number": customer.gstNumber || "",
      "Total Purchases (₹)": customer.totalPurchases || 0,
      "Last Purchase Date": customer.lastPurchaseDate
        ? new Date(customer.lastPurchaseDate).toLocaleDateString()
        : "",
      "Created Date": new Date(customer.createdAt).toLocaleDateString(),
      "Updated Date": new Date(customer.updatedAt).toLocaleDateString(),
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();

    worksheet["!cols"] = [
      { width: 20 }, // Customer ID
      { width: 25 }, // Name
      { width: 15 }, // Phone
      { width: 25 }, // Email
      { width: 40 }, // Address
      { width: 15 }, // GST Number
      { width: 18 }, // Total Purchases
      { width: 18 }, // Last Purchase Date
      { width: 15 }, // Created Date
      { width: 15 }, // Updated Date
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, "Customers");
    XLSX.writeFile(
      workbook,
      `Shubham_Jewellers_Customers_${
        new Date().toISOString().split("T")[0]
      }.xlsx`
    );
  }

  // Export Bills to Excel
  static async exportBills(bills: Bill[]): Promise<void> {
    const XLSX = await this.getXLSX();

    // Bills Summary Sheet
    const billsData = bills.map((bill) => ({
      "Bill Number": bill.billNumber,
      "Bill ID": bill.id,
      Date: new Date(bill.date).toLocaleDateString(),
      "Customer Name": bill.customerName,
      "Customer Phone": bill.customerPhone,
      "Customer GST": bill.customerGST || "",
      "Items Count": bill.items.length,
      "Subtotal (₹)": bill.subtotal,
      "CGST (₹)": bill.cgst,
      "SGST (₹)": bill.sgst,
      "IGST (₹)": bill.igst,
      "Discount (₹)": bill.discount,
      "Final Amount (₹)": bill.finalAmount,
      "Payment Mode": bill.paymentMode,
      "Payment Status": bill.paymentStatus,
      Notes: bill.notes || "",
      "Created Date": new Date(bill.createdAt).toLocaleDateString(),
    }));

    // Bill Items Detail Sheet
    const itemsData: any[] = [];
    bills.forEach((bill) => {
      bill.items.forEach((item) => {
        itemsData.push({
          "Bill Number": bill.billNumber,
          Customer: bill.customerName,
          "Product Serial": item.productSerialNumber,
          "Product Name": item.productName,
          Category: item.category,
          Metal: item.metal,
          Purity: item.purity,
          "Weight (g)": item.weight,
          "Net Weight (g)": item.netWeight,
          "Rate (₹/g)": item.rate,
          "Making Charges (₹)": item.makingCharges,
          "Making Type": item.makingChargesType,
          "Wastage (₹)": item.wastage,
          "Wastage Type": item.wastageType,
          "Amount (₹)": item.amount,
        });
      });
    });

    const workbook = XLSX.utils.book_new();

    // Bills Summary Sheet
    const billsSheet = XLSX.utils.json_to_sheet(billsData);
    billsSheet["!cols"] = [
      { width: 15 },
      { width: 20 },
      { width: 12 },
      { width: 25 },
      { width: 15 },
      { width: 15 },
      { width: 12 },
      { width: 15 },
      { width: 12 },
      { width: 12 },
      { width: 12 },
      { width: 15 },
      { width: 18 },
      { width: 15 },
      { width: 15 },
      { width: 30 },
      { width: 15 },
    ];
    XLSX.utils.book_append_sheet(workbook, billsSheet, "Bills Summary");

    // Bill Items Sheet
    const itemsSheet = XLSX.utils.json_to_sheet(itemsData);
    itemsSheet["!cols"] = [
      { width: 15 },
      { width: 25 },
      { width: 15 },
      { width: 30 },
      { width: 12 },
      { width: 10 },
      { width: 10 },
      { width: 12 },
      { width: 15 },
      { width: 12 },
      { width: 15 },
      { width: 12 },
      { width: 12 },
      { width: 12 },
      { width: 15 },
    ];
    XLSX.utils.book_append_sheet(workbook, itemsSheet, "Bill Items Detail");

    XLSX.writeFile(
      workbook,
      `Shubham_Jewellers_Bills_${new Date().toISOString().split("T")[0]}.xlsx`
    );
  }

  // Export Metal Rates to Excel
  static async exportMetalRates(rates: MetalRate[]): Promise<void> {
    const XLSX = await this.getXLSX();

    const exportData = rates.map((rate) => ({
      "Rate ID": rate.id,
      Metal: rate.metal,
      Purity: rate.purity,
      "Rate (₹)": rate.rate,
      Unit: rate.unit,
      Source: rate.source,
      "Last Updated": new Date(rate.lastUpdated).toLocaleString(),
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();

    worksheet["!cols"] = [
      { width: 20 }, // Rate ID
      { width: 12 }, // Metal
      { width: 12 }, // Purity
      { width: 15 }, // Rate
      { width: 10 }, // Unit
      { width: 20 }, // Source
      { width: 20 }, // Last Updated
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, "Metal Rates");
    XLSX.writeFile(
      workbook,
      `Shubham_Jewellers_MetalRates_${
        new Date().toISOString().split("T")[0]
      }.xlsx`
    );
  }

  // Import Products from Excel
  static async importProducts(file: File): Promise<Product[]> {
    const XLSX = await this.getXLSX();

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          const products: Product[] = jsonData.map(
            (row: any, index: number) => ({
              id: row["Product ID"] || `prod_${Date.now()}_${index}`,
              serialNumber: row["Serial Number"] || "",
              slug: row["Slug"] || "",
              name: row["Name"] || "",
              category: row["Category"]?.toLowerCase() || "other",
              metal: row["Metal"]?.toLowerCase() || "gold",
              purity: row["Purity"] || "",
              weight: parseFloat(row["Weight (g)"]) || 0,
              stoneWeight: row["Stone Weight (g)"]
                ? parseFloat(row["Stone Weight (g)"])
                : undefined,
              makingCharges: parseFloat(row["Making Charges (₹)"]) || 0,
              description: row["Description"] || "",
              imageUrl: row["Image URL"] || "",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            })
          );

          resolve(products);
        } catch (error) {
          reject(error);
        }
      };
      reader.readAsArrayBuffer(file);
    });
  }

  // Import Customers from Excel
  static async importCustomers(file: File): Promise<Customer[]> {
    const XLSX = await this.getXLSX();

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          const customers: Customer[] = jsonData.map(
            (row: any, index: number) => ({
              id: row["Customer ID"] || `cust_${Date.now()}_${index}`,
              name: row["Name"] || "",
              phone: row["Phone"] || "",
              email: row["Email"] || "",
              address: row["Address"] || "",
              gstNumber: row["GST Number"] || "",
              totalPurchases: parseFloat(row["Total Purchases (₹)"]) || 0,
              lastPurchaseDate: row["Last Purchase Date"] || "",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            })
          );

          resolve(customers);
        } catch (error) {
          reject(error);
        }
      };
      reader.readAsArrayBuffer(file);
    });
  }

  // Import Metal Rates from Excel
  static async importMetalRates(file: File): Promise<MetalRate[]> {
    const XLSX = await this.getXLSX();

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          const rates: MetalRate[] = jsonData.map(
            (row: any, index: number) => ({
              id: row["Rate ID"] || `rate_${Date.now()}_${index}`,
              metal: row["Metal"]?.toLowerCase() || "gold",
              purity: row["Purity"] || "",
              rate: parseFloat(row["Rate (₹)"]) || 0,
              unit: row["Unit"] || "gram",
              source: row["Source"] || "manual",
              lastUpdated: new Date().toISOString(),
            })
          );

          resolve(rates);
        } catch (error) {
          reject(error);
        }
      };
      reader.readAsArrayBuffer(file);
    });
  }

  // Export All Data (Combined)
  static async exportAllData(): Promise<void> {
    const XLSX = await this.getXLSX();

    // Get data from localStorage
    const products = JSON.parse(localStorage.getItem("products") || "[]");
    const customers = JSON.parse(localStorage.getItem("customers") || "[]");
    const bills = JSON.parse(localStorage.getItem("bills") || "[]");
    const rates = JSON.parse(localStorage.getItem("metalRates") || "[]");

    const workbook = XLSX.utils.book_new();

    // Products Sheet
    if (products.length > 0) {
      const productsData = products.map((product: Product) => ({
        "Serial Number": product.serialNumber,
        Name: product.name,
        Category: product.category,
        Metal: product.metal,
        Purity: product.purity,
        Weight: product.weight,
        "Making Charges": product.makingCharges,
        Created: new Date(product.createdAt).toLocaleDateString(),
      }));
      const productsSheet = XLSX.utils.json_to_sheet(productsData);
      XLSX.utils.book_append_sheet(workbook, productsSheet, "Products");
    }

    // Customers Sheet
    if (customers.length > 0) {
      const customersData = customers.map((customer: Customer) => ({
        Name: customer.name,
        Phone: customer.phone,
        Email: customer.email || "",
        "Total Purchases": customer.totalPurchases || 0,
        Created: new Date(customer.createdAt).toLocaleDateString(),
      }));
      const customersSheet = XLSX.utils.json_to_sheet(customersData);
      XLSX.utils.book_append_sheet(workbook, customersSheet, "Customers");
    }

    // Bills Sheet
    if (bills.length > 0) {
      const billsData = bills.map((bill: Bill) => ({
        "Bill Number": bill.billNumber,
        Date: new Date(bill.date).toLocaleDateString(),
        Customer: bill.customerName,
        Amount: bill.finalAmount,
        Status: bill.paymentStatus,
        Items: bill.items.length,
      }));
      const billsSheet = XLSX.utils.json_to_sheet(billsData);
      XLSX.utils.book_append_sheet(workbook, billsSheet, "Bills");
    }

    // Metal Rates Sheet
    if (rates.length > 0) {
      const ratesData = rates.map((rate: MetalRate) => ({
        Metal: rate.metal,
        Purity: rate.purity,
        Rate: rate.rate,
        Updated: new Date(rate.lastUpdated).toLocaleDateString(),
      }));
      const ratesSheet = XLSX.utils.json_to_sheet(ratesData);
      XLSX.utils.book_append_sheet(workbook, ratesSheet, "Metal Rates");
    }

    XLSX.writeFile(
      workbook,
      `Shubham_Jewellers_Complete_Backup_${
        new Date().toISOString().split("T")[0]
      }.xlsx`
    );
  }

  // Generate Excel template for bulk import
  static async generateProductTemplate(): Promise<void> {
    const XLSX = await this.getXLSX();

    const templateData = [
      {
        "Serial Number": "SJ202507RGG0001",
        "Product ID": "prod_example_001",
        Slug: "gold-diamond-ring",
        Name: "Gold Diamond Ring",
        Category: "ring",
        Metal: "gold",
        Purity: "22K",
        "Weight (g)": 5.5,
        "Stone Weight (g)": 0.5,
        "Making Charges (₹)": 2500,
        Description: "Beautiful gold ring with diamond",
        "Image URL": "https://example.com/image.jpg",
        "Created Date": new Date().toLocaleDateString(),
        "Updated Date": new Date().toLocaleDateString(),
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Products Template");
    XLSX.writeFile(workbook, "Products_Import_Template.xlsx");
  }

  static async generateCustomerTemplate(): Promise<void> {
    const XLSX = await this.getXLSX();

    const templateData = [
      {
        "Customer ID": "cust_example_001",
        Name: "John Doe",
        Phone: "9876543210",
        Email: "john@example.com",
        Address: "123 Street, City, State",
        "GST Number": "27ABCDE1234F1Z5",
        "Total Purchases (₹)": 0,
        "Last Purchase Date": "",
        "Created Date": new Date().toLocaleDateString(),
        "Updated Date": new Date().toLocaleDateString(),
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Customers Template");
    XLSX.writeFile(workbook, "Customers_Import_Template.xlsx");
  }
}

// Global XLSX type declaration
declare global {
  interface Window {
    XLSX: any;
  }
}

export default ExcelService;
