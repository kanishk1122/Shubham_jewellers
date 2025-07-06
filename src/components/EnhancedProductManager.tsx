"use client";

import React, { useState, useEffect } from "react";
import { Card, Input, Button } from "@/components/ui/enhanced";

interface Product {
  id: string;
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
        setProducts(JSON.parse(saved));
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

  const handleAddProduct = () => {
    if (
      !formData.name ||
      !formData.purity ||
      !formData.weight ||
      !formData.makingCharges
    )
      return;

    const newProduct: Product = {
      id: Date.now().toString(),
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

    const updatedProducts = products.map((product) =>
      product.id === editingProduct.id
        ? {
            ...product,
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
      product.description.toLowerCase().includes(searchTerm.toLowerCase());
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
    const icons = {
      ring: "💍",
      necklace: "📿",
      bracelet: "⌚",
      earring: "👂",
      pendant: "🔸",
      chain: "🔗",
      other: "💎",
    };
    return icons[category as keyof typeof icons] || "💎";
  };

  const getMetalIcon = (metal: string) => {
    const icons = {
      gold: "🥇",
      silver: "🥈",
      platinum: "⚪",
    };
    return icons[metal as keyof typeof icons] || "💎";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Product Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your jewelry inventory with detailed specifications
          </p>
        </div>
        <Button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2"
        >
          <span>➕</span>
          Add New Product
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          <div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="all">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {getCategoryIcon(category)}{" "}
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <select
              value={filterMetal}
              onChange={(e) => setFilterMetal(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="all">All Metals</option>
              {metals.map((metal) => (
                <option key={metal} value={metal}>
                  {getMetalIcon(metal)}{" "}
                  {metal.charAt(0).toUpperCase() + metal.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Add/Edit Form */}
      {(showAddForm || editingProduct) && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {editingProduct ? "Edit Product" : "Add New Product"}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {getCategoryIcon(category)}{" "}
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                {metals.map((metal) => (
                  <option key={metal} value={metal}>
                    {getMetalIcon(metal)}{" "}
                    {metal.charAt(0).toUpperCase() + metal.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Product description..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
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
        </Card>
      )}

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product) => (
          <Card
            key={product.id}
            className="p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">
                  {getCategoryIcon(product.category)}
                </span>
                <span className="text-lg">{getMetalIcon(product.metal)}</span>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => handleEditProduct(product)}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 p-1"
                  title="Edit"
                >
                  ✏️
                </button>
                <button
                  onClick={() => handleDeleteProduct(product.id)}
                  className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 p-1"
                  title="Delete"
                >
                  🗑️
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

            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              {product.name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              {product.description}
            </p>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">
                  Category:
                </span>
                <span className="font-medium capitalize">
                  {product.category}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Metal:</span>
                <span className="font-medium capitalize">
                  {product.metal} {product.purity}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">
                  Weight:
                </span>
                <span className="font-medium">{product.weight}g</span>
              </div>
              {product.stoneWeight && (
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">
                    Stone Weight:
                  </span>
                  <span className="font-medium">{product.stoneWeight}g</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">
                  Making Charges:
                </span>
                <span className="font-medium">
                  ₹{product.makingCharges.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Created: {new Date(product.createdAt).toLocaleDateString()}
              </p>
              {product.updatedAt !== product.createdAt && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Updated: {new Date(product.updatedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          </Card>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <Card className="p-8 text-center">
          <div className="text-4xl mb-4">📦</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No products found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {products.length === 0
              ? "Start by adding your first product to the inventory."
              : "Try adjusting your search or filter criteria."}
          </p>
          {products.length === 0 && (
            <Button onClick={() => setShowAddForm(true)}>
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
              <p className="font-semibold text-gray-900 dark:text-white">
                {products.length}
              </p>
              <p className="text-gray-600 dark:text-gray-400">Total Products</p>
            </div>
            <div className="text-center">
              <p className="font-semibold text-gray-900 dark:text-white">
                {filteredProducts.length}
              </p>
              <p className="text-gray-600 dark:text-gray-400">Showing</p>
            </div>
            <div className="text-center">
              <p className="font-semibold text-gray-900 dark:text-white">
                {products.reduce((sum, p) => sum + p.weight, 0).toFixed(2)}g
              </p>
              <p className="text-gray-600 dark:text-gray-400">Total Weight</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
