import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import MetalRate from "@/models/MetalRate";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const updateData = await request.json();

    const updatedRate = await MetalRate.findByIdAndUpdate(
      params.id,
      updateData,
      { new: true }
    );

    if (!updatedRate) {
      return NextResponse.json(
        { success: false, error: "Metal rate not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updatedRate });
  } catch (error) {
    console.error("Error updating metal rate:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update metal rate" },
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

    const deletedRate = await MetalRate.findByIdAndUpdate(
      params.id,
      { isActive: false },
      { new: true }
    );

    if (!deletedRate) {
      return NextResponse.json(
        { success: false, error: "Metal rate not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: deletedRate });
  } catch (error) {
    console.error("Error deleting metal rate:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete metal rate" },
      { status: 500 }
    );
  }
}
