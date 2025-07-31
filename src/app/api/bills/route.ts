import { NextRequest, NextResponse } from "next/server";
import BillModel from "@/models/Bill";

export async function GET() {
  try {
    const bills = await BillModel.find().sort({ date: -1 }); // Optional: recent first
    return NextResponse.json({ success: true, data: bills });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch bills" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const billData = await request.json();

    const billNumber = await BillModel.countDocuments() + 1; // Generate a new bill number

    const newBill = new BillModel({
      customerId: billData.customerId,
      billNumber: billNumber,
      customerName: billData.customerName,
      customerPhone: billData.customerPhone,
      customerGST: billData.customerGST,
      items: billData.items,
      subtotal: billData.subtotal,
      cgst: billData.cgst,
      sgst: billData.sgst,
      igst: billData.igst,
      totalAmount: billData.totalAmount,
      discount: billData.discount,
      finalAmount: billData.finalAmount,
      paymentMode: billData.paymentMode,
      paymentStatus: billData.paymentStatus,
      notes: billData.notes,
      date: billData.date || new Date(),
      isActive: true,
    });

    const savedBill = await newBill.save();

    return NextResponse.json({
      success: true,
      data: savedBill,
      message: "Bill created successfully",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unexpected error occurred while creating bill",
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
    const billData = await request.json();
    const billId = params.id;

    console.log("Updating Bill ID:", billId);

    if (!billId) {
      return NextResponse.json(
        { success: false, error: "Bill ID is required" },
        { status: 400 }
      );
    }

    const updatedBill = await BillModel.findByIdAndUpdate(
      billId,
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
