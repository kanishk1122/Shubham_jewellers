"use client";

import React from "react";
import { Layout } from "@/components/Layout";
import { ProductsPage } from "@/components/pages";

export default function ProductsRoute() {
  return (
    <Layout>
      <ProductsPage />
    </Layout>
  );
}
