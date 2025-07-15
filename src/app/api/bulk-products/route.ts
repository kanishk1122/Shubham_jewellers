import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import BulkProduct from "@/models/BulkProduct";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const metal = searchParams.get("metal");
    const purity = searchParams.get("purity");
    const availableOnly = searchParams.get("availableOnly") === "true";

    let query: any = { isActive: true };

    if (category && category !== "all") {
      query.category = category;
    }

    if (metal && metal !== "all") {
      query.metal = metal;
    }

    if (purity) {
      query.purity = purity;
    }

    if (availableOnly) {
      query.remainingWeight = { $gt: 0 };
    }

    const bulkProducts = await BulkProduct.find(query)
      .sort({ updatedAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: bulkProducts,
    });
  } catch (error) {
    console.error("Failed to fetch bulk products:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch bulk products",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const {
      name,
      category,
      metal,
      purity,
      totalWeight,
      packageWeight,
      unitPrice,
      makingCharges,
      supplier,
      purchaseDate,
      batchNumber,
      notes,
    } = body;

    if (
      !name ||
      !category ||
      !metal ||
      !purity ||
      !totalWeight ||
      !packageWeight ||
      !unitPrice ||
      !makingCharges
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Required fields: name, category, metal, purity, totalWeight, packageWeight, unitPrice, makingCharges",
        },
        { status: 400 }
      );
    }

    const bulkProduct = new BulkProduct({
      name,
      category,
      metal,
      purity,
      totalWeight: parseFloat(totalWeight),
      remainingWeight: parseFloat(totalWeight), // Initially same as total weight
      packageWeight: parseFloat(packageWeight),
      unitPrice: parseFloat(unitPrice),
      makingCharges: parseFloat(makingCharges),
      supplier,
      purchaseDate: new Date(purchaseDate),
      batchNumber,
      notes,
    });

    await bulkProduct.save();

    return NextResponse.json({
      success: true,
      data: bulkProduct,
      message: "Bulk product created successfully",
    });
  } catch (error) {
    console.error("Failed to create bulk product:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create bulk product",
      },
      { status: 500 }
    );
  }
}
