"use client";

import React, { useState } from "react";
import {
  Card,
  Input,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui";
import ExcelActions from "@/components/ExcelActions";
import { useProducts, type Product } from "@/hooks/useProducts";
import { useBulkProducts, type BulkProduct } from "@/hooks/useBulkProducts";
import {
  Package,
  Circle as RingIcon,
  Watch,
  CircleDot,
  Link,
  Gem,
  Medal,
  Square,
  PlusCircle,
  Pencil,
  Trash2,
  Search,
  Box,
  RefreshCw,
  Warehouse,
  PackageOpen,
} from "lucide-react";

export const EnhancedProductManager: React.FC = () => {
  const {
    products,
    loading: productsLoading,
    error: productsError,
    loadProducts,
    createProduct,
    updateProduct,
    deleteProduct,
  } = useProducts();

  const {
    bulkProducts,
    loading: bulkLoading,
    error: bulkError,
    loadBulkProducts,
    createBulkProduct,
    updateBulkProduct,
    deleteBulkProduct,
  } = useBulkProducts();

  const [activeTab, setActiveTab] = useState<"individual" | "bulk">(
    "individual"
  );
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingBulkProduct, setEditingBulkProduct] =
    useState<BulkProduct | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterMetal, setFilterMetal] = useState<string>("all");
  const [savingProduct, setSavingProduct] = useState(false);

  // Individual product form data
  const [formData, setFormData] = useState({
    name: "",
    category: "ring" as Product["category"],
    metal: "gold" as Product["metal"],
    purity: "",
    weight: "",
    stoneWeight: "",
    makingCharges: "",
    description: "",
    imageUrl: "",
  });

  // Bulk product form data
  const [bulkFormData, setBulkFormData] = useState({
    name: "",
    category: "ring" as BulkProduct["category"],
    metal: "gold" as BulkProduct["metal"],
    purity: "",
    totalWeight: "",
    packageWeight: "",
    unitPrice: "",
    makingCharges: "",
    supplier: "",
    purchaseDate: new Date().toISOString().split("T")[0],
    batchNumber: "",
    notes: "",
  });

  const handleAddProduct = async () => {
    if (
      !formData.name ||
      !formData.purity ||
      !formData.weight ||
      !formData.makingCharges
    )
      return;

    setSavingProduct(true);
    try {
      const result = await createProduct({
        name: formData.name,
        category: formData.category,
        metal: formData.metal,
        purity: formData.purity,
        weight: parseFloat(formData.weight),
        stoneWeight: formData.stoneWeight
          ? parseFloat(formData.stoneWeight)
          : undefined,
        makingCharges: parseFloat(formData.makingCharges),
        description: formData.description,
        imageUrl: formData.imageUrl,
      });

      if (result.success) {
        resetForm();
      } else {
        alert(result.error || "Failed to create product. Please try again.");
      }
    } catch (error) {
      console.error("Failed to create product:", error);
      alert("Failed to create product. Please try again.");
    } finally {
      setSavingProduct(false);
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      category: product.category,
      metal: product.metal,
      purity: product.purity,
      weight: product.weight.toString(),
      stoneWeight: product.stoneWeight?.toString() || "",
      makingCharges: product.makingCharges.toString(),
      description: product.description,
      imageUrl: product.imageUrl || "",
    });
  };

  const handleUpdateProduct = async () => {
    if (
      !editingProduct ||
      !formData.name ||
      !formData.purity ||
      !formData.weight ||
      !formData.makingCharges
    )
      return;

    setSavingProduct(true);
    try {
      const productId = editingProduct._id || editingProduct.id!;
      const result = await updateProduct(productId, {
        name: formData.name,
        category: formData.category,
        metal: formData.metal,
        purity: formData.purity,
        weight: parseFloat(formData.weight),
        stoneWeight: formData.stoneWeight
          ? parseFloat(formData.stoneWeight)
          : undefined,
        makingCharges: parseFloat(formData.makingCharges),
        description: formData.description,
        imageUrl: formData.imageUrl,
      });

      if (result.success) {
        resetForm();
      } else {
        alert(result.error || "Failed to update product. Please try again.");
      }
    } catch (error) {
      console.error("Failed to update product:", error);
      alert("Failed to update product. Please try again.");
    } finally {
      setSavingProduct(false);
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      const productId = product._id || product.id!;
      const result = await deleteProduct(productId);
      if (!result.success) {
        alert(result.error || "Failed to delete product. Please try again.");
      }
    } catch (error) {
      console.error("Failed to delete product:", error);
      alert("Failed to delete product. Please try again.");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      category: "ring",
      metal: "gold",
      purity: "",
      weight: "",
      stoneWeight: "",
      makingCharges: "",
      description: "",
      imageUrl: "",
    });
    setEditingProduct(null);
    setShowAddForm(false);
  };

  // Bulk product functions
  const handleAddBulkProduct = async () => {
    if (
      !bulkFormData.name ||
      !bulkFormData.purity ||
      !bulkFormData.totalWeight ||
      !bulkFormData.packageWeight ||
      !bulkFormData.unitPrice ||
      !bulkFormData.makingCharges
    )
      return;

    setSavingProduct(true);
    try {
      const result = await createBulkProduct({
        name: bulkFormData.name,
        category: bulkFormData.category,
        metal: bulkFormData.metal,
        purity: bulkFormData.purity,
        totalWeight: parseFloat(bulkFormData.totalWeight),
        packageWeight: parseFloat(bulkFormData.packageWeight),
        unitPrice: parseFloat(bulkFormData.unitPrice),
        makingCharges: parseFloat(bulkFormData.makingCharges),
        supplier: bulkFormData.supplier,
        purchaseDate: bulkFormData.purchaseDate,
        batchNumber: bulkFormData.batchNumber,
        notes: bulkFormData.notes,
      });

      if (result.success) {
        resetBulkForm();
      } else {
        alert(
          result.error || "Failed to create bulk product. Please try again."
        );
      }
    } catch (error) {
      console.error("Failed to create bulk product:", error);
      alert("Failed to create bulk product. Please try again.");
    } finally {
      setSavingProduct(false);
    }
  };

  const handleEditBulkProduct = (product: BulkProduct) => {
    setEditingBulkProduct(product);
    setBulkFormData({
      name: product.name,
      category: product.category,
      metal: product.metal,
      purity: product.purity,
      totalWeight: product.totalWeight.toString(),
      packageWeight: product.packageWeight.toString(),
      unitPrice: product.unitPrice.toString(),
      makingCharges: product.makingCharges.toString(),
      supplier: product.supplier || "",
      purchaseDate: product.purchaseDate.split("T")[0],
      batchNumber: product.batchNumber || "",
      notes: product.notes || "",
    });
  };

  const handleUpdateBulkProduct = async () => {
    if (!editingBulkProduct) return;

    setSavingProduct(true);
    try {
      const productId = editingBulkProduct._id || editingBulkProduct.id!;
      const result = await updateBulkProduct(productId, {
        name: bulkFormData.name,
        category: bulkFormData.category,
        metal: bulkFormData.metal,
        purity: bulkFormData.purity,
        totalWeight: parseFloat(bulkFormData.totalWeight),
        remainingWeight: editingBulkProduct.remainingWeight, // Keep existing remaining weight
        packageWeight: parseFloat(bulkFormData.packageWeight),
        unitPrice: parseFloat(bulkFormData.unitPrice),
        makingCharges: parseFloat(bulkFormData.makingCharges),
        supplier: bulkFormData.supplier,
        purchaseDate: bulkFormData.purchaseDate,
        batchNumber: bulkFormData.batchNumber,
        notes: bulkFormData.notes,
      });

      if (result.success) {
        resetBulkForm();
      } else {
        alert(
          result.error || "Failed to update bulk product. Please try again."
        );
      }
    } catch (error) {
      console.error("Failed to update bulk product:", error);
      alert("Failed to update bulk product. Please try again.");
    } finally {
      setSavingProduct(false);
    }
  };

  const handleDeleteBulkProduct = async (product: BulkProduct) => {
    if (!confirm("Are you sure you want to delete this bulk product?")) return;

    try {
      const productId = product._id || product.id!;
      const result = await deleteBulkProduct(productId);
      if (!result.success) {
        alert(
          result.error || "Failed to delete bulk product. Please try again."
        );
      }
    } catch (error) {
      console.error("Failed to delete bulk product:", error);
      alert("Failed to delete bulk product. Please try again.");
    }
  };

  const resetBulkForm = () => {
    setBulkFormData({
      name: "",
      category: "ring",
      metal: "gold",
      purity: "",
      totalWeight: "",
      packageWeight: "",
      unitPrice: "",
      makingCharges: "",
      supplier: "",
      purchaseDate: new Date().toISOString().split("T")[0],
      batchNumber: "",
      notes: "",
    });
    setEditingBulkProduct(null);
    setShowAddForm(false);
  };

  // Filter products
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.slug.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      filterCategory === "all" || product.category === filterCategory;
    const matchesMetal = filterMetal === "all" || product.metal === filterMetal;

    return matchesSearch && matchesCategory && matchesMetal;
  });

  const categories = [
    "ring",
    "necklace",
    "bracelet",
    "earring",
    "pendant",
    "chain",
    "other",
  ];
  const metals = ["gold", "silver", "platinum"];

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "ring":
        return <RingIcon className="w-5 h-5" />;
      case "necklace":
        return <Gem className="w-5 h-5" />;
      case "bracelet":
        return <Watch className="w-5 h-5" />;
      case "earring":
        return <CircleDot className="w-5 h-5" />;
      case "pendant":
        return <Gem className="w-5 h-5" />;
      case "chain":
        return <Link className="w-5 h-5" />;
      default:
        return <Gem className="w-5 h-5" />;
    }
  };

  const getMetalIcon = (metal: string) => {
    switch (metal) {
      case "gold":
        return <Medal className="w-5 h-5 text-yellow-500" />;
      case "silver":
        return <Medal className="w-5 h-5 text-gray-400" />;
      case "platinum":
        return <Medal className="w-5 h-5 text-gray-300" />;
      default:
        return <Square className="w-5 h-5" />;
    }
  };

  // Handle Excel import
  const handleExcelImport = async (importedProducts: Product[]) => {
    console.log("Excel import not yet implemented for MongoDB backend");
    alert("Excel import feature will be implemented soon for MongoDB backend");
  };

  const isDialogOpen = showAddForm || editingProduct;

  const loading = productsLoading || bulkLoading;
  const error = productsError || bulkError;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <Package className="w-6 h-6" />
            Product & Bulk Inventory Management
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-1">
            Manage individual products and bulk inventory with MongoDB backend
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => {
              loadProducts();
              loadBulkProducts();
            }}
            disabled={loading}
            variant="secondary"
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            Add {activeTab === "individual" ? "Product" : "Bulk Inventory"}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Card className="p-1">
        <div className="flex space-x-1">
          <button
            onClick={() => setActiveTab("individual")}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === "individual"
                ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            <Package className="w-4 h-4 inline mr-2" />
            Individual Products ({products.length})
          </button>
          <button
            onClick={() => setActiveTab("bulk")}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === "bulk"
                ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            <Warehouse className="w-4 h-4 inline mr-2" />
            Bulk Inventory ({bulkProducts.length})
          </button>
        </div>
      </Card>

      {/* Loading State */}
      {loading && (
        <Card className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-zinc-600 dark:text-zinc-400">
            Loading {activeTab} data from database...
          </p>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card className="p-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700">
          <p className="text-red-800 dark:text-red-300">Error: {error}</p>
        </Card>
      )}

      {/* Bulk Inventory Tab */}
      {activeTab === "bulk" && !loading && (
        <>
          {/* Bulk Products Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bulkProducts.map((product) => (
              <Card
                key={product._id || product.id}
                className="p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    <Warehouse className="w-5 h-5 text-green-600" />
                    <span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300 px-2 py-1 rounded">
                      Bulk
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEditBulkProduct(product)}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 p-1"
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteBulkProduct(product)}
                      className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 p-1"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className="font-semibold text-zinc-900 dark:text-white mb-2">
                  {product.name}
                </h3>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-500 dark:text-zinc-400">
                      Category:
                    </span>
                    <span className="font-medium capitalize">
                      {product.category}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500 dark:text-zinc-400">
                      Metal:
                    </span>
                    <span className="font-medium capitalize">
                      {product.metal} {product.purity}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500 dark:text-zinc-400">
                      Total Weight:
                    </span>
                    <span className="font-medium">{product.totalWeight}g</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500 dark:text-zinc-400">
                      Remaining:
                    </span>
                    <span className="font-medium text-green-600">
                      {product.remainingWeight}g
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500 dark:text-zinc-400">
                      Package Weight:
                    </span>
                    <span className="font-medium">
                      {product.packageWeight}g
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500 dark:text-zinc-400">
                      Unit Price:
                    </span>
                    <span className="font-medium">₹{product.unitPrice}/g</span>
                  </div>
                  {product.supplier && (
                    <div className="flex justify-between">
                      <span className="text-zinc-500 dark:text-zinc-400">
                        Supplier:
                      </span>
                      <span className="font-medium">{product.supplier}</span>
                    </div>
                  )}
                </div>

                {/* Stock Level Indicator */}
                <div className="mt-4">
                  <div className="flex justify-between text-xs mb-1">
                    <span>Stock Level</span>
                    <span>
                      {Math.round(
                        (product.remainingWeight / product.totalWeight) * 100
                      )}
                      %
                    </span>
                  </div>
                  <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        product.remainingWeight / product.totalWeight > 0.5
                          ? "bg-green-500"
                          : product.remainingWeight / product.totalWeight > 0.2
                          ? "bg-yellow-500"
                          : "bg-red-500"
                      }`}
                      style={{
                        width: `${
                          (product.remainingWeight / product.totalWeight) * 100
                        }%`,
                      }}
                    ></div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-700">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Purchased:{" "}
                    {new Date(product.purchaseDate).toLocaleDateString()}
                  </p>
                </div>
              </Card>
            ))}
          </div>

          {/* Bulk Add Form Dialog */}
          <Dialog
            open={showAddForm && activeTab === "bulk"}
            onOpenChange={(open: boolean) => {
              if (!open) resetBulkForm();
            }}
          >
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingBulkProduct
                    ? "Edit Bulk Product"
                    : "Add Bulk Inventory"}
                </DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Product Name *
                  </label>
                  <Input
                    value={bulkFormData.name}
                    onChange={(e) =>
                      setBulkFormData({ ...bulkFormData, name: e.target.value })
                    }
                    placeholder="Gold Ring Bulk"
                    disabled={savingProduct}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Category *
                  </label>
                  <select
                    value={bulkFormData.category}
                    onChange={(e) =>
                      setBulkFormData({
                        ...bulkFormData,
                        category: e.target.value as BulkProduct["category"],
                      })
                    }
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Total Weight (grams) *
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={bulkFormData.totalWeight}
                    onChange={(e) =>
                      setBulkFormData({
                        ...bulkFormData,
                        totalWeight: e.target.value,
                      })
                    }
                    placeholder="1000.00"
                    disabled={savingProduct}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Package Weight (grams) *
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={bulkFormData.packageWeight}
                    onChange={(e) =>
                      setBulkFormData({
                        ...bulkFormData,
                        packageWeight: e.target.value,
                      })
                    }
                    placeholder="5.00"
                    disabled={savingProduct}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Unit Price (₹/gram) *
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={bulkFormData.unitPrice}
                    onChange={(e) =>
                      setBulkFormData({
                        ...bulkFormData,
                        unitPrice: e.target.value,
                      })
                    }
                    placeholder="5000.00"
                    disabled={savingProduct}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Supplier
                  </label>
                  <Input
                    value={bulkFormData.supplier}
                    onChange={(e) =>
                      setBulkFormData({
                        ...bulkFormData,
                        supplier: e.target.value,
                      })
                    }
                    placeholder="Supplier Name"
                    disabled={savingProduct}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Purchase Date *
                  </label>
                  <Input
                    type="date"
                    value={bulkFormData.purchaseDate}
                    onChange={(e) =>
                      setBulkFormData({
                        ...bulkFormData,
                        purchaseDate: e.target.value,
                      })
                    }
                    disabled={savingProduct}
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button
                  onClick={
                    editingBulkProduct
                      ? handleUpdateBulkProduct
                      : handleAddBulkProduct
                  }
                  disabled={
                    !bulkFormData.name ||
                    !bulkFormData.totalWeight ||
                    !bulkFormData.packageWeight ||
                    !bulkFormData.unitPrice ||
                    savingProduct
                  }
                >
                  {savingProduct ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      {editingBulkProduct ? "Updating..." : "Adding..."}
                    </>
                  ) : editingBulkProduct ? (
                    "Update Bulk Product"
                  ) : (
                    "Add Bulk Product"
                  )}
                </Button>
                <Button
                  onClick={resetBulkForm}
                  variant="secondary"
                  disabled={savingProduct}
                >
                  Cancel
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}

      {/* Individual Products Tab - existing code remains the same */}
      {activeTab === "individual" && !loading && (
        <>
          {/* Search and Filters */}
          <Card className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Input
                    placeholder="Search by name, description, serial number, or slug..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10"
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
                </div>
              </div>
              <div>
                <div className="relative">
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="w-full px-3 py-2 pl-10 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                  >
                    <option value="all">All Categories</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </option>
                    ))}
                  </select>
                  <Gem className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
                </div>
              </div>
              <div>
                <div className="relative">
                  <select
                    value={filterMetal}
                    onChange={(e) => setFilterMetal(e.target.value)}
                    className="w-full px-3 py-2 pl-10 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                  >
                    <option value="all">All Metals</option>
                    {metals.map((metal) => (
                      <option key={metal} value={metal}>
                        {metal.charAt(0).toUpperCase() + metal.slice(1)}
                      </option>
                    ))}
                  </select>
                  <Medal className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
                </div>
              </div>
            </div>
          </Card>

          {/* Add/Edit Form Dialog */}
          <Dialog
            open={showAddForm && activeTab === "individual"}
            onOpenChange={(open: boolean) => {
              if (!open) resetForm();
            }}
          >
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingProduct ? "Edit Product" : "Add New Product"}
                </DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Product Name *
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Gold Ring with Diamond"
                    disabled={savingProduct}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        category: e.target.value as Product["category"],
                      })
                    }
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Metal *
                  </label>
                  <select
                    value={formData.metal}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        metal: e.target.value as Product["metal"],
                      })
                    }
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                  >
                    {metals.map((metal) => (
                      <option key={metal} value={metal}>
                        {metal.charAt(0).toUpperCase() + metal.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Purity *
                  </label>
                  <Input
                    value={formData.purity}
                    onChange={(e) =>
                      setFormData({ ...formData, purity: e.target.value })
                    }
                    placeholder="22K, 925, PT950"
                    disabled={savingProduct}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Weight (grams) *
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.weight}
                    onChange={(e) =>
                      setFormData({ ...formData, weight: e.target.value })
                    }
                    placeholder="0.00"
                    disabled={savingProduct}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Stone Weight (grams)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.stoneWeight}
                    onChange={(e) =>
                      setFormData({ ...formData, stoneWeight: e.target.value })
                    }
                    placeholder="0.00"
                    disabled={savingProduct}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Making Charges (₹) *
                  </label>
                  <Input
                    type="number"
                    value={formData.makingCharges}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        makingCharges: e.target.value,
                      })
                    }
                    placeholder="0"
                    disabled={savingProduct}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Image URL
                  </label>
                  <Input
                    value={formData.imageUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, imageUrl: e.target.value })
                    }
                    placeholder="https://..."
                    disabled={savingProduct}
                  />
                </div>
                <div className="md:col-span-2 lg:col-span-1">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Product description..."
                    rows={3}
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                    disabled={savingProduct}
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button
                  onClick={
                    editingProduct ? handleUpdateProduct : handleAddProduct
                  }
                  disabled={
                    !formData.name ||
                    !formData.purity ||
                    !formData.weight ||
                    !formData.makingCharges ||
                    savingProduct
                  }
                >
                  {savingProduct ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      {editingProduct ? "Updating..." : "Adding..."}
                    </>
                  ) : editingProduct ? (
                    "Update Product"
                  ) : (
                    "Add Product"
                  )}
                </Button>
                <Button
                  onClick={resetForm}
                  variant="secondary"
                  disabled={savingProduct}
                >
                  Cancel
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Products Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <Card
                key={product._id || product.id}
                className="p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-700 dark:text-zinc-300">
                      {getCategoryIcon(product.category)}
                    </span>
                    <span>{getMetalIcon(product.metal)}</span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEditProduct(product)}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 p-1"
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product)}
                      className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 p-1"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {product.imageUrl && (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-32 object-cover rounded-lg mb-3"
                  />
                )}

                <h3 className="font-semibold text-zinc-900 dark:text-white mb-2">
                  {product.name}
                </h3>
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 text-xs rounded-full font-medium">
                    #{product.serialNumber}
                  </span>
                  <span className="px-2 py-1 bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs rounded-full font-mono">
                    {product.slug}
                  </span>
                </div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">
                  {product.description}
                </p>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-500 dark:text-zinc-400">
                      Serial Number:
                    </span>
                    <span className="font-medium font-mono text-blue-600 dark:text-blue-400">
                      {product.serialNumber}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500 dark:text-zinc-400">
                      Category:
                    </span>
                    <span className="font-medium capitalize">
                      {product.category}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500 dark:text-zinc-400">
                      Metal:
                    </span>
                    <span className="font-medium capitalize">
                      {product.metal} {product.purity}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500 dark:text-zinc-400">
                      Weight:
                    </span>
                    <span className="font-medium">{product.weight}g</span>
                  </div>
                  {product.stoneWeight && (
                    <div className="flex justify-between">
                      <span className="text-zinc-500 dark:text-zinc-400">
                        Stone Weight:
                      </span>
                      <span className="font-medium">
                        {product.stoneWeight}g
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-zinc-500 dark:text-zinc-400">
                      Making Charges:
                    </span>
                    <span className="font-medium">
                      ₹{product.makingCharges.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-700">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Created: {new Date(product.createdAt).toLocaleDateString()}
                  </p>
                  {product.updatedAt !== product.createdAt && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Updated:{" "}
                      {new Date(product.updatedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </Card>
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <Card className="p-8 text-center">
              <div className="flex justify-center mb-4">
                <Box className="h-12 w-12 text-zinc-400" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
                No products found
              </h3>
              <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                {products.length === 0
                  ? "Start by adding your first product to the inventory."
                  : "Try adjusting your search or filter criteria."}
              </p>
              {products.length === 0 && (
                <Button
                  onClick={() => setShowAddForm(true)}
                  className="flex items-center gap-2 mx-auto"
                >
                  <PlusCircle className="w-4 h-4" />
                  Add Your First Product
                </Button>
              )}
            </Card>
          )}

          {/* Summary */}
          {products.length > 0 && (
            <Card className="p-4">
              <div className="flex flex-wrap gap-4 justify-center text-sm">
                <div className="text-center">
                  <p className="font-semibold text-zinc-900 dark:text-white">
                    {products.length}
                  </p>
                  <p className="text-zinc-600 dark:text-zinc-400">
                    Total Products
                  </p>
                </div>
                <div className="text-center">
                  <p className="font-semibold text-zinc-900 dark:text-white">
                    {filteredProducts.length}
                  </p>
                  <p className="text-zinc-600 dark:text-zinc-400">Showing</p>
                </div>
                <div className="text-center">
                  <p className="font-semibold text-zinc-900 dark:text-white">
                    {products.reduce((sum, p) => sum + p.weight, 0).toFixed(2)}g
                  </p>
                  <p className="text-zinc-600 dark:text-zinc-400">
                    Total Weight
                  </p>
                </div>
              </div>
            </Card>
          )}
        </>
      )}

      {/* Empty State for Bulk */}
      {activeTab === "bulk" && !loading && bulkProducts.length === 0 && (
        <Card className="p-8 text-center">
          <div className="flex justify-center mb-4">
            <Warehouse className="h-12 w-12 text-zinc-400" />
          </div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
            No bulk inventory found
          </h3>
          <p className="text-zinc-600 dark:text-zinc-400 mb-4">
            Start by adding your first bulk inventory purchase.
          </p>
          <Button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 mx-auto"
          >
            <PlusCircle className="w-4 h-4" />
            Add Your First Bulk Inventory
          </Button>
        </Card>
      )}
    </div>
  );
};
