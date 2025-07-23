import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import BulkProduct from "@/models/BulkProduct";

export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    const url = new URL(request.url);
    const id = url.pathname.split("/").pop();

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

    const updateData: any = {
      name,
      category,
      metal,
      purity,
      totalWeight: parseFloat(totalWeight),
      packageWeight: parseFloat(packageWeight),
      makingCharges: parseFloat(makingCharges),
      supplier,
      purchaseDate,
      batchNumber,
      notes,
    };

    const bulkProduct = await BulkProduct.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!bulkProduct) {
      return NextResponse.json(
        { success: false, error: "Bulk product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: bulkProduct,
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

    const bulkProduct = await BulkProduct.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!bulkProduct) {
      return NextResponse.json(
        { success: false, error: "Bulk product not found" },
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

// API to deduct weight from bulk inventory
export async function PATCH(request: NextRequest) {
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
    const { deductWeight } = body;

    if (!deductWeight || deductWeight <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Valid deduct weight is required",
        },
        { status: 400 }
      );
    }

    const bulkProduct = await BulkProduct.findById(id);
    if (!bulkProduct) {
      return NextResponse.json(
        {
          success: false,
          error: "Bulk product not found",
        },
        { status: 404 }
      );
    }

    if (bulkProduct.remainingWeight < deductWeight) {
      return NextResponse.json(
        {
          success: false,
          error: `Insufficient weight available. Available: ${bulkProduct.remainingWeight}g, Requested: ${deductWeight}g`,
        },
        { status: 400 }
      );
    }

    bulkProduct.remainingWeight -= deductWeight;
    await bulkProduct.save();

    return NextResponse.json({
      success: true,
      data: bulkProduct,
      message: `Successfully deducted ${deductWeight}g. Remaining: ${bulkProduct.remainingWeight}g`,
    });
  } catch (error) {
    console.error("Failed to deduct weight:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to deduct weight",
      },
      { status: 500 }
    );
  }
}
