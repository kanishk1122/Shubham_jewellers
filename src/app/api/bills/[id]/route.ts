import { NextResponse } from "next/server";
import mongoose from "mongoose";
import BillModel from "@/models/Bill";

// ✅ GET /api/bills/[id]
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid or missing bill ID" },
        { status: 400 }
      );
    }

    const bill = await BillModel.findById(id);

    if (!bill) {
      return NextResponse.json(
        { success: false, error: "Bill not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: bill });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unexpected error occurred while fetching bill",
      },
      { status: 500 }
    );
  }
}

// ✅ PUT /api/bills/[id]
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid or missing bill ID" },
        { status: 400 }
      );
    }

    const billData = await request.json();
    const updatedBill = await BillModel.findByIdAndUpdate(
      id,
      {
        ...billData,
        date: billData.date || new Date(),
      },
      { new: true, runValidators: true }
    );

    if (!updatedBill) {
      return NextResponse.json(
        { success: false, error: "Bill not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedBill,
      message: "Bill updated successfully",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unexpected error occurred while updating bill",
      },
      { status: 500 }
    );
  }
}

// ✅ DELETE /api/bills/[id]
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid or missing bill ID" },
        { status: 400 }
      );
    }

    const deletedBill = await BillModel.findByIdAndDelete(id);

    if (!deletedBill) {
      return NextResponse.json(
        { success: false, error: "Bill not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: deletedBill,
      message: "Bill deleted successfully",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unexpected error occurred while deleting bill",
      },
      { status: 500 }
    );
  }
}
