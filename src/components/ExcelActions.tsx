"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/enhanced";
import ExcelService from "@/utils/excelService";

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

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      let importedData: any[] = [];

      switch (type) {
        case "products":
          importedData = await ExcelService.importProducts(file);
          break;
        case "customers":
          importedData = await ExcelService.importCustomers(file);
          break;
        case "rates":
          importedData = await ExcelService.importMetalRates(file);
          break;
        default:
          throw new Error("Import not supported for this type");
      }

      onImport?.(importedData);
      alert(`Successfully imported ${importedData.length} records!`);
    } catch (error) {
      console.error("Import failed:", error);
      alert("Import failed. Please check your file format and try again.");
    } finally {
      setImporting(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
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
                Importing...
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
            onChange={handleImport}
            className="hidden"
          />
        </>
      )}
    </div>
  );
};

export default ExcelActions;
