import { NextRequest, NextResponse } from "next/server";
import BillModel from "@/models/Bill";
import mongoose from "mongoose";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
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

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
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
