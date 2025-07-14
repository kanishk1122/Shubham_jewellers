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
} from "@/components/ui";
import ExcelActions from "@/components/ExcelActions";
import {
  Package,
  Circle as RingIcon, // Using Circle as a placeholder for Ring
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
  Box
} from "lucide-react";

interface Product {
  id: string;
  serialNumber: string;
  slug: string;
  name: string;
  category:
    | "ring"
    | "necklace"
    | "bracelet"
    | "earring"
    | "pendant"
    | "chain"
    | "other";
  metal: "gold" | "silver" | "platinum";
  purity: string;
  weight: number;
  stoneWeight?: number;
  makingCharges: number;
  description: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export const EnhancedProductManager: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterMetal, setFilterMetal] = useState<string>("all");
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

  // Load products from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("products");
    if (saved) {
      try {
        const parsedProducts = JSON.parse(saved);
        const migratedProducts = migrateExistingProducts(parsedProducts);
        setProducts(migratedProducts);

        // Save migrated products back if any changes were made
        const needsMigration = parsedProducts.some(
          (p: any) => !p.serialNumber || !p.slug
        );
        if (needsMigration) {
          localStorage.setItem("products", JSON.stringify(migratedProducts));
        }
      } catch (error) {
        console.error("Failed to parse saved products:", error);
      }
    }
  }, []);

  // Save products to localStorage
  const saveProducts = (newProducts: Product[]) => {
    setProducts(newProducts);
    localStorage.setItem("products", JSON.stringify(newProducts));
  };

  // Generate slug from product name
  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "") // Remove special characters
      .replace(/[\s_-]+/g, "-") // Replace spaces and underscores with hyphens
      .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
  };

  // Generate serial number (simple incremental: 1, 2, 3, etc.)
  const generateSerialNumber = (): string => {
    // Get the highest existing serial number and increment by 1
    const existingSerialNumbers = products
      .map((p) => parseInt(p.serialNumber))
      .filter((num) => !isNaN(num));

    const nextNumber =
      existingSerialNumbers.length > 0
        ? Math.max(...existingSerialNumbers) + 1
        : 1;

    return nextNumber.toString();
  };

  // Generate unique ID
  const generateUniqueId = (): string => {
    return `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const handleAddProduct = () => {
    if (
      !formData.name ||
      !formData.purity ||
      !formData.weight ||
      !formData.makingCharges
    )
      return;

    const productSlug = generateSlug(formData.name);
    const serialNumber = generateSerialNumber();
    const productId = generateUniqueId();

    const newProduct: Product = {
      id: productId,
      serialNumber: serialNumber,
      slug: productSlug,
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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveProducts([...products, newProduct]);
    resetForm();
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

  const handleUpdateProduct = () => {
    if (
      !editingProduct ||
      !formData.name ||
      !formData.purity ||
      !formData.weight ||
      !formData.makingCharges
    )
      return;

    const updatedSlug = generateSlug(formData.name);

    const updatedProducts = products.map((product) =>
      product.id === editingProduct.id
        ? {
            ...product,
            name: formData.name,
            slug: updatedSlug,
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
            updatedAt: new Date().toISOString(),
          }
        : product
    );

    saveProducts(updatedProducts);
    resetForm();
  };

  const handleDeleteProduct = (id: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      saveProducts(products.filter((product) => product.id !== id));
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

  // Filter products
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.id.toLowerCase().includes(searchTerm.toLowerCase());
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
        return <Gem className="w-5 h-5" />; // Using Gem as fallback for Necklace
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

  // Migration function for existing products
  const migrateExistingProducts = (existingProducts: any[]): Product[] => {
    return existingProducts.map((product, index) => {
      // If product already has serialNumber and slug, return as is
      if (product.serialNumber && product.slug) {
        return product as Product;
      }

      // Otherwise, generate them
      const productSlug = generateSlug(product.name);
      // Use simple incremental serial numbers: 1, 2, 3, etc.
      const serialNumber = (index + 1).toString();

      return {
        ...product,
        serialNumber,
        slug: productSlug,
        id: product.id || generateUniqueId(),
      } as Product;
    });
  };

  // Handle Excel import
  const handleExcelImport = (importedProducts: Product[]) => {
    const mergedProducts = [...products];
    let addedCount = 0;
    let updatedCount = 0;

    importedProducts.forEach((importedProduct) => {
      const existingIndex = mergedProducts.findIndex(
        (p) =>
          p.serialNumber === importedProduct.serialNumber ||
          p.id === importedProduct.id
      );

      if (existingIndex >= 0) {
        // Update existing product
        mergedProducts[existingIndex] = {
          ...mergedProducts[existingIndex],
          ...importedProduct,
          updatedAt: new Date().toISOString(),
        };
        updatedCount++;
      } else {
        // Add new product with proper serial number if missing
        const newProduct = {
          ...importedProduct,
          id: importedProduct.id || generateUniqueId(),
          serialNumber: importedProduct.serialNumber || generateSerialNumber(),
          slug: importedProduct.slug || generateSlug(importedProduct.name),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        mergedProducts.push(newProduct);
        addedCount++;
      }
    });

    saveProducts(mergedProducts);
    alert(
      `Import completed!\nAdded: ${addedCount} products\nUpdated: ${updatedCount} products`
    );
  };

  // Dialog open state is controlled by showAddForm or editingProduct
  const isDialogOpen = showAddForm || editingProduct;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <Package className="w-6 h-6" />
            Product Management
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-1">
            Manage your jewelry inventory with automatic serial numbers
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ExcelActions
            type="products"
            data={products}
            onImport={handleExcelImport}
            onExport={() => console.log("Products exported")}
          />
          <Button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            Add New Product
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Input
                placeholder="Search by name, description, serial number, slug, or ID..."
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
        open={!!isDialogOpen}
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
                  setFormData({ ...formData, makingCharges: e.target.value })
                }
                placeholder="0"
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
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button
              onClick={editingProduct ? handleUpdateProduct : handleAddProduct}
              disabled={
                !formData.name ||
                !formData.purity ||
                !formData.weight ||
                !formData.makingCharges
              }
            >
              {editingProduct ? "Update Product" : "Add Product"}
            </Button>
            <Button onClick={resetForm} variant="secondary">
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product) => (
          <Card
            key={product.id}
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
                  onClick={() => handleDeleteProduct(product.id)}
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
                  Product ID:
                </span>
                <span className="font-medium font-mono text-zinc-600 dark:text-zinc-400 text-xs">
                  {product.id}
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
                <span className="text-zinc-500 dark:text-zinc-400">Metal:</span>
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
                  <span className="font-medium">{product.stoneWeight}g</span>
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
                  Updated: {new Date(product.updatedAt).toLocaleDateString()}
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
              <p className="text-zinc-600 dark:text-zinc-400">Total Products</p>
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
              <p className="text-zinc-600 dark:text-zinc-400">Total Weight</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
