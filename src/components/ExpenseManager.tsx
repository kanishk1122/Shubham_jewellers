"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store";
import { fetchExpenses, createExpense } from "@/store/slices/expensesSlice";
import { fetchBills } from "@/store/slices/billsSlice";
import { Card, Button, Input, Select } from "@/components/ui";
import { Calendar, PlusCircle, RefreshCw } from "lucide-react";
import type { Expense } from "@/types/expense";

// Minimal styles/components assumed to exist in your ui library
export const ExpenseManager: React.FC = () => {
  const dispatch = useAppDispatch();
  const expensesState: any = useAppSelector((s) => s.expenses);
  const billsState: any = useAppSelector((s) => s.bills);

  const [range, setRange] = useState<"week" | "month" | "year" | "custom">(
    "month"
  );
  const [customStart, setCustomStart] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [customEnd, setCustomEnd] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [loadingLocal, setLoadingLocal] = useState(false);

  const [form, setForm] = useState<Partial<Expense>>({
    date: new Date().toISOString(),
    amount: 0,
    category: "operational",
    description: "",
  });

  // helper to build date range
  const getRangeDates = () => {
    const now = new Date();
    let start = new Date();
    let end = new Date();
    if (range === "week") {
      const d = new Date(now);
      const day = d.getDay();
      d.setDate(d.getDate() - day);
      start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
      end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
    } else if (range === "month") {
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    } else if (range === "year") {
      start = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
      end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    } else {
      start = new Date(customStart);
      end = new Date(customEnd);
      end.setHours(23, 59, 59, 999);
    }
    return {
      start: start.toISOString().split("T")[0],
      end: end.toISOString().split("T")[0],
    };
  };

  const loadData = async () => {
    setLoadingLocal(true);
    const { start, end } = getRangeDates();
    try {
      await Promise.all([
        dispatch(fetchExpenses({ startDate: start, endDate: end }) as any),
        dispatch(fetchBills({ startDate: start, endDate: end }) as any),
      ]);
    } finally {
      setLoadingLocal(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range, customStart, customEnd]);

  // Sum of expenses excluding purchase/exchange entries
  const totalExpensesExcludingPurchases = useMemo(() => {
    return (expensesState.expenses || [])
      .filter((e: any) => e.category !== "purchase")
      .reduce((s: number, e: any) => s + Number(e.amount || 0), 0);
  }, [expensesState.expenses]);

  // Sum of purchase/exchange entries (customer exchanges) — tracked separately
  const totalPurchases = useMemo(() => {
    return (expensesState.expenses || [])
      .filter((e: any) => e.category === "purchase")
      .reduce((s: number, e: any) => s + Number(e.amount || 0), 0);
  }, [expensesState.expenses]);

  const totalIncome = useMemo(() => {
    return (billsState.bills || []).reduce(
      (s: number, b: any) => s + Number(b.finalAmount || 0),
      0
    );
  }, [billsState.bills]);

  // P&L: income minus operational expenses (exclude purchases/exchanges)
  const grossProfit = totalIncome - totalExpensesExcludingPurchases;

  const handleCreateExpense = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!form.date || !form.amount) return alert("date and amount required");
    try {
      await dispatch(
        createExpense({
          date: form.date,
          amount: Number(form.amount),
          category: form.category || "operational",
          description: form.description,
          vendor: form.vendor,
          relatedCustomerId: form.relatedCustomerId,
          metalWeight: form.metalWeight ? Number(form.metalWeight) : undefined,
          metalType: form.metalType,
        }) as any
      );
      // reload
      await loadData();
      setForm({
        date: new Date().toISOString(),
        amount: 0,
        category: "operational",
      });
    } catch (err) {
      console.error(err);
      alert("Failed to save expense");
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-4 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5" />
          <div className="flex items-center gap-2">
            <Button
              variant={range === "week" ? "primary" : "secondary"}
              size="sm"
              onClick={() => setRange("week")}
            >
              Week
            </Button>
            <Button
              variant={range === "month" ? "primary" : "secondary"}
              size="sm"
              onClick={() => setRange("month")}
            >
              Month
            </Button>
            <Button
              variant={range === "year" ? "primary" : "secondary"}
              size="sm"
              onClick={() => setRange("year")}
            >
              Year
            </Button>
            <Button
              variant={range === "custom" ? "primary" : "secondary"}
              size="sm"
              onClick={() => setRange("custom")}
            >
              Custom
            </Button>
          </div>
          {range === "custom" && (
            <div className="flex items-center gap-2 ml-3">
              <Input
                type="date"
                value={customStart}
                onChange={(ev) => setCustomStart(ev.target.value)}
              />
              <Input
                type="date"
                value={customEnd}
                onChange={(ev) => setCustomEnd(ev.target.value)}
              />
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={loadData}
            variant="secondary"
            size="sm"
            disabled={loadingLocal}
          >
            <RefreshCw
              className={`${loadingLocal ? "animate-spin" : ""} w-4 h-4`}
            />{" "}
            Refresh
          </Button>
          <div className="text-sm text-zinc-600">
            Income: ₹{totalIncome.toLocaleString()} • Expenses: ₹
            {totalExpensesExcludingPurchases.toLocaleString()} • P&L: ₹
            {grossProfit.toLocaleString()}
            {/* show today's exchanges separately */}
            <div className="text-xs text-zinc-500 mt-1">
              Today Exchange: ₹{totalPurchases.toLocaleString()}
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="font-semibold mb-3">Add Expense / Purchase</h3>
        <form
          className="grid grid-cols-1 md:grid-cols-3 gap-3"
          onSubmit={handleCreateExpense}
        >
          <Input
            type="date"
            value={form.date?.slice(0, 10) || ""}
            onChange={(ev) => setForm({ ...form, date: ev.target.value })}
          />
          <Input
            type="number"
            step="0.01"
            value={form.amount ?? 0}
            onChange={(ev) =>
              setForm({ ...form, amount: Number(ev.target.value) })
            }
            placeholder="Amount (₹)"
          />
          <Select
            value={form.category || "operational"}
            onValueChange={(val: any) => setForm({ ...form, category: val })}
            options={[
              { value: "operational", label: "Operational" },
              { value: "loan", label: "Loan" },
              { value: "rent", label: "Rent" },
              { value: "salary", label: "Salary" },
              { value: "utility", label: "Utility" },
              { value: "misc", label: "Misc" },
              { value: "purchase", label: "Purchase (customer exchange)" },
            ]}
          />

          <Input
            className="md:col-span-2"
            value={form.description || ""}
            onChange={(ev) =>
              setForm({ ...form, description: ev.target.value })
            }
            placeholder="Description"
          />
          <Input
            value={form.vendor || ""}
            onChange={(ev) => setForm({ ...form, vendor: ev.target.value })}
            placeholder="Vendor / Payee"
          />

          {/* show metal-specific fields only when category is "purchase" */}
          {form.category === "purchase" && (
            <>
              <Input
                type="number"
                step="0.01"
                value={form.metalWeight ?? ""}
                onChange={(ev) =>
                  setForm({
                    ...form,
                    metalWeight: ev.target.value
                      ? Number(ev.target.value)
                      : undefined,
                  })
                }
                placeholder="Metal weight (g) - optional"
              />
              <Select
                value={form.metalType || ""}
                onValueChange={(val: any) =>
                  setForm({ ...form, metalType: val })
                }
                options={[
                  { value: "", label: "Metal type" },
                  { value: "gold", label: "Gold" },
                  { value: "silver", label: "Silver" },
                  { value: "platinum", label: "Platinum" },
                ]}
              />
            </>
          )}

          <div className="md:col-span-3 flex gap-2 mt-2">
            <Button type="submit" className="flex items-center gap-2">
              <PlusCircle className="w-4 h-4" /> Add
            </Button>
            <Button
              variant="secondary"
              onClick={() =>
                setForm({
                  date: new Date().toISOString(),
                  amount: 0,
                  category: "operational",
                })
              }
            >
              Reset
            </Button>
          </div>
        </form>
      </Card>

      <Card className="p-4">
        <h3 className="font-semibold mb-3">
          Expense Details ({expensesState.expenses?.length || 0})
        </h3>
        <div className="space-y-2">
          {(expensesState.expenses || []).map((ex: any) => (
            <div
              key={ex._id || ex.id}
              className="flex justify-between items-center py-2 border-b last:border-b-0"
            >
              <div>
                <div className="font-medium">
                  {ex.category} • ₹{Number(ex.amount).toLocaleString()}
                </div>
                <div className="text-xs text-zinc-500">
                  {new Date(ex.date).toLocaleDateString()}{" "}
                  {ex.metalWeight ? `• ${ex.metalWeight}g ${ex.metalType}` : ""}
                </div>
                {ex.description && (
                  <div className="text-sm">{ex.description}</div>
                )}
              </div>
              <div className="text-sm text-zinc-500">{ex.vendor || "-"}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default ExpenseManager;
