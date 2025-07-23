import { NextRequest, NextResponse } from "next/server";
import { BillService } from "@/services/billService";

export async function GET() {
  try {
    const bills = await BillService.getAllBills();
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
    const bill = await BillService.createBill(billData);
    // If bill creation fails, return error at top level, not inside data
    if (!bill) {
      return NextResponse.json(
        { success: false, error: "Failed to create bill" },
        { status: 500 }
      );
    }
    return NextResponse.json({
      success: true,
      data: bill,
      message: "Bill created successfully",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to create bill" },
      { status: 500 }
    );
  }
}
