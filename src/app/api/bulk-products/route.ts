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
      !makingCharges
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Required fields: name, category, metal, purity, totalWeight, packageWeight, makingCharges",
        },
        { status: 400 }
      );
    }

    const createslug = (name: string, supplier: string, date: Date) => {
      const formattedDate = date.toISOString().split("T")[0].replace(/-/g, "");
      return `${name.toLowerCase().replace(/\s+/g, "-")}-${supplier
        .toLowerCase()
        .replace(/\s+/g, "-")}-${formattedDate}`;
    };

    const bulkProduct = new BulkProduct({
      name,
      category,
      metal,
      purity,
      totalWeight: parseFloat(totalWeight),
      remainingWeight: parseFloat(totalWeight),
      packageWeight: parseFloat(packageWeight),
      makingCharges: parseFloat(makingCharges),
      supplier,
      purchaseDate: new Date(purchaseDate),
      batchNumber,
      notes,
      isActive: true,
      slug: createslug(name, supplier, new Date(purchaseDate)),
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

export async function PUT(request: NextRequest) {
  try {
    await connectDB();

    const url = new URL(request.url);
    const id = url.pathname.split("/").pop();

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Product ID is required",
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const updatedBulkProduct = await BulkProduct.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });

    if (!updatedBulkProduct) {
      return NextResponse.json(
        {
          success: false,
          error: "Bulk product not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedBulkProduct,
      message: "Bulk product updated successfully",
    });
  } catch (error) {
    console.error("Failed to update bulk product:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update bulk product",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectDB();

    const url = new URL(request.url);
    const id = url.pathname.split("/").pop();

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Product ID is required",
        },
        { status: 400 }
      );
    }

    const deletedBulkProduct = await BulkProduct.findByIdAndDelete(id);

    if (!deletedBulkProduct) {
      return NextResponse.json(
        {
          success: false,
          error: "Bulk product not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Bulk product deleted successfully",
    });
  } catch (error) {
    console.error("Failed to delete bulk product:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete bulk product",
      },
      { status: 500 }
    );
  }
}
