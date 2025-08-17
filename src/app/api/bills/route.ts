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

    // Ensure each item has required fields for the Bill schema:
    // - productId (ObjectId)
    // - purity (fallback)
    const sanitizedItems = (billData.items || []).map((item: any) => {
      const copy: any = { ...item };

      // Ensure purity exists
      if (!copy.purity) {
        copy.purity = "24K";
      }

      // Determine a productId:
      // 1) If productId is a valid ObjectId string, use it (as ObjectId).
      // 2) Else if bulkProductId is a valid ObjectId string, use that.
      // 3) Otherwise generate a new ObjectId for custom items.
      const makeObjectId = (val: any) => {
        try {
          return new mongoose.Types.ObjectId(val);
        } catch {
          return new mongoose.Types.ObjectId();
        }
      };

      if (
        copy.productId &&
        typeof copy.productId === "string" &&
        mongoose.Types.ObjectId.isValid(copy.productId)
      ) {
        copy.productId = makeObjectId(copy.productId);
      } else if (
        copy.bulkProductId &&
        typeof copy.bulkProductId === "string" &&
        mongoose.Types.ObjectId.isValid(copy.bulkProductId)
      ) {
        copy.productId = makeObjectId(copy.bulkProductId);
      } else {
        // Create a synthetic productId for custom items so schema validation passes
        copy.productId = new mongoose.Types.ObjectId();
      }

      return copy;
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
