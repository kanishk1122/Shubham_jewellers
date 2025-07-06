import React, { useState } from "react";
import { Customer } from "@/types/billing";
import { useCustomers } from "@/hooks/useBilling";
import { Button, Input, Modal, Card } from "@/components/ui";

interface CustomerFormProps {
  isOpen: boolean;
  onClose: () => void;
  customer?: Customer;
  onSave: (customer: Customer) => void;
}

export const CustomerForm: React.FC<CustomerFormProps> = ({
  isOpen,
  onClose,
  customer,
  onSave,
}) => {
  const [formData, setFormData] = useState<Partial<Customer>>(
    customer || {
      name: "",
      phone: "",
      email: "",
      address: {
        street: "",
        city: "",
        state: "",
        pincode: "",
        country: "India",
      },
      gstNumber: "",
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.phone) {
      onSave(formData as Customer);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={customer ? "Edit Customer" : "Add New Customer"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Full Name"
          value={formData.name}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, name: e.target.value }))
          }
          required
        />

        <Input
          label="Phone Number"
          value={formData.phone}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, phone: e.target.value }))
          }
          required
        />

        <Input
          label="Email (Optional)"
          type="email"
          value={formData.email}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, email: e.target.value }))
          }
        />

        <Input
          label="GST Number (Optional)"
          value={formData.gstNumber}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, gstNumber: e.target.value }))
          }
        />

        <div className="border-t pt-4">
          <h4 className="text-md font-semibold mb-3">Address</h4>

          <Input
            label="Street Address"
            value={formData.address?.street}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                address: { ...prev.address!, street: e.target.value },
              }))
            }
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="City"
              value={formData.address?.city}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  address: { ...prev.address!, city: e.target.value },
                }))
              }
            />

            <Input
              label="State"
              value={formData.address?.state}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  address: { ...prev.address!, state: e.target.value },
                }))
              }
            />

            <Input
              label="Pincode"
              value={formData.address?.pincode}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  address: { ...prev.address!, pincode: e.target.value },
                }))
              }
            />

            <Input
              label="Country"
              value={formData.address?.country}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  address: { ...prev.address!, country: e.target.value },
                }))
              }
            />
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">
            {customer ? "Update Customer" : "Add Customer"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export const CustomerList: React.FC = () => {
  const { customers, addCustomer, updateCustomer, searchCustomers } =
    useCustomers();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<
    Customer | undefined
  >();
  const [searchQuery, setSearchQuery] = useState("");

  const displayCustomers = searchQuery
    ? searchCustomers(searchQuery)
    : customers;

  const handleSaveCustomer = (customer: Customer) => {
    if (editingCustomer) {
      updateCustomer(editingCustomer.id, customer);
    } else {
      addCustomer(customer);
    }
    setEditingCustomer(undefined);
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsFormOpen(true);
  };

  return (
    <Card title="Customer Management">
      <div className="flex justify-between items-center mb-4">
        <Input
          placeholder="Search customers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
        <Button onClick={() => setIsFormOpen(true)}>Add New Customer</Button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">
                Name
              </th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">
                Phone
              </th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">
                Email
              </th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">
                City
              </th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {displayCustomers.map((customer) => (
              <tr key={customer.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 text-sm font-medium">
                  {customer.name}
                </td>
                <td className="px-4 py-2 text-sm">{customer.phone}</td>
                <td className="px-4 py-2 text-sm">{customer.email || "-"}</td>
                <td className="px-4 py-2 text-sm">
                  {customer.address?.city || "-"}
                </td>
                <td className="px-4 py-2 text-sm">
                  <Button
                    size="sm"
                    onClick={() => handleEditCustomer(customer)}
                  >
                    Edit
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <CustomerForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingCustomer(undefined);
        }}
        customer={editingCustomer}
        onSave={handleSaveCustomer}
      />
    </Card>
  );
};
