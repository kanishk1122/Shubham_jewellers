import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import MetalRate from "@/models/MetalRate";

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const { rates } = await request.json();

    let addedCount = 0;
    let updatedCount = 0;

    for (const rateData of rates) {
      const existingRate = await MetalRate.findOne({
        metal: rateData.metal,
        purity: rateData.purity,
        source: rateData.source || "manual",
      });

      if (existingRate) {
        await MetalRate.findByIdAndUpdate(existingRate._id, {
          ...rateData,
          source: rateData.source || "manual",
        });
        updatedCount++;
      } else {
        const newRate = new MetalRate({
          ...rateData,
          source: rateData.source || "manual",
        });
        await newRate.save();
        addedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      addedCount,
      updatedCount,
      message: `Import completed: ${addedCount} added, ${updatedCount} updated`,
    });
  } catch (error) {
    console.error("Error bulk importing metal rates:", error);
    return NextResponse.json(
      { success: false, error: "Failed to import metal rates" },
      { status: 500 }
    );
  }
}
