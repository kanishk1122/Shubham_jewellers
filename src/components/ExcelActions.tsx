"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/enhanced";
import ExcelService from "@/utils/excelService";
import * as XLSX from "xlsx";

interface ExcelActionsProps {
  type: "products" | "customers" | "bills" | "rates" | "all";
  data?: any[];
  onImport?: (data: any[]) => void;
  onExport?: () => void;
}

export const ExcelActions: React.FC<ExcelActionsProps> = ({
  type,
  data = [],
  onImport,
  onExport,
}) => {
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [importData, setImportData] = useState<any[]>([]);
  const [importOptions, setImportOptions] = useState({
    skipDuplicates: false,
    updateExisting: false,
    duplicateCheckField: "phone" as "phone" | "email" | "both",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    setExporting(true);
    try {
      switch (type) {
        case "products":
          await ExcelService.exportProducts(data);
          break;
        case "customers":
          await ExcelService.exportCustomers(data);
          break;
        case "bills":
          await ExcelService.exportBills(data);
          break;
        case "rates":
          await ExcelService.exportMetalRates(data);
          break;
        case "all":
          await ExcelService.exportAllData();
          break;
      }
      onExport?.();
    } catch (error) {
      console.error("Export failed:", error);
      alert("Export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
        }) as any[][];

        if (jsonData.length < 2) {
          alert(
            "Excel file must contain at least a header row and one data row"
          );
          setImporting(false);
          return;
        }

        const headers = jsonData[0];
        const rows = jsonData.slice(1);

        let processedData: any[] = [];

        if (type === "customers") {
          // Process customer data with exact column matching
          processedData = rows
            .map((row, index) => {
              const customer: any = {};

              // Map exact column names from template
              headers.forEach((header: string, colIndex: number) => {
                const normalizedHeader = header.toString().toLowerCase().trim();
                const value = row[colIndex]
                  ? row[colIndex].toString().trim()
                  : "";

                if (!value) return;

                // Match exact template column names
                switch (normalizedHeader) {
                  case "name":
                  case "customer name":
                  case "full name":
                    customer.name = value;
                    break;
                  case "phone":
                  case "phone number":
                  case "mobile":
                  case "contact number":
                    customer.phone = value;
                    break;
                  case "email":
                  case "email address":
                    customer.email = value.toLowerCase();
                    break;
                  case "address":
                  case "full address":
                  case "customer address":
                    customer.address = value;
                    break;
                  case "gst":
                  case "gst number":
                  case "gstin":
                  case "gst no":
                    customer.gstNumber = value.toUpperCase();
                    break;
                  case "pan":
                  case "pan number":
                  case "pan no":
                    customer.panNumber = value.toUpperCase();
                    break;
                  case "notes":
                  case "remarks":
                  case "comments":
                  case "note":
                    customer.notes = value;
                    break;
                }
              });

              // Validate required fields
              if (!customer.name || !customer.phone) {
                console.warn(
                  `Row ${index + 2}: Missing required fields (name: "${
                    customer.name
                  }", phone: "${customer.phone}")`
                );
                return null;
              }

              // Validate phone number format
              if (
                customer.phone &&
                !/^\d{10}$/.test(customer.phone.replace(/\D/g, ""))
              ) {
                console.warn(
                  `Row ${index + 2}: Invalid phone number format: ${
                    customer.phone
                  }`
                );
              }

              // Validate email format if provided
              if (
                customer.email &&
                !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)
              ) {
                console.warn(
                  `Row ${index + 2}: Invalid email format: ${customer.email}`
                );
                customer.email = undefined; // Remove invalid email
              }

              return customer;
            })
            .filter((customer) => customer !== null);
        } else if (type === "products") {
          // Process product data
          processedData = rows
            .map((row, index) => {
              const product: any = {};

              headers.forEach((header: string, colIndex: number) => {
                const normalizedHeader = header.toString().toLowerCase().trim();
                const value = row[colIndex]
                  ? row[colIndex].toString().trim()
                  : "";

                if (!value) return;

                switch (normalizedHeader) {
                  case "name":
                  case "product name":
                    product.name = value;
                    break;
                  case "category":
                    product.category = value.toLowerCase();
                    break;
                  case "metal":
                    product.metal = value.toLowerCase();
                    break;
                  case "purity":
                    product.purity = value;
                    break;
                  case "weight":
                  case "weight (g)":
                    product.weight = parseFloat(value) || 0;
                    break;
                  case "stone weight":
                  case "stone weight (g)":
                    product.stoneWeight = parseFloat(value) || 0;
                    break;
                  case "making charges":
                  case "making charges (₹)":
                    product.makingCharges = parseFloat(value) || 0;
                    break;
                  case "description":
                    product.description = value;
                    break;
                  case "image url":
                    product.imageUrl = value;
                    break;
                }
              });

              if (!product.name || !product.weight || !product.makingCharges) {
                console.warn(`Row ${index + 2}: Missing required fields`);
                return null;
              }

              return product;
            })
            .filter((product) => product !== null);
        }

        if (processedData.length === 0) {
          alert(
            "No valid data found in the Excel file. Please check the format and ensure all required fields are filled."
          );
          setImporting(false);
          return;
        }

        setImportData(processedData);
        setShowPreview(true);
        setImporting(false);
      } catch (error) {
        console.error("Error processing Excel file:", error);
        alert("Error processing Excel file. Please check the format.");
        setImporting(false);
      }
    };

    reader.readAsArrayBuffer(file);
    event.target.value = "";
  };

  const handleConfirmImport = async () => {
    if (importData.length === 0) return;

    setImporting(true);
    try {
      // Call the onImport function with processed data and options
      onImport?.(importData);
      setShowPreview(false);
      setImportData([]);
    } catch (error) {
      console.error("Import failed:", error);
      alert("Import failed. Please try again.");
    } finally {
      setImporting(false);
    }
  };

  const handleCancelImport = () => {
    setShowPreview(false);
    setImportData([]);
    setImporting(false);
  };

  const handleDownloadTemplate = async () => {
    try {
      switch (type) {
        case "products":
          await ExcelService.generateProductTemplate();
          break;
        case "customers":
          await ExcelService.generateCustomerTemplate();
          break;
        default:
          alert("Template not available for this type");
          return;
      }
      alert("Template downloaded successfully!");
    } catch (error) {
      console.error("Template download failed:", error);
      alert("Template download failed. Please try again.");
    }
  };

  const getTypeLabel = () => {
    switch (type) {
      case "products":
        return "Products";
      case "customers":
        return "Customers";
      case "bills":
        return "Bills";
      case "rates":
        return "Metal Rates";
      case "all":
        return "All Data";
      default:
        return "Data";
    }
  };

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {/* Export Button */}
        <Button
          onClick={handleExport}
          disabled={exporting || (type !== "all" && data.length === 0)}
          className="flex items-center gap-2"
          variant="success"
        >
          {exporting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Exporting...
            </>
          ) : (
            <>
              <span>📊</span>
              Export {getTypeLabel()}
            </>
          )}
        </Button>

        {/* Import Button (only for certain types) */}
        {(type === "products" || type === "customers" || type === "rates") && (
          <>
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
              className="flex items-center gap-2"
              variant="primary"
            >
              {importing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Processing...
                </>
              ) : (
                <>
                  <span>📥</span>
                  Import {getTypeLabel()}
                </>
              )}
            </Button>

            {/* Download Template Button */}
            <Button
              onClick={handleDownloadTemplate}
              className="flex items-center gap-2"
              variant="secondary"
            >
              <span>📋</span>
              Download Template
            </Button>

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              className="hidden"
            />
          </>
        )}
      </div>

      {/* Preview Dialog */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-800 rounded-lg p-6 max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <h3 className="text-lg font-semibold mb-4">
              Import Preview - {importData.length} {getTypeLabel()} Found
            </h3>

            {/* Import Options for Customers */}
            {type === "customers" && (
              <div className="mb-4 p-4 bg-zinc-50 dark:bg-zinc-700 rounded-lg">
                <h4 className="text-sm font-semibold mb-2">Import Options</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={importOptions.skipDuplicates}
                      onChange={(e) =>
                        setImportOptions((prev) => ({
                          ...prev,
                          skipDuplicates: e.target.checked,
                          updateExisting: e.target.checked
                            ? false
                            : prev.updateExisting,
                        }))
                      }
                      className="rounded"
                    />
                    <span className="text-sm">Skip Duplicates</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={importOptions.updateExisting}
                      onChange={(e) =>
                        setImportOptions((prev) => ({
                          ...prev,
                          updateExisting: e.target.checked,
                          skipDuplicates: e.target.checked
                            ? false
                            : prev.skipDuplicates,
                        }))
                      }
                      className="rounded"
                    />
                    <span className="text-sm">Update Existing</span>
                  </label>
                  <div>
                    <label className="text-sm font-medium">
                      Check duplicates by:
                    </label>
                    <select
                      value={importOptions.duplicateCheckField}
                      onChange={(e) =>
                        setImportOptions((prev) => ({
                          ...prev,
                          duplicateCheckField: e.target.value as
                            | "phone"
                            | "email"
                            | "both",
                        }))
                      }
                      className="w-full mt-1 px-2 py-1 text-sm border border-zinc-300 dark:border-zinc-600 rounded"
                    >
                      <option value="phone">Phone</option>
                      <option value="email">Email</option>
                      <option value="both">Phone or Email</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            <div className="overflow-auto max-h-96 mb-4">
              <table className="min-w-full border border-zinc-200 dark:border-zinc-700">
                <thead className="bg-zinc-50 dark:bg-zinc-700">
                  <tr>
                    {type === "customers" ? (
                      <>
                        <th className="px-3 py-2 text-left text-xs font-medium">
                          Name
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium">
                          Phone
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium">
                          Email
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium">
                          Address
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium">
                          GST
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium">
                          PAN
                        </th>
                      </>
                    ) : (
                      <>
                        <th className="px-3 py-2 text-left text-xs font-medium">
                          Name
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium">
                          Category
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium">
                          Metal
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium">
                          Weight
                        </th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-zinc-800 divide-y divide-zinc-200 dark:divide-zinc-700">
                  {importData.slice(0, 10).map((item, index) => (
                    <tr key={index}>
                      {type === "customers" ? (
                        <>
                          <td className="px-3 py-2 text-sm">{item.name}</td>
                          <td className="px-3 py-2 text-sm">{item.phone}</td>
                          <td className="px-3 py-2 text-sm">
                            {item.email || "-"}
                          </td>
                          <td className="px-3 py-2 text-sm">
                            {item.address || "-"}
                          </td>
                          <td className="px-3 py-2 text-sm">
                            {item.gstNumber || "-"}
                          </td>
                          <td className="px-3 py-2 text-sm">
                            {item.panNumber || "-"}
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-3 py-2 text-sm">{item.name}</td>
                          <td className="px-3 py-2 text-sm">{item.category}</td>
                          <td className="px-3 py-2 text-sm">{item.metal}</td>
                          <td className="px-3 py-2 text-sm">{item.weight}g</td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              {importData.length > 10 && (
                <p className="text-sm text-zinc-500 mt-2">
                  ... and {importData.length - 10} more items
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button onClick={handleCancelImport} variant="secondary">
                Cancel
              </Button>
              <Button
                onClick={handleConfirmImport}
                disabled={importing}
                className="flex items-center gap-2"
              >
                {importing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Importing...
                  </>
                ) : (
                  <>
                    Import {importData.length} {getTypeLabel()}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ExcelActions;
