"use client";

import React from "react";
import { Layout } from "@/components/Layout";
import { CustomersPage } from "@/components/pages";

export default function CustomersRoute() {
  return (
    <Layout>
      <CustomersPage />
    </Layout>
  );
}
