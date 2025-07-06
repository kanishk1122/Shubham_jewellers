import React, { useState, useEffect } from "react";
import {
  Product,
  Customer,
  BillItem,
  PaymentMethod,
  PaymentStatus,
} from "@/types/billing";
import { useBilling, useProducts, useCustomers } from "@/hooks/useBilling";
import { BillingCalculator } from "@/utils/billing";
import { Button, Input, Select, Card, Modal, Badge } from "@/components/ui";

interface ProductSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct: (product: Product) => void;
}

const ProductSelectionModal: React.FC<ProductSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelectProduct,
}) => {
  const { products, searchProducts } = useProducts();
  const [searchQuery, setSearchQuery] = useState("");

  const displayProducts = searchQuery ? searchProducts(searchQuery) : products;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Select Product" size="lg">
      <div className="space-y-4">
        <Input
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <div className="max-h-96 overflow-y-auto">
          <div className="grid gap-2">
            {displayProducts.map((product) => (
              <div
                key={product.id}
                className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                onClick={() => {
                  onSelectProduct(product);
                  onClose();
                }}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">{product.name}</h4>
                    <p className="text-sm text-gray-600">
                      {product.category} - {product.material} {product.purity}
                    </p>
                    <p className="text-sm text-gray-500">
                      Weight: {product.weight}g | Price: ₹{product.basePrice}/g
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold">
                      ₹
                      {BillingCalculator.calculateItemPrice(
                        product,
                        1,
                        0
                      ).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
};

interface CustomerSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCustomer: (customer: Customer) => void;
}

const CustomerSelectionModal: React.FC<CustomerSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelectCustomer,
}) => {
  const { customers, searchCustomers, addCustomer } = useCustomers();
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    phone: "",
    email: "",
  });

  const displayCustomers = searchQuery
    ? searchCustomers(searchQuery)
    : customers;

  const handleAddNewCustomer = () => {
    if (newCustomer.name && newCustomer.phone) {
      const customer = addCustomer({
        ...newCustomer,
        address: {
          street: "",
          city: "",
          state: "",
          pincode: "",
          country: "India",
        },
      });
      onSelectCustomer(customer);
      onClose();
      setIsAddingNew(false);
      setNewCustomer({ name: "", phone: "", email: "" });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Select Customer" size="lg">
      <div className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Search customers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <Button onClick={() => setIsAddingNew(true)}>Add New</Button>
        </div>

        {isAddingNew && (
          <div className="border rounded-lg p-4 bg-gray-50">
            <h4 className="font-medium mb-3">Add New Customer</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <Input
                placeholder="Full Name"
                value={newCustomer.name}
                onChange={(e) =>
                  setNewCustomer((prev) => ({ ...prev, name: e.target.value }))
                }
              />
              <Input
                placeholder="Phone Number"
                value={newCustomer.phone}
                onChange={(e) =>
                  setNewCustomer((prev) => ({ ...prev, phone: e.target.value }))
                }
              />
              <Input
                placeholder="Email (Optional)"
                value={newCustomer.email}
                onChange={(e) =>
                  setNewCustomer((prev) => ({ ...prev, email: e.target.value }))
                }
              />
            </div>
            <div className="flex gap-2 mt-3">
              <Button size="sm" onClick={handleAddNewCustomer}>
                Add Customer
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setIsAddingNew(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        <div className="max-h-96 overflow-y-auto">
          <div className="grid gap-2">
            {displayCustomers.map((customer) => (
              <div
                key={customer.id}
                className="border rounded-lg p-3 hover:bg-gray-50 cursor-pointer"
                onClick={() => {
                  onSelectCustomer(customer);
                  onClose();
                }}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium">{customer.name}</h4>
                    <p className="text-sm text-gray-600">{customer.phone}</p>
                    {customer.email && (
                      <p className="text-sm text-gray-500">{customer.email}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export const BillingSystem: React.FC = () => {
  const {
    currentBill,
    setCurrentBill,
    addItemToBill,
    removeItemFromBill,
    updateBillItem,
    calculateBillTotals,
    saveBill,
  } = useBilling();

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [isSaving, setIsSaving] = useState(false);

  const totals = calculateBillTotals();

  const handleSelectProduct = (product: Product) => {
    addItemToBill(product, 1, 0);
  };

  const handleSaveBill = async () => {
    if (!selectedCustomer) {
      alert("Please select a customer");
      return;
    }

    if (!currentBill.items || currentBill.items.length === 0) {
      alert("Please add items to the bill");
      return;
    }

    setIsSaving(true);
    try {
      const savedBill = saveBill(selectedCustomer);
      alert(`Bill ${savedBill.billNumber} saved successfully!`);
      setSelectedCustomer(null);
    } catch (error) {
      alert("Error saving bill");
    } finally {
      setIsSaving(false);
    }
  };

  const paymentMethodOptions = Object.values(PaymentMethod).map((method) => ({
    value: method,
    label: method,
  }));

  const paymentStatusOptions = Object.values(PaymentStatus).map((status) => ({
    value: status,
    label: status,
  }));

  return (
    <div className="space-y-6">
      {/* Bill Header */}
      <Card title="New Bill">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bill Number
            </label>
            <p className="text-lg font-semibold">{currentBill.billNumber}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <p className="text-lg">{new Date().toLocaleDateString()}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Customer
            </label>
            {selectedCustomer ? (
              <div className="flex items-center gap-2">
                <span className="text-sm">{selectedCustomer.name}</span>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setIsCustomerModalOpen(true)}
                >
                  Change
                </Button>
              </div>
            ) : (
              <Button onClick={() => setIsCustomerModalOpen(true)}>
                Select Customer
              </Button>
            )}
          </div>

          <div>
            <Button onClick={() => setIsProductModalOpen(true)}>
              Add Product
            </Button>
          </div>
        </div>
      </Card>

      {/* Bill Items */}
      <Card title="Bill Items">
        {currentBill.items && currentBill.items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">
                    Product
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">
                    Material
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">
                    Weight
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">
                    Quantity
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">
                    Discount %
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">
                    Amount
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {currentBill.items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-2">
                      <div>
                        <p className="font-medium">{item.product.name}</p>
                        <p className="text-sm text-gray-500">
                          {item.product.category}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-sm">
                      {item.product.material} {item.product.purity}
                    </td>
                    <td className="px-4 py-2 text-sm">
                      {item.product.weight}g
                    </td>
                    <td className="px-4 py-2">
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) =>
                          updateBillItem(item.id, {
                            quantity: parseInt(e.target.value) || 1,
                          })
                        }
                        className="w-20"
                        min="1"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <Input
                        type="number"
                        value={item.discount}
                        onChange={(e) =>
                          updateBillItem(item.id, {
                            discount: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-20"
                        min="0"
                        max="100"
                        step="0.1"
                      />
                    </td>
                    <td className="px-4 py-2 font-medium">
                      ₹{item.finalPrice.toLocaleString()}
                    </td>
                    <td className="px-4 py-2">
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => removeItemFromBill(item.id)}
                      >
                        Remove
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No items added to bill yet. Click "Add Product" to start.
          </div>
        )}
      </Card>

      {/* Bill Summary */}
      {totals && (
        <Card title="Bill Summary">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>₹{totals.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Discount:</span>
                <span className="text-red-600">
                  -₹{totals.totalDiscount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Taxable Amount:</span>
                <span>₹{totals.taxableAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>CGST (3%):</span>
                <span>₹{totals.cgst.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>SGST (3%):</span>
                <span>₹{totals.sgst.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-medium border-t pt-2">
                <span className="text-lg">Grand Total:</span>
                <span className="text-lg">
                  ₹{totals.grandTotal.toLocaleString()}
                </span>
              </div>
              <div className="text-sm text-gray-600 border-t pt-2">
                Amount in words:{" "}
                {BillingCalculator.numberToWords(totals.grandTotal)}
              </div>
            </div>

            <div className="space-y-4">
              <Select
                label="Payment Method"
                value={currentBill.paymentMethod || PaymentMethod.CASH}
                onChange={(e) =>
                  setCurrentBill((prev) => ({
                    ...prev,
                    paymentMethod: e.target.value as PaymentMethod,
                  }))
                }
                options={paymentMethodOptions}
              />

              <Select
                label="Payment Status"
                value={currentBill.paymentStatus || PaymentStatus.PENDING}
                onChange={(e) =>
                  setCurrentBill((prev) => ({
                    ...prev,
                    paymentStatus: e.target.value as PaymentStatus,
                  }))
                }
                options={paymentStatusOptions}
              />

              <div className="pt-4">
                <Button
                  onClick={handleSaveBill}
                  disabled={
                    isSaving || !selectedCustomer || !currentBill.items?.length
                  }
                  className="w-full"
                >
                  {isSaving ? "Saving..." : "Save Bill"}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Modals */}
      <ProductSelectionModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onSelectProduct={handleSelectProduct}
      />

      <CustomerSelectionModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        onSelectCustomer={setSelectedCustomer}
      />
    </div>
  );
};
