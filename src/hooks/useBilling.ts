import { useState, useEffect, useCallback } from "react";
import { Bill, BillItem, Customer, Product, MetalRate } from "@/types/billing";
import { BillingCalculator } from "@/utils/billing";
import { v4 as uuidv4 } from "uuid";

export const useBilling = () => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [currentBill, setCurrentBill] = useState<Partial<Bill>>({
    id: uuidv4(),
    billNumber: BillingCalculator.generateBillNumber(),
    date: new Date(),
    items: [],
    paymentStatus: "PENDING" as any,
  });

  // Load bills from localStorage on mount
  useEffect(() => {
    const savedBills = localStorage.getItem("jewelry_bills");
    if (savedBills) {
      setBills(JSON.parse(savedBills));
    }
  }, []);

  // Save bills to localStorage whenever bills change
  useEffect(() => {
    localStorage.setItem("jewelry_bills", JSON.stringify(bills));
  }, [bills]);

  const addItemToBill = useCallback(
    (product: Product, quantity: number = 1, discount: number = 0) => {
      const finalPrice = BillingCalculator.calculateItemPrice(
        product,
        quantity,
        discount
      );

      const newItem: BillItem = {
        id: uuidv4(),
        product,
        quantity,
        discount,
        finalPrice,
      };

      setCurrentBill((prev) => ({
        ...prev,
        items: [...(prev.items || []), newItem],
      }));
    },
    []
  );

  const removeItemFromBill = useCallback((itemId: string) => {
    setCurrentBill((prev) => ({
      ...prev,
      items: (prev.items || []).filter((item) => item.id !== itemId),
    }));
  }, []);

  const updateBillItem = useCallback(
    (itemId: string, updates: Partial<BillItem>) => {
      setCurrentBill((prev) => ({
        ...prev,
        items: (prev.items || []).map((item) =>
          item.id === itemId
            ? {
                ...item,
                ...updates,
                finalPrice: BillingCalculator.calculateItemPrice(
                  updates.product || item.product,
                  updates.quantity ?? item.quantity,
                  updates.discount ?? item.discount
                ),
              }
            : item
        ),
      }));
    },
    []
  );

  const calculateBillTotals = useCallback(() => {
    if (!currentBill.items) return null;
    return BillingCalculator.calculateBillTotals(currentBill.items);
  }, [currentBill.items]);

  const saveBill = useCallback(
    (customer: Customer) => {
      if (!currentBill.items || currentBill.items.length === 0) {
        throw new Error("Cannot save bill without items");
      }

      const totals = BillingCalculator.calculateBillTotals(currentBill.items);

      const completeBill: Bill = {
        id: currentBill.id || uuidv4(),
        billNumber:
          currentBill.billNumber || BillingCalculator.generateBillNumber(),
        date: currentBill.date || new Date(),
        customer,
        items: currentBill.items,
        paymentMethod: currentBill.paymentMethod || ("CASH" as any),
        paymentStatus: currentBill.paymentStatus || ("PENDING" as any),
        notes: currentBill.notes,
        ...totals,
      };

      setBills((prev) => [...prev, completeBill]);

      // Reset current bill
      setCurrentBill({
        id: uuidv4(),
        billNumber: BillingCalculator.generateBillNumber(),
        date: new Date(),
        items: [],
        paymentStatus: "PENDING" as any,
      });

      return completeBill;
    },
    [currentBill]
  );

  const updateBillPaymentStatus = useCallback((billId: string, status: any) => {
    setBills((prev) =>
      prev.map((bill) =>
        bill.id === billId ? { ...bill, paymentStatus: status } : bill
      )
    );
  }, []);

  const searchBills = useCallback(
    (query: string) => {
      return bills.filter(
        (bill) =>
          bill.billNumber.toLowerCase().includes(query.toLowerCase()) ||
          bill.customer.name.toLowerCase().includes(query.toLowerCase()) ||
          bill.customer.phone.includes(query)
      );
    },
    [bills]
  );

  const getBillsByDateRange = useCallback(
    (startDate: Date, endDate: Date) => {
      return bills.filter((bill) => {
        const billDate = new Date(bill.date);
        return billDate >= startDate && billDate <= endDate;
      });
    },
    [bills]
  );

  const getTotalSales = useCallback(
    (startDate?: Date, endDate?: Date) => {
      let filteredBills = bills;

      if (startDate && endDate) {
        filteredBills = getBillsByDateRange(startDate, endDate);
      }

      return filteredBills.reduce((total, bill) => total + bill.grandTotal, 0);
    },
    [bills, getBillsByDateRange]
  );

  return {
    bills,
    currentBill,
    setCurrentBill,
    addItemToBill,
    removeItemFromBill,
    updateBillItem,
    calculateBillTotals,
    saveBill,
    updateBillPaymentStatus,
    searchBills,
    getBillsByDateRange,
    getTotalSales,
  };
};

export const useCustomers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    const savedCustomers = localStorage.getItem("jewelry_customers");
    if (savedCustomers) {
      setCustomers(JSON.parse(savedCustomers));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("jewelry_customers", JSON.stringify(customers));
  }, [customers]);

  const addCustomer = useCallback((customer: Omit<Customer, "id">) => {
    const newCustomer: Customer = {
      ...customer,
      id: uuidv4(),
    };
    setCustomers((prev) => [...prev, newCustomer]);
    return newCustomer;
  }, []);

  const updateCustomer = useCallback(
    (id: string, updates: Partial<Customer>) => {
      setCustomers((prev) =>
        prev.map((customer) =>
          customer.id === id ? { ...customer, ...updates } : customer
        )
      );
    },
    []
  );

  const searchCustomers = useCallback(
    (query: string) => {
      return customers.filter(
        (customer) =>
          customer.name.toLowerCase().includes(query.toLowerCase()) ||
          customer.phone.includes(query) ||
          (customer.email &&
            customer.email.toLowerCase().includes(query.toLowerCase()))
      );
    },
    [customers]
  );

  return {
    customers,
    addCustomer,
    updateCustomer,
    searchCustomers,
  };
};

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const savedProducts = localStorage.getItem("jewelry_products");
    if (savedProducts) {
      setProducts(JSON.parse(savedProducts));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("jewelry_products", JSON.stringify(products));
  }, [products]);

  const addProduct = useCallback((product: Omit<Product, "id">) => {
    const newProduct: Product = {
      ...product,
      id: uuidv4(),
    };
    setProducts((prev) => [...prev, newProduct]);
    return newProduct;
  }, []);

  const updateProduct = useCallback((id: string, updates: Partial<Product>) => {
    setProducts((prev) =>
      prev.map((product) =>
        product.id === id ? { ...product, ...updates } : product
      )
    );
  }, []);

  const deleteProduct = useCallback((id: string) => {
    setProducts((prev) => prev.filter((product) => product.id !== id));
  }, []);

  const searchProducts = useCallback(
    (query: string) => {
      return products.filter(
        (product) =>
          product.name.toLowerCase().includes(query.toLowerCase()) ||
          product.category.toLowerCase().includes(query.toLowerCase()) ||
          product.material.toLowerCase().includes(query.toLowerCase())
      );
    },
    [products]
  );

  return {
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    searchProducts,
  };
};

export const useMetalRates = () => {
  const [metalRates, setMetalRates] = useState<MetalRate[]>([]);

  useEffect(() => {
    const savedRates = localStorage.getItem("jewelry_metal_rates");
    if (savedRates) {
      setMetalRates(JSON.parse(savedRates));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("jewelry_metal_rates", JSON.stringify(metalRates));
  }, [metalRates]);

  const updateMetalRate = useCallback(
    (material: any, rate: number, purity?: string) => {
      const newRate: MetalRate = {
        material,
        rate,
        date: new Date(),
        purity,
      };

      setMetalRates((prev) => {
        const filtered = prev.filter(
          (r) => !(r.material === material && r.purity === purity)
        );
        return [...filtered, newRate];
      });
    },
    []
  );

  const getLatestRate = useCallback(
    (material: any, purity?: string) => {
      const rates = metalRates.filter(
        (r) => r.material === material && r.purity === purity
      );

      if (rates.length === 0) return null;

      return rates.reduce((latest, current) =>
        new Date(current.date) > new Date(latest.date) ? current : latest
      );
    },
    [metalRates]
  );

  return {
    metalRates,
    updateMetalRate,
    getLatestRate,
  };
};
