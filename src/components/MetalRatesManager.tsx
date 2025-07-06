import React, { useState } from "react";
import { Material, MetalRate } from "@/types/billing";
import { useMetalRates } from "@/hooks/useBilling";
import { Button, Input, Select, Card, Modal } from "@/components/ui";

interface MetalRateFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (material: Material, rate: number, purity?: string) => void;
}

const MetalRateForm: React.FC<MetalRateFormProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    material: Material.GOLD,
    purity: "22K",
    rate: 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.rate > 0) {
      onSave(formData.material, formData.rate, formData.purity);
      onClose();
      setFormData({ material: Material.GOLD, purity: "22K", rate: 0 });
    }
  };

  const materialOptions = Object.values(Material).map((material) => ({
    value: material,
    label: material,
  }));

  const getPurityOptions = (material: Material) => {
    switch (material) {
      case Material.GOLD:
      case Material.WHITE_GOLD:
      case Material.ROSE_GOLD:
        return [
          { value: "24K", label: "24K (99.9%)" },
          { value: "22K", label: "22K (91.6%)" },
          { value: "21K", label: "21K (87.5%)" },
          { value: "20K", label: "20K (83.3%)" },
          { value: "18K", label: "18K (75.0%)" },
          { value: "16K", label: "16K (66.6%)" },
          { value: "14K", label: "14K (58.3%)" },
        ];
      case Material.SILVER:
        return [
          { value: "999", label: "999 Pure Silver" },
          { value: "925", label: "925 Sterling Silver" },
        ];
      case Material.PLATINUM:
        return [
          { value: "PT950", label: "PT950 (95%)" },
          { value: "PT900", label: "PT900 (90%)" },
          { value: "PT850", label: "PT850 (85%)" },
        ];
      default:
        return [{ value: "PURE", label: "Pure" }];
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Update Metal Rate">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Material"
          value={formData.material}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              material: e.target.value as Material,
              purity: getPurityOptions(e.target.value as Material)[0].value,
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
          options={getPurityOptions(formData.material)}
        />

        <Input
          label="Rate (per gram)"
          type="number"
          step="0.01"
          value={formData.rate}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              rate: parseFloat(e.target.value) || 0,
            }))
          }
          required
        />

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Update Rate</Button>
        </div>
      </form>
    </Modal>
  );
};

export const MetalRatesManager: React.FC = () => {
  const { metalRates, updateMetalRate, getLatestRate } = useMetalRates();
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleSaveRate = (
    material: Material,
    rate: number,
    purity?: string
  ) => {
    updateMetalRate(material, rate, purity);
  };

  // Group rates by material
  const groupedRates = metalRates.reduce((acc, rate) => {
    const key = `${rate.material}${rate.purity ? `_${rate.purity}` : ""}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(rate);
    return acc;
  }, {} as Record<string, MetalRate[]>);

  // Get latest rate for each material-purity combination
  const latestRates = Object.entries(groupedRates)
    .map(([key, rates]) => {
      const latest = rates.reduce((prev, current) =>
        new Date(current.date) > new Date(prev.date) ? current : prev
      );
      return latest;
    })
    .sort((a, b) => a.material.localeCompare(b.material));

  const popularRates = [
    { material: Material.GOLD, purity: "22K", label: "Gold 22K" },
    { material: Material.GOLD, purity: "24K", label: "Gold 24K" },
    { material: Material.SILVER, purity: "925", label: "Silver 925" },
    { material: Material.SILVER, purity: "999", label: "Silver 999" },
    { material: Material.PLATINUM, purity: "PT950", label: "Platinum 950" },
  ];

  return (
    <div className="space-y-6">
      {/* Quick Rate Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {popularRates.map(({ material, purity, label }) => {
          const rate = getLatestRate(material, purity);
          return (
            <Card key={`${material}_${purity}`}>
              <div className="text-center">
                <h3 className="text-sm font-medium text-zinc-600">{label}</h3>
                <p className="text-2xl font-bold text-yellow-600">
                  {rate ? `₹${rate.rate.toLocaleString()}` : "N/A"}
                </p>
                <p className="text-xs text-zinc-500">per gram</p>
                {rate && (
                  <p className="text-xs text-zinc-400">
                    Updated: {new Date(rate.date).toLocaleDateString()}
                  </p>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Rate Management */}
      <Card title="Metal Rates Management">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Current Rates</h3>
          <Button onClick={() => setIsFormOpen(true)}>Update Rate</Button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-zinc-300">
            <thead className="bg-zinc-50">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-zinc-500">
                  Material
                </th>
                <th className="px-4 py-2 text-left text-sm font-medium text-zinc-500">
                  Purity
                </th>
                <th className="px-4 py-2 text-left text-sm font-medium text-zinc-500">
                  Rate (₹/gram)
                </th>
                <th className="px-4 py-2 text-left text-sm font-medium text-zinc-500">
                  Last Updated
                </th>
                <th className="px-4 py-2 text-left text-sm font-medium text-zinc-500">
                  Change
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {latestRates.map((rate, index) => {
                // Get previous rate for comparison
                const allRatesForMaterial =
                  groupedRates[
                    `${rate.material}${rate.purity ? `_${rate.purity}` : ""}`
                  ];
                const sortedRates = allRatesForMaterial.sort(
                  (a, b) =>
                    new Date(b.date).getTime() - new Date(a.date).getTime()
                );
                const previousRate = sortedRates[1];
                const change = previousRate ? rate.rate - previousRate.rate : 0;
                const changePercent = previousRate
                  ? (change / previousRate.rate) * 100
                  : 0;

                return (
                  <tr key={index} className="hover:bg-zinc-50">
                    <td className="px-4 py-2 font-medium">{rate.material}</td>
                    <td className="px-4 py-2">{rate.purity || "-"}</td>
                    <td className="px-4 py-2 text-lg font-semibold">
                      ₹{rate.rate.toLocaleString()}
                    </td>
                    <td className="px-4 py-2 text-sm">
                      {new Date(rate.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2">
                      {change !== 0 && (
                        <span
                          className={`text-sm ${
                            change > 0 ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {change > 0 ? "+" : ""}₹{change.toFixed(2)} (
                          {changePercent.toFixed(2)}%)
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {latestRates.length === 0 && (
          <div className="text-center py-8 text-zinc-500">
            No metal rates configured yet. Click "Update Rate" to add rates.
          </div>
        )}
      </Card>

      {/* Rate History */}
      <Card title="Rate History">
        <div className="space-y-4">
          {Object.entries(groupedRates).map(([key, rates]) => {
            const sortedRates = rates.sort(
              (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
            );
            const latest = sortedRates[0];

            return (
              <div key={key} className="border rounded-lg p-4">
                <h4 className="font-semibold mb-2">
                  {latest.material} {latest.purity && `(${latest.purity})`}
                </h4>
                <div className="space-y-2">
                  {sortedRates.slice(0, 5).map((rate, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center text-sm"
                    >
                      <span>{new Date(rate.date).toLocaleDateString()}</span>
                      <span className="font-medium">
                        ₹{rate.rate.toLocaleString()}
                      </span>
                    </div>
                  ))}
                  {sortedRates.length > 5 && (
                    <p className="text-xs text-zinc-500">
                      ... and {sortedRates.length - 5} more entries
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <MetalRateForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSaveRate}
      />
    </div>
  );
};
