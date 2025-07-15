import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import BulkProduct from "@/models/BulkProduct";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const body = await request.json();
    const {
      name,
      category,
      metal,
      purity,
      totalWeight,
      remainingWeight,
      packageWeight,
      unitPrice,
      makingCharges,
      supplier,
      purchaseDate,
      batchNumber,
      notes,
    } = body;

    const bulkProduct = await BulkProduct.findByIdAndUpdate(
      params.id,
      {
        name,
        category,
        metal,
        purity,
        totalWeight: parseFloat(totalWeight),
        remainingWeight: parseFloat(remainingWeight),
        packageWeight: parseFloat(packageWeight),
        unitPrice: parseFloat(unitPrice),
        makingCharges: parseFloat(makingCharges),
        supplier,
        purchaseDate: new Date(purchaseDate),
        batchNumber,
        notes,
      },
      { new: true, runValidators: true }
    );

    if (!bulkProduct) {
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const bulkProduct = await BulkProduct.findByIdAndUpdate(
      params.id,
      { isActive: false },
      { new: true }
    );

    if (!bulkProduct) {
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

// API to deduct weight from bulk inventory
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

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

    const bulkProduct = await BulkProduct.findById(params.id);
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
          error: "Insufficient weight available in bulk inventory",
        },
        { status: 400 }
      );
    }

    bulkProduct.remainingWeight -= deductWeight;
    await bulkProduct.save();

    return NextResponse.json({
      success: true,
      data: bulkProduct,
      message: "Weight deducted successfully",
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
