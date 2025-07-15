import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import MetalRate from "@/models/MetalRate";

export async function GET() {
  try {
    await connectDB();
    const rates = await MetalRate.find({ isActive: true }).sort({
      updatedAt: -1,
    });
    return NextResponse.json({ success: true, data: rates });
  } catch (error) {
    console.error("Error fetching metal rates:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch metal rates" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const rateData = await request.json();

    const rate = new MetalRate(rateData);
    const savedRate = await rate.save();

    return NextResponse.json(
      { success: true, data: savedRate },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating metal rate:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create metal rate" },
      { status: 500 }
    );
  }
}
