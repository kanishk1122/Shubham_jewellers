import React, { useState } from "react";
import { Product, ProductCategory, Material, StoneType } from "@/types/billing";
import { useProducts } from "@/hooks/useBilling";
import { Button, Input, Select, Textarea, Modal, Card } from "@/components/ui";
import { MAKING_CHARGES, WASTAGE_RATES } from "@/utils/billing";

interface ProductFormProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product;
  onSave: (product: Product) => void;
}

export const ProductForm: React.FC<ProductFormProps> = ({
  isOpen,
  onClose,
  product,
  onSave,
}) => {
  const [formData, setFormData] = useState<Partial<Product>>(
    product || {
      name: "",
      category: ProductCategory.RING,
      material: Material.GOLD,
      weight: 0,
      purity: "22K",
      makingCharges: 8,
      wastage: 2,
      basePrice: 6500,
      description: "",
      hsn: "7113",
      stoneDetails: [],
    }
  );

  const [stoneForm, setStoneForm] = useState({
    type: StoneType.DIAMOND,
    count: 1,
    weight: 0.1,
    quality: "VS1",
    pricePerCarat: 50000,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.weight && formData.basePrice) {
      onSave(formData as Product);
      onClose();
    }
  };

  const addStone = () => {
    setFormData((prev) => ({
      ...prev,
      stoneDetails: [...(prev.stoneDetails || []), { ...stoneForm }],
    }));
    setStoneForm({
      type: StoneType.DIAMOND,
      count: 1,
      weight: 0.1,
      quality: "VS1",
      pricePerCarat: 50000,
    });
  };

  const removeStone = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      stoneDetails: (prev.stoneDetails || []).filter((_, i) => i !== index),
    }));
  };

  const categoryOptions = Object.values(ProductCategory).map((cat) => ({
    value: cat,
    label: cat,
  }));

  const materialOptions = Object.values(Material).map((mat) => ({
    value: mat,
    label: mat,
  }));

  const stoneTypeOptions = Object.values(StoneType).map((stone) => ({
    value: stone,
    label: stone,
  }));

  const purityOptions = [
    { value: "24K", label: "24K (99.9%)" },
    { value: "22K", label: "22K (91.6%)" },
    { value: "21K", label: "21K (87.5%)" },
    { value: "20K", label: "20K (83.3%)" },
    { value: "18K", label: "18K (75.0%)" },
    { value: "925", label: "925 Sterling Silver" },
    { value: "999", label: "999 Pure Silver" },
    { value: "PT950", label: "PT950 Platinum" },
    { value: "PT900", label: "PT900 Platinum" },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={product ? "Edit Product" : "Add New Product"}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Product Name"
            value={formData.name}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, name: e.target.value }))
            }
            required
          />

          <Select
            label="Category"
            value={formData.category}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                category: e.target.value as ProductCategory,
              }))
            }
            options={categoryOptions}
          />

          <Select
            label="Material"
            value={formData.material}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                material: e.target.value as Material,
              }))
            }
            options={materialOptions}
          />

          <Select
            label="Purity"
            value={formData.purity}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, purity: e.target.value }))
            }
            options={purityOptions}
          />

          <Input
            label="Weight (grams)"
            type="number"
            step="0.01"
            value={formData.weight}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                weight: parseFloat(e.target.value) || 0,
              }))
            }
            required
          />

          <Input
            label="Base Price (per gram)"
            type="number"
            step="0.01"
            value={formData.basePrice}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                basePrice: parseFloat(e.target.value) || 0,
              }))
            }
            required
          />

          <Input
            label="Making Charges (%)"
            type="number"
            step="0.01"
            value={formData.makingCharges}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                makingCharges: parseFloat(e.target.value) || 0,
              }))
            }
          />

          <Input
            label="Wastage (%)"
            type="number"
            step="0.01"
            value={formData.wastage}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                wastage: parseFloat(e.target.value) || 0,
              }))
            }
          />

          <Input
            label="HSN Code"
            value={formData.hsn}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, hsn: e.target.value }))
            }
          />
        </div>

        <Textarea
          label="Description"
          value={formData.description}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, description: e.target.value }))
          }
          rows={3}
        />

        {/* Stone Details Section */}
        <div className="border-t pt-4">
          <h4 className="text-md font-semibold mb-3">Stone Details</h4>

          {/* Existing stones */}
          {formData.stoneDetails && formData.stoneDetails.length > 0 && (
            <div className="space-y-2 mb-4">
              {formData.stoneDetails.map((stone, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-zinc-50 p-3 rounded"
                >
                  <span className="text-sm">
                    {stone.count} {stone.type}(s) - {stone.weight} carats -{" "}
                    {stone.quality} - ₹{stone.pricePerCarat}/carat
                  </span>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => removeStone(index)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Add new stone */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-2 items-end">
            <Select
              label="Stone Type"
              value={stoneForm.type}
              onChange={(e) =>
                setStoneForm((prev) => ({
                  ...prev,
                  type: e.target.value as StoneType,
                }))
              }
              options={stoneTypeOptions}
            />

            <Input
              label="Count"
              type="number"
              value={stoneForm.count}
              onChange={(e) =>
                setStoneForm((prev) => ({
                  ...prev,
                  count: parseInt(e.target.value) || 1,
                }))
              }
            />

            <Input
              label="Weight (carats)"
              type="number"
              step="0.01"
              value={stoneForm.weight}
              onChange={(e) =>
                setStoneForm((prev) => ({
                  ...prev,
                  weight: parseFloat(e.target.value) || 0,
                }))
              }
            />

            <Input
              label="Quality"
              value={stoneForm.quality}
              onChange={(e) =>
                setStoneForm((prev) => ({ ...prev, quality: e.target.value }))
              }
            />

            <Input
              label="Price/Carat"
              type="number"
              value={stoneForm.pricePerCarat}
              onChange={(e) =>
                setStoneForm((prev) => ({
                  ...prev,
                  pricePerCarat: parseFloat(e.target.value) || 0,
                }))
              }
            />

            <Button type="button" onClick={addStone} size="sm">
              Add Stone
            </Button>
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">
            {product ? "Update Product" : "Add Product"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export const ProductList: React.FC = () => {
  const { products, addProduct, updateProduct, deleteProduct, searchProducts } =
    useProducts();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>();
  const [searchQuery, setSearchQuery] = useState("");

  const displayProducts = searchQuery ? searchProducts(searchQuery) : products;

  const handleSaveProduct = (product: Product) => {
    if (editingProduct) {
      updateProduct(editingProduct.id, product);
    } else {
      addProduct(product);
    }
    setEditingProduct(undefined);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsFormOpen(true);
  };

  const handleDeleteProduct = (id: string) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      deleteProduct(id);
    }
  };

  return (
    <Card title="Product Management">
      <div className="flex justify-between items-center mb-4">
        <Input
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
        <Button onClick={() => setIsFormOpen(true)}>Add New Product</Button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-zinc-300">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-medium text-zinc-500">
                Name
              </th>
              <th className="px-4 py-2 text-left text-sm font-medium text-zinc-500">
                Category
              </th>
              <th className="px-4 py-2 text-left text-sm font-medium text-zinc-500">
                Material
              </th>
              <th className="px-4 py-2 text-left text-sm font-medium text-zinc-500">
                Weight
              </th>
              <th className="px-4 py-2 text-left text-sm font-medium text-zinc-500">
                Price/gram
              </th>
              <th className="px-4 py-2 text-left text-sm font-medium text-zinc-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {displayProducts.map((product) => (
              <tr key={product.id} className="hover:bg-zinc-50">
                <td className="px-4 py-2 text-sm">{product.name}</td>
                <td className="px-4 py-2 text-sm">{product.category}</td>
                <td className="px-4 py-2 text-sm">
                  {product.material} {product.purity}
                </td>
                <td className="px-4 py-2 text-sm">{product.weight}g</td>
                <td className="px-4 py-2 text-sm">₹{product.basePrice}</td>
                <td className="px-4 py-2 text-sm space-x-2">
                  <Button size="sm" onClick={() => handleEditProduct(product)}>
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleDeleteProduct(product.id)}
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ProductForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingProduct(undefined);
        }}
        product={editingProduct}
        onSave={handleSaveProduct}
      />
    </Card>
  );
};
