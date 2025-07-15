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
import { useCategories, type Category } from "@/hooks/useCategories";
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
  Settings,
  Plus,
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

  const {
    categories,
    loading: categoriesLoading,
    error: categoriesError,
    loadCategories,
    createCategory,
    updateCategory,
    deleteCategory,
  } = useCategories();

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
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [savingCategory, setSavingCategory] = useState(false);

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
    makingCharges: "",
    supplier: "",
    purchaseDate: new Date().toISOString().split("T")[0],
    batchNumber: "",
    notes: "",
  });

  // Category form data
  const [categoryFormData, setCategoryFormData] = useState({
    name: "",
    description: "",
    icon: "",
    color: "#3B82F6",
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
      makingCharges: "",
      supplier: "",
      purchaseDate: new Date().toISOString().split("T")[0],
      batchNumber: "",
      notes: "",
    });
    setEditingBulkProduct(null);
    setShowAddForm(false);
  };

  // Category management functions
  const handleAddCategory = async () => {
    if (!categoryFormData.name) return;

    setSavingCategory(true);
    try {
      const result = await createCategory({
        name: categoryFormData.name,
        description: categoryFormData.description,
        icon: categoryFormData.icon,
        color: categoryFormData.color,
        isActive: true,
      });

      if (result.success) {
        resetCategoryForm();
      } else {
        alert(result.error || "Failed to create category. Please try again.");
      }
    } catch (error) {
      console.error("Failed to create category:", error);
      alert("Failed to create category. Please try again.");
    } finally {
      setSavingCategory(false);
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryFormData({
      name: category.name,
      description: category.description || "",
      icon: category.icon || "",
      color: category.color || "#3B82F6",
    });
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory || !categoryFormData.name) return;

    setSavingCategory(true);
    try {
      const categoryId = editingCategory._id || editingCategory.id!;
      const result = await updateCategory(categoryId, {
        name: categoryFormData.name,
        description: categoryFormData.description,
        icon: categoryFormData.icon,
        color: categoryFormData.color,
      });

      if (result.success) {
        resetCategoryForm();
      } else {
        alert(result.error || "Failed to update category. Please try again.");
      }
    } catch (error) {
      console.error("Failed to update category:", error);
      alert("Failed to update category. Please try again.");
    } finally {
      setSavingCategory(false);
    }
  };

  const handleDeleteCategory = async (category: Category) => {
    if (!confirm("Are you sure you want to delete this category?")) return;

    try {
      const categoryId = category._id || category.id!;
      const result = await deleteCategory(categoryId);
      if (!result.success) {
        alert(result.error || "Failed to delete category. Please try again.");
      }
    } catch (error) {
      console.error("Failed to delete category:", error);
      alert("Failed to delete category. Please try again.");
    }
  };

  const resetCategoryForm = () => {
    setCategoryFormData({
      name: "",
      description: "",
      icon: "",
      color: "#3B82F6",
    });
    setEditingCategory(null);
    setShowAddCategory(false);
  };

  // Get category icon by type for dropdown
  const getCategoryIconByType = (iconType: string) => {
    switch (iconType) {
      case "ring":
        return <RingIcon className="w-4 h-4" />;
      case "gem":
        return <Gem className="w-4 h-4" />;
      case "necklace":
        return (
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24" />
          </svg>
        );
      case "watch":
        return <Watch className="w-4 h-4" />;
      case "earring":
        return <CircleDot className="w-4 h-4" />;
      case "pendant":
        return (
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path d="M10 2v20M14 2v20M4 7l8-5 8 5M6 20h12" />
          </svg>
        );
      case "chain":
        return <Link className="w-4 h-4" />;
      case "crown":
        return (
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path d="M6 3h12l4 6-10 13L2 9z" />
            <path d="m6 3 6 6 6-6" />
          </svg>
        );
      case "coin":
        return (
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <path d="M12 17h.01" />
          </svg>
        );
      case "star":
        return (
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
          </svg>
        );
      case "heart":
        return (
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        );
      case "circle":
        return (
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <circle cx="12" cy="12" r="10" />
          </svg>
        );
      case "square":
        return <Square className="w-4 h-4" />;
      case "other":
        return <Package className="w-4 h-4" />;
      default:
        return <Gem className="w-4 h-4" />;
    }
  };

  // Get category icon dynamically (updated to handle new icon types)
  const getCategoryIcon = (categorySlug: string) => {
    const category = categories.find((c) => c.slug === categorySlug);
    if (category?.icon) {
      return getCategoryIconByType(category.icon);
    }

    // Fallback to default icons based on slug
    switch (categorySlug) {
      case "ring":
      case "rings":
        return <RingIcon className="w-5 h-5" />;
      case "necklace":
      case "necklaces":
        return <Gem className="w-5 h-5" />;
      case "bracelet":
      case "bracelets":
        return <Watch className="w-5 h-5" />;
      case "earring":
      case "earrings":
        return <CircleDot className="w-5 h-5" />;
      case "pendant":
      case "pendants":
        return <Gem className="w-5 h-5" />;
      case "chain":
      case "chains":
        return <Link className="w-5 h-5" />;
      default:
        return <Gem className="w-5 h-5" />;
    }
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

  // Handle Excel import
  const handleExcelImport = async (importedProducts: Product[]) => {
    console.log("Excel import not yet implemented for MongoDB backend");
    alert("Excel import feature will be implemented soon for MongoDB backend");
  };

  const metals = ["gold", "silver", "platinum"];

  const loading = productsLoading || bulkLoading || categoriesLoading;
  const error = productsError || bulkError || categoriesError;

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
            Manage individual products, bulk inventory, and categories with
            MongoDB backend
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => setShowCategoryManager(true)}
            variant="secondary"
            size="sm"
            className="flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Manage Categories
          </Button>
          <Button
            onClick={() => {
              loadProducts();
              loadBulkProducts();
              loadCategories();
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

      {/* Category Manager Dialog */}
      <Dialog
        open={showCategoryManager}
        onOpenChange={(open: boolean) => {
          if (!open) {
            setShowCategoryManager(false);
            resetCategoryForm();
          }
        }}
      >
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Category Management
            </DialogTitle>
          </DialogHeader>

          {/* Add Category Button */}
          <div className="flex justify-end mb-4">
            <Button
              onClick={() => setShowAddCategory(true)}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Category
            </Button>
          </div>

          {/* Categories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
            {categories.map((category) => (
              <Card
                key={category._id || category.id}
                className="p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    {category.icon ? (
                      <span style={{ color: category.color }}>
                        {getCategoryIconByType(category.icon)}
                      </span>
                    ) : (
                      <Gem
                        className="w-5 h-5"
                        style={{ color: category.color }}
                      />
                    )}
                    <span
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: category.color }}
                    ></span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEditCategory(category)}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 p-1"
                      title="Edit"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category)}
                      className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 p-1"
                      title="Delete"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <h4 className="font-semibold text-zinc-900 dark:text-white">
                  {category.name}
                </h4>
                {category.description && (
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                    {category.description}
                  </p>
                )}
                <div className="mt-2 flex justify-between text-xs text-zinc-500">
                  <span>{category.productCount} products</span>
                  <span>{category.slug}</span>
                </div>
              </Card>
            ))}
          </div>

          {/* Add/Edit Category Form */}
          {(showAddCategory || editingCategory) && (
            <div className="mt-6 p-4 border-t border-zinc-200 dark:border-zinc-600">
              <h4 className="text-lg font-semibold mb-4">
                {editingCategory ? "Edit Category" : "Add New Category"}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Category Name *
                  </label>
                  <Input
                    value={categoryFormData.name}
                    onChange={(e) =>
                      setCategoryFormData({
                        ...categoryFormData,
                        name: e.target.value,
                      })
                    }
                    placeholder="e.g., Rings, Necklaces, Bracelets"
                    disabled={savingCategory}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Icon
                  </label>
                  <div className="relative">
                    <select
                      value={categoryFormData.icon}
                      onChange={(e) =>
                        setCategoryFormData({
                          ...categoryFormData,
                          icon: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 pl-10 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white appearance-none"
                      disabled={savingCategory}
                    >
                      <option value="">Select an icon</option>
                      <option value="ring">💍 Ring</option>
                      <option value="gem">💎 Gem/Diamond</option>
                      <option value="necklace">📿 Necklace</option>
                      <option value="watch">⌚ Watch/Bracelet</option>
                      <option value="earring">👂 Earring</option>
                      <option value="pendant">🔗 Pendant</option>
                      <option value="chain">⛓️ Chain</option>
                      <option value="crown">👑 Crown</option>
                      <option value="coin">🪙 Coin</option>
                      <option value="star">⭐ Star</option>
                      <option value="heart">💖 Heart</option>
                      <option value="circle">⭕ Circle</option>
                      <option value="square">⬜ Square</option>
                      <option value="other">📦 Other</option>
                    </select>
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      {categoryFormData.icon ? (
                        getCategoryIconByType(categoryFormData.icon)
                      ) : (
                        <Gem className="w-4 h-4 text-zinc-400" />
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Color
                  </label>
                  <Input
                    type="color"
                    value={categoryFormData.color}
                    onChange={(e) =>
                      setCategoryFormData({
                        ...categoryFormData,
                        color: e.target.value,
                      })
                    }
                    disabled={savingCategory}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Description
                  </label>
                  <Input
                    value={categoryFormData.description}
                    onChange={(e) =>
                      setCategoryFormData({
                        ...categoryFormData,
                        description: e.target.value,
                      })
                    }
                    placeholder="Category description"
                    disabled={savingCategory}
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button
                  onClick={
                    editingCategory ? handleUpdateCategory : handleAddCategory
                  }
                  disabled={!categoryFormData.name || savingCategory}
                >
                  {savingCategory ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      {editingCategory ? "Updating..." : "Adding..."}
                    </>
                  ) : editingCategory ? (
                    "Update Category"
                  ) : (
                    "Add Category"
                  )}
                </Button>
                <Button
                  onClick={resetCategoryForm}
                  variant="secondary"
                  disabled={savingCategory}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
                      Making Charges:
                    </span>
                    <span className="font-medium">
                      ₹{product.makingCharges.toLocaleString()}
                    </span>
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
                      <option
                        key={category._id || category.id}
                        value={category.slug}
                      >
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Metal *
                  </label>
                  <select
                    value={bulkFormData.metal}
                    onChange={(e) =>
                      setBulkFormData({
                        ...bulkFormData,
                        metal: e.target.value as BulkProduct["metal"],
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
                    value={bulkFormData.purity}
                    onChange={(e) =>
                      setBulkFormData({
                        ...bulkFormData,
                        purity: e.target.value,
                      })
                    }
                    placeholder="22K, 925, PT950"
                    disabled={savingProduct}
                  />
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
                    Making Charges (₹) *
                  </label>
                  <Input
                    type="number"
                    value={bulkFormData.makingCharges}
                    onChange={(e) =>
                      setBulkFormData({
                        ...bulkFormData,
                        makingCharges: e.target.value,
                      })
                    }
                    placeholder="0"
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
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Batch Number
                  </label>
                  <Input
                    value={bulkFormData.batchNumber}
                    onChange={(e) =>
                      setBulkFormData({
                        ...bulkFormData,
                        batchNumber: e.target.value,
                      })
                    }
                    placeholder="BATCH001"
                    disabled={savingProduct}
                  />
                </div>
                <div className="md:col-span-2 lg:col-span-1">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={bulkFormData.notes}
                    onChange={(e) =>
                      setBulkFormData({
                        ...bulkFormData,
                        notes: e.target.value,
                      })
                    }
                    placeholder="Additional notes..."
                    rows={3}
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
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
                    !bulkFormData.purity ||
                    !bulkFormData.totalWeight ||
                    !bulkFormData.packageWeight ||
                    !bulkFormData.makingCharges ||
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
                      <option
                        key={category._id || category.id}
                        value={category.slug}
                      >
                        {category.name}
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
                      <option
                        key={category._id || category.id}
                        value={category.slug}
                      >
                        {category.name}
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
      