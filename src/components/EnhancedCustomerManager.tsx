"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  Input,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui";
import ExcelActions from "@/components/ExcelActions";
import {
  Users,
  UserPlus,
  Building,
  Star,
  User,
  UserPlus as NewUserIcon,
  Phone,
  Mail,
  Home,
  CreditCard,
  FileText,
  Pencil,
  Trash2,
  Search,
} from "lucide-react";

interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  gstNumber?: string;
  panNumber?: string;
  notes?: string;
  totalPurchases: number;
  lastPurchaseDate?: string;
  createdAt: string;
  updatedAt: string;
}

export const EnhancedCustomerManager: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    gstNumber: "",
    panNumber: "",
    notes: "",
  });

  // Load customers from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("customers");
    if (saved) {
      try {
        setCustomers(JSON.parse(saved));
      } catch (error) {
        console.error("Failed to parse saved customers:", error);
      }
    }
  }, []);

  // Save customers to localStorage
  const saveCustomers = (newCustomers: Customer[]) => {
    setCustomers(newCustomers);
    localStorage.setItem("customers", JSON.stringify(newCustomers));
  };

  const handleAddCustomer = () => {
    if (!formData.name || !formData.phone) return;

    const newCustomer: Customer = {
      id: Date.now().toString(),
      name: formData.name,
      phone: formData.phone,
      email: formData.email || undefined,
      address: formData.address || undefined,
      gstNumber: formData.gstNumber || undefined,
      panNumber: formData.panNumber || undefined,
      notes: formData.notes || undefined,
      totalPurchases: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveCustomers([...customers, newCustomer]);
    resetForm();
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      phone: customer.phone,
      email: customer.email || "",
      address: customer.address || "",
      gstNumber: customer.gstNumber || "",
      panNumber: customer.panNumber || "",
      notes: customer.notes || "",
    });
  };

  const handleUpdateCustomer = () => {
    if (!editingCustomer || !formData.name || !formData.phone) return;

    const updatedCustomers = customers.map((customer) =>
      customer.id === editingCustomer.id
        ? {
            ...customer,
            name: formData.name,
            phone: formData.phone,
            email: formData.email || undefined,
            address: formData.address || undefined,
            gstNumber: formData.gstNumber || undefined,
            panNumber: formData.panNumber || undefined,
            notes: formData.notes || undefined,
            updatedAt: new Date().toISOString(),
          }
        : customer
    );

    saveCustomers(updatedCustomers);
    resetForm();
  };

  const handleDeleteCustomer = (id: string) => {
    if (confirm("Are you sure you want to delete this customer?")) {
      saveCustomers(customers.filter((customer) => customer.id !== id));
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      phone: "",
      email: "",
      address: "",
      gstNumber: "",
      panNumber: "",
      notes: "",
    });
    setEditingCustomer(null);
    setShowAddForm(false);
  };

  // Filter customers
  const filteredCustomers = customers.filter((customer) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      customer.name.toLowerCase().includes(searchLower) ||
      customer.phone.includes(searchTerm) ||
      (customer.email && customer.email.toLowerCase().includes(searchLower)) ||
      (customer.gstNumber &&
        customer.gstNumber.toLowerCase().includes(searchLower))
    );
  });

  const getCustomerTypeIcon = (customer: Customer) => {
    if (customer.gstNumber) return <Building className="w-5 h-5" />; // Business customer
    if (customer.totalPurchases > 100000) return <Star className="w-5 h-5" />; // VIP customer
    if (customer.totalPurchases > 0) return <User className="w-5 h-5" />; // Regular customer
    return <NewUserIcon className="w-5 h-5" />; // New customer
  };

  const getCustomerTypeLabel = (customer: Customer) => {
    if (customer.gstNumber) return "Business";
    if (customer.totalPurchases > 100000) return "VIP";
    if (customer.totalPurchases > 0) return "Regular";
    return "New";
  };

  // Handle Excel import
  const handleExcelImport = (importedCustomers: Customer[]) => {
    const mergedCustomers = [...customers];
    let addedCount = 0;
    let updatedCount = 0;

    importedCustomers.forEach((importedCustomer) => {
      const existingIndex = mergedCustomers.findIndex(
        (c) =>
          c.phone === importedCustomer.phone || c.id === importedCustomer.id
      );

      if (existingIndex >= 0) {
        // Update existing customer
        mergedCustomers[existingIndex] = {
          ...mergedCustomers[existingIndex],
          ...importedCustomer,
          updatedAt: new Date().toISOString(),
        };
        updatedCount++;
      } else {
        // Add new customer
        const newCustomer = {
          ...importedCustomer,
          id: importedCustomer.id || Date.now().toString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        mergedCustomers.push(newCustomer);
        addedCount++;
      }
    });

    saveCustomers(mergedCustomers);
    alert(
      `Import completed!\nAdded: ${addedCount} customers\nUpdated: ${updatedCount} customers`
    );
  };

  // Handle Dialog open state explicitly
  const isDialogOpen = showAddForm || !!editingCustomer;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6" />
            Customer Management
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-1">
            Manage your customer database and relationships
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ExcelActions
            type="customers"
            data={customers}
            onImport={handleExcelImport}
            onExport={() => console.log("Customers exported")}
          />
          <Button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Add New Customer
          </Button>
        </div>
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="relative">
          <Input
            placeholder="Search customers by name, phone, email, or GST number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-400" />
        </div>
      </Card>

      {/* Add/Edit Form Dialog */}
      <Dialog
        open={isDialogOpen}
        onOpenChange={(open: boolean) => {
          if (!open) resetForm();
        }}
      >
        <DialogContent
          // fullScreen={true}
          className="overflow-y-auto bg-zinc-900 text-white w-[50vw]"
        >
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center">
              {editingCustomer ? "Edit Customer" : "Add New Customer"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">
                Full Name *
              </label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="John Doe"
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">
                Phone Number *
              </label>
              <Input
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="+91 9876543210"
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">
                Email Address
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="john@example.com"
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-zinc-300 mb-1">
                Address
              </label>
              <Input
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                placeholder="123 Main Street, City, State, PIN"
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">
                GST Number
              </label>
              <Input
                value={formData.gstNumber}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    gstNumber: e.target.value.toUpperCase(),
                  })
                }
                placeholder="27AAPFU0939F1ZV"
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">
                PAN Number
              </label>
              <Input
                value={formData.panNumber}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    panNumber: e.target.value.toUpperCase(),
                  })
                }
                placeholder="ABCDE1234F"
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 font-mono"
              />
            </div>
            <div className="md:col-span-2 lg:col-span-1">
              <label className="block text-sm font-medium text-zinc-300 mb-1">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Additional notes about the customer..."
                rows={3}
                className="w-[600px] px-3 py-2 border border-zinc-700 rounded-md bg-zinc-800 text-white placeholder:text-zinc-500"
              />
            </div>
          </div>

          <DialogFooter className="mt-8">
            <Button
              onClick={
                editingCustomer ? handleUpdateCustomer : handleAddCustomer
              }
              disabled={!formData.name || !formData.phone}
              className="w-full sm:w-auto max-h-[40px] bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            >
              {editingCustomer ? "Update Customer" : "Add Customer"}
            </Button>
            <Button
              onClick={resetForm}
              variant="secondary"
              className="w-full sm:w-auto max-h-[40px] bg-zinc-700 hover:bg-zinc-600 text-white font-semibold"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Customers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCustomers.map((customer) => (
          <Card
            key={customer.id}
            className="p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <span className="text-blue-600 dark:text-blue-400">
                  {getCustomerTypeIcon(customer)}
                </span>
                <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 px-2 py-1 rounded">
                  {getCustomerTypeLabel(customer)}
                </span>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => handleEditCustomer(customer)}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 p-1"
                  title="Edit"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteCustomer(customer.id)}
                  className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 p-1"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <h3 className="font-semibold text-zinc-900 dark:text-white mb-2">
              {customer.name}
            </h3>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-zinc-500" />
                <span className="text-zinc-600 dark:text-zinc-400">
                  {customer.phone}
                </span>
              </div>
              {customer.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-zinc-500" />
                  <span className="text-zinc-600 dark:text-zinc-400 truncate">
                    {customer.email}
                  </span>
                </div>
              )}
              {customer.address && (
                <div className="flex items-start gap-2">
                  <Home className="w-4 h-4 text-zinc-500 mt-0.5" />
                  <span className="text-zinc-600 dark:text-zinc-400 text-xs">
                    {customer.address}
                  </span>
                </div>
              )}
              {customer.gstNumber && (
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-zinc-500" />
                  <span className="text-zinc-600 dark:text-zinc-400 font-mono text-xs">
                    {customer.gstNumber}
                  </span>
                </div>
              )}
              {customer.panNumber && (
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-zinc-500" />
                  <span className="text-zinc-600 dark:text-zinc-400 font-mono text-xs">
                    {customer.panNumber}
                  </span>
                </div>
              )}
            </div>

            {customer.notes && (
              <div className="mt-3 p-2 bg-zinc-50 dark:bg-zinc-700 rounded text-xs text-zinc-600 dark:text-zinc-400 flex items-start gap-2">
                <FileText className="w-3 h-3 text-zinc-500 mt-0.5" />
                {customer.notes}
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-700">
              <div className="flex justify-between items-center text-sm">
                <div>
                  <p className="font-medium text-green-600 dark:text-green-400">
                    ₹{customer.totalPurchases.toLocaleString()}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Total Purchases
                  </p>
                </div>
                {customer.lastPurchaseDate && (
                  <div className="text-right">
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Last Purchase
                    </p>
                    <p className="text-xs font-medium">
                      {new Date(customer.lastPurchaseDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
                Customer since:{" "}
                {new Date(customer.createdAt).toLocaleDateString()}
              </p>
            </div>
          </Card>
        ))}
      </div>

      {filteredCustomers.length === 0 && (
        <Card className="p-8 text-center">
          <div className="flex justify-center mb-4">
            <Users className="w-12 h-12 text-zinc-400" />
          </div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
            No customers found
          </h3>
          <p className="text-zinc-600 dark:text-zinc-400 mb-4">
            {customers.length === 0
              ? "Start by adding your first customer to the database."
              : "Try adjusting your search criteria."}
          </p>
          {customers.length === 0 && (
            <Button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 mx-auto"
            >
              <UserPlus className="w-4 h-4" />
              Add Your First Customer
            </Button>
          )}
        </Card>
      )}

      {/* Summary */}
      {customers.length > 0 && (
        <Card className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm">
            <div>
              <p className="font-semibold text-zinc-900 dark:text-white">
                {customers.length}
              </p>
              <p className="text-zinc-600 dark:text-zinc-400">
                Total Customers
              </p>
            </div>
            <div>
              <p className="font-semibold text-zinc-900 dark:text-white">
                {filteredCustomers.length}
              </p>
              <p className="text-zinc-600 dark:text-zinc-400">Showing</p>
            </div>
            <div>
              <p className="font-semibold text-zinc-900 dark:text-white">
                {customers.filter((c) => c.gstNumber).length}
              </p>
              <p className="text-zinc-600 dark:text-zinc-400">
                Business Customers
              </p>
            </div>
            <div>
              <p className="font-semibold text-green-600 dark:text-green-400">
                ₹
                {customers
                  .reduce((sum, c) => sum + c.totalPurchases, 0)
                  .toLocaleString()}
              </p>
              <p className="text-zinc-600 dark:text-zinc-400">Total Sales</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
