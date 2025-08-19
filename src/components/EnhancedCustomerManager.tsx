"use client";

import React, { useState, useRef } from "react";
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
import { useCustomers, type Customer } from "@/hooks/useCustomers";
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
  RefreshCw,
} from "lucide-react";
import { CustomerTable } from "./CustomerTable";

export const EnhancedCustomerManager: React.FC = () => {
  const {
    customers,
    loading,
    error,
    loadCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    bulkImportCustomers,
    searchCustomers, // <-- Add this to your hook
  } = useCustomers();

  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [savingCustomer, setSavingCustomer] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  // Backend search state
  const [backendCustomers, setBackendCustomers] = useState<Customer[]>([]);
  const [backendSearchLoading, setBackendSearchLoading] = useState(false);
  const [backendSearchActive, setBackendSearchActive] = useState(false);
  const [backendTotal, setBackendTotal] = useState(0);
  const [backendTotalPages, setBackendTotalPages] = useState(1);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    gstNumber: "",
    panNumber: "",
    notes: "",
  });

  const handleAddCustomer = async () => {
    if (!formData.name || !formData.phone) return;

    setSavingCustomer(true);
    try {
      const result = await createCustomer(formData);
      if (result.success) {
        resetForm();
      } else {
        alert(result.error || "Failed to create customer. Please try again.");
      }
    } catch (error) {
      console.error("Failed to create customer:", error);
      alert("Failed to create customer. Please try again.");
    } finally {
      setSavingCustomer(false);
    }
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

  const handleUpdateCustomer = async () => {
    if (!editingCustomer || !formData.name || !formData.phone) return;

    setSavingCustomer(true);
    try {
      const customerId = editingCustomer._id || editingCustomer.id!;
      const result = await updateCustomer(customerId, formData);
      if (result.success) {
        resetForm();
      } else {
        alert(result.error || "Failed to update customer. Please try again.");
      }
    } catch (error) {
      console.error("Failed to update customer:", error);
      alert("Failed to update customer. Please try again.");
    } finally {
      setSavingCustomer(false);
    }
  };

  const handleDeleteCustomer = async (customer: Customer) => {
    if (!confirm("Are you sure you want to delete this customer?")) return;

    try {
      const customerId = customer._id || customer.id!;
      const result = await deleteCustomer(customerId);
      if (!result.success) {
        alert(result.error || "Failed to delete customer. Please try again.");
      }
    } catch (error) {
      console.error("Failed to delete customer:", error);
      alert("Failed to delete customer. Please try again.");
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

  // Debounce search
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  const fetchBackendCustomers = async (
    term: string,
    page: number,
    limit: number
  ) => {
    setBackendSearchLoading(true);
    try {
      const result = await searchCustomers(term, page, limit);
      setBackendCustomers(result.data || []);
      setBackendTotal(result.total || 0);
      setBackendTotalPages(result.totalPages || 1);
    } catch (err) {
      setBackendCustomers([]);
      setBackendTotal(0);
      setBackendTotalPages(1);
    } finally {
      setBackendSearchLoading(false);
    }
  };

  // Initial load for all customers (pagination)
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  const [allTotal, setAllTotal] = useState(0);
  const [allTotalPages, setAllTotalPages] = useState(1);

  const fetchAllCustomers = async (page: number, limit: number) => {
    setBackendSearchLoading(true);
    try {
      const result = await searchCustomers("", page, limit);

      setAllCustomers(result.data || []);
      setAllTotal(result.total || 0);
      setAllTotalPages(result.totalPages || 1);
    } catch (err) {
      setAllCustomers([]);
      setAllTotal(0);
      setAllTotalPages(1);
    } finally {
      setBackendSearchLoading(false);
    }
  };

  // On mount, load first page of all customers
  React.useEffect(() => {
    fetchAllCustomers(currentPage, itemsPerPage);
  }, [currentPage, itemsPerPage]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    if (term.trim().length === 0) {
      setBackendSearchActive(false);
      setBackendCustomers([]);
      setBackendTotal(0);
      setBackendTotalPages(1);
      return;
    }

    setBackendSearchActive(true);

    searchTimeout.current = setTimeout(() => {
      fetchBackendCustomers(term, 1, itemsPerPage);
      setCurrentPage(1);
    }, 400); // 400ms debounce
  };

  // Use backend results if searching, otherwise use paginated allCustomers
  const filteredCustomers = backendSearchActive ? backendCustomers : allCustomers;
  const totalPages = backendSearchActive ? backendTotalPages : allTotalPages;
  const totalCount = backendSearchActive ? backendTotal : allTotal;

  // Pagination calculations
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  // Render current page from the selected (filtered) dataset
  const currentCustomers = filteredCustomers;

  // console.table(currentCustomers);

  // Handle page change for backend search and normal mode
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    if (backendSearchActive) {
      fetchBackendCustomers(searchTerm, page, itemsPerPage);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
    if (backendSearchActive) {
      fetchBackendCustomers(searchTerm, 1, newItemsPerPage);
    }
  };

  // Pagination component
  const PaginationControls = () => {
    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
      const pages = [];
      const maxVisible = 5;
      if (totalPages <= maxVisible) {
        for (let i = 1; i <= totalPages; i++) pages.push(i);
      } else {
        if (currentPage <= 3) {
          for (let i = 1; i <= 4; i++) pages.push(i);
          pages.push("...");
          pages.push(totalPages);
        } else if (currentPage >= totalPages - 2) {
          pages.push(1);
          pages.push("...");
          for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
        } else {
          pages.push(1);
          pages.push("...");
          for (let i = currentPage - 1; i <= currentPage + 1; i++)
            pages.push(i);
          pages.push("...");
          pages.push(totalPages);
        }
      }
      return pages;
    };

    return (
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
            <span>Show</span>
            <select
              value={itemsPerPage}
              onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
              className="px-2 py-1 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
            >
              <option value={6}>6</option>
              <option value={12}>12</option>
              <option value={24}>24</option>
              <option value={48}>48</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
            </select>
            <span>per page</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
            <span>
              Showing {startIndex + 1}-{Math.min(endIndex, totalCount)} of{" "}
              {totalCount} customers
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              variant="secondary"
              size="sm"
            >
              Previous
            </Button>
            {getPageNumbers().map((page, index) => (
              <React.Fragment key={index}>
                {page === "..." ? (
                  <span className="px-2 py-1 text-zinc-500">...</span>
                ) : (
                  <Button
                    onClick={() => handlePageChange(page as number)}
                    variant={currentPage === page ? "primary" : "secondary"}
                    size="sm"
                    className="min-w-[32px]"
                  >
                    {page}
                  </Button>
                )}
              </React.Fragment>
            ))}
            <Button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              variant="secondary"
              size="sm"
            >
              Next
            </Button>
          </div>
        </div>
      </Card>
    );
  };

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
  const handleExcelImport = async (importedCustomers: Customer[]) => {
    if (!importedCustomers || importedCustomers.length === 0) {
      alert("No customers to import");
      return;
    }

    try {
      const result = await bulkImportCustomers(importedCustomers);

      if (result.success) {
        const { successful, failed, errors } = result.data;
        let message = `Import completed!\n✅ ${successful} customers imported successfully`;

        if (failed > 0) {
          message += `\n❌ ${failed} customers failed to import`;
          if (errors.length > 0) {
            message += `\n\nErrors:\n${errors.slice(0, 5).join("\n")}`;
            if (errors.length > 5) {
              message += `\n... and ${errors.length - 5} more errors`;
            }
          }
        }

        alert(message);
      } else {
        alert(`Import failed: ${result.error}`);
      }
    } catch (error) {
      console.error("Failed to import customers:", error);
      alert("Failed to import customers. Please try again.");
    }
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
            Manage your customer database with MongoDB backend
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => loadCustomers()}
            disabled={loading}
            variant="secondary"
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
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

      {/* Error State */}
      {error && (
        <Card className="p-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700">
          <p className="text-red-800 dark:text-red-300">Error: {error}</p>
          <Button
            onClick={() => loadCustomers()}
            variant="secondary"
            size="sm"
            className="mt-2"
          >
            Try Again
          </Button>
        </Card>
      )}

      {/* Search */}

      <Card className="p-4">
        <div className="relative">
          <Input
            placeholder="Search customers by name, phone, email, or GST number..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-400" />
        </div>
      </Card>

      {/* Loading State */}
      {(loading || backendSearchLoading) && (
        <Card className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-zinc-600 dark:text-zinc-400">
            Loading customers from database...
          </p>
        </Card>
      )}

      {/* Pagination Controls - Top */}
      {!loading && filteredCustomers.length > 0 && <PaginationControls />}

      {/* Add/Edit Form Dialog */}
      <Dialog
        open={isDialogOpen}
        onOpenChange={(open: boolean) => {
          if (!open) resetForm();
        }}
      >
        <DialogContent className="overflow-y-auto bg-zinc-900 text-white w-[50vw]">
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
                disabled={savingCustomer}
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
                disabled={savingCustomer}
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
                disabled={savingCustomer}
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
                disabled={savingCustomer}
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
                disabled={savingCustomer}
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
                disabled={savingCustomer}
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
                disabled={savingCustomer}
              />
            </div>
          </div>

          <DialogFooter className="mt-8">
            <Button
              onClick={
                editingCustomer ? handleUpdateCustomer : handleAddCustomer
              }
              disabled={!formData.name || !formData.phone || savingCustomer}
              className="w-full sm:w-auto max-h-[40px] bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            >
              {savingCustomer ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  {editingCustomer ? "Updating..." : "Adding..."}
                </>
              ) : editingCustomer ? (
                "Update Customer"
              ) : (
                "Add Customer"
              )}
            </Button>
            <Button
              onClick={resetForm}
              variant="secondary"
              className="w-full sm:w-auto max-h-[40px] bg-zinc-700 hover:bg-zinc-600 text-white font-semibold"
              disabled={savingCustomer}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Customers Grid - Updated to use currentCustomers */}
      {!loading && (
        <CustomerTable
          loading={loading}
          currentCustomers={filteredCustomers}
          handleEditCustomer={handleEditCustomer}
          handleDeleteCustomer={handleDeleteCustomer}
          getCustomerTypeLabel={getCustomerTypeLabel}
          getCustomerTypeIcon={getCustomerTypeIcon}
        />
      )}

      {/* Pagination Controls - Bottom */}
      {!loading && filteredCustomers.length > 0 && <PaginationControls />}

      {/* Empty State */}
      {!loading && filteredCustomers.length === 0 && (
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

      {/* Summary - Updated to show backend total */}
      {!loading && (
        <Card className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center text-sm">
            <div>
              <p className="font-semibold text-zinc-900 dark:text-white">
                {totalCount}
              </p>
              <p className="text-zinc-600 dark:text-zinc-400">
                Total Customers
              </p>
            </div>
            <div>
              <p className="font-semibold text-zinc-900 dark:text-white">
                {totalCount}
              </p>
              <p className="text-zinc-600 dark:text-zinc-400">Filtered</p>
            </div>
            <div>
              <p className="font-semibold text-zinc-900 dark:text-white">
                {filteredCustomers.length}
              </p>
              <p className="text-zinc-600 dark:text-zinc-400">Showing</p>
            </div>
            <div>
              <p className="font-semibold text-zinc-900 dark:text-white">
                {filteredCustomers.filter((c) => c.gstNumber).length}
              </p>
              <p className="text-zinc-600 dark:text-zinc-400">
                Business Customers
              </p>
            </div>
            <div>
              <p className="font-semibold text-green-600 dark:text-green-400">
                ₹
                {filteredCustomers
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
  