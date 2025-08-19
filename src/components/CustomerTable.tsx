import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pencil, Trash2 } from "lucide-react";

interface Customer {
  _id?: string;
  id?: string;
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

interface Props {
  loading: boolean;
  currentCustomers: Customer[];
  handleEditCustomer: (c: Customer) => void;
  handleDeleteCustomer: (c: Customer) => void;
  getCustomerTypeLabel: (c: Customer) => string;
  getCustomerTypeIcon: (c: Customer) => React.ReactNode;
}

export function CustomerTable({
  loading,
  currentCustomers,
  handleEditCustomer,
  handleDeleteCustomer,
  getCustomerTypeLabel,
  getCustomerTypeIcon,
}: Props) {
  if (loading) return <p>Loading...</p>;

  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-40">Type</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Address</TableHead>
            <TableHead>GST</TableHead>
            <TableHead>PAN</TableHead>
            <TableHead>Total Purchases</TableHead>
            <TableHead>Last Purchase</TableHead>
            <TableHead>Customer Since</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {currentCustomers.map((customer) => (
            <TableRow key={customer._id || customer.id}>
              {/* Type */}
              <TableCell className="flex items-center gap-2">
                <span className="text-blue-600 dark:text-blue-400">
                  {getCustomerTypeIcon(customer)}
                </span>
                <span className="text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full">
                  {getCustomerTypeLabel(customer)}
                </span>
              </TableCell>

              {/* Name */}
              <TableCell className="font-medium">{customer.name}</TableCell>

              {/* Contact */}
              <TableCell>{customer.phone}</TableCell>
              <TableCell className="truncate max-w-[160px]">{customer.email || "-"}</TableCell>

              {/* Address */}
              <TableCell className="truncate max-w-[200px]">{customer.address || "-"}</TableCell>

              {/* GST & PAN */}
              <TableCell>{customer.gstNumber || "-"}</TableCell>
              <TableCell>{customer.panNumber || "-"}</TableCell>

              {/* Purchases */}
              <TableCell className="font-semibold text-green-600 dark:text-green-400">
                ₹{customer.totalPurchases.toLocaleString()}
              </TableCell>

              {/* Last Purchase */}
              <TableCell>
                {customer.lastPurchaseDate
                  ? new Date(customer.lastPurchaseDate).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                  : "-"}
              </TableCell>

              {/* Customer Since */}
              <TableCell>
                {new Date(customer.createdAt).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </TableCell>

              {/* Actions */}
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => handleEditCustomer(customer)}
                    className="p-2 rounded-full hover:bg-blue-50 dark:hover:bg-zinc-700"
                    title="Edit"
                  >
                    <Pencil className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </button>
                  <button
                    onClick={() => handleDeleteCustomer(customer)}
                    className="p-2 rounded-full hover:bg-red-50 dark:hover:bg-zinc-700"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                  </button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
