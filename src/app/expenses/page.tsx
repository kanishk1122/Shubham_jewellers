import React from "react";
import { Layout } from "@/components/Layout";

import { ExpenseManager } from "@/components/ExpenseManager";

export default function DashboardPage() {
  return (
    <Layout>
      <ExpenseManager />
    </Layout>
  );
}
