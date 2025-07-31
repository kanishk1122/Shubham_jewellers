import { NextRequest, NextResponse } from "next/server";
import BillModel from "@/models/Bill";
import mongoose from "mongoose";

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

    const billNumber = (await BillModel.countDocuments()) + 1; // Generate a new bill number

    // Fix: Ensure productId is a valid ObjectId or undefined/null for bulk items
    const sanitizedItems = (billData.items || []).map((item: any) => {
      let productId = item.productId;
      // If productId looks like a valid ObjectId, keep it, else set to undefined
      if (
        productId &&
        typeof productId === "string" &&
        mongoose.Types.ObjectId.isValid(productId) &&
        String(new mongoose.Types.ObjectId(productId)) === productId
      ) {
        // valid ObjectId string
        return { ...item, productId };
      } else {
        // Not a valid ObjectId (likely a bulk id or custom string)
        // Remove productId so Mongoose doesn't try to cast it
        const { productId, ...rest } = item;
        return { ...rest };
      }
    });

    const newBill = new BillModel({
      customerId: billData.customerId,
      billNumber: billNumber,
      customerName: billData.customerName,
      customerPhone: billData.customerPhone,
      customerGST: billData.customerGST,
      items: sanitizedItems,
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


