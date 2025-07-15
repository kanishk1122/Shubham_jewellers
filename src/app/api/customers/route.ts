import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Customer from "@/models/Customer";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = parseInt(searchParams.get("skip") || "0");

    let query = { isActive: true };

    if (search) {
      query = {
        ...query,
        $or: [
          { name: { $regex: search, $options: "i" } },
          { phone: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { gstNumber: { $regex: search, $options: "i" } },
        ],
      } as any;
    }

    const customers = await Customer.find(query)
      .sort({ updatedAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean();

    const total = await Customer.countDocuments(query);

    return NextResponse.json({
      success: true,
      data: customers,
      pagination: {
        total,
        limit,
        skip,
        hasMore: skip + customers.length < total,
      },
    });
  } catch (error) {
    console.error("Failed to fetch customers:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch customers",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { name, phone, email, address, gstNumber, panNumber, notes } = body;

    if (!name || !phone) {
      return NextResponse.json(
        {
          success: false,
          error: "Name and phone are required",
        },
        { status: 400 }
      );
    }

    // Check if customer with same phone already exists
    const existingCustomer = await Customer.findOne({ phone, isActive: true });
    if (existingCustomer) {
      return NextResponse.json(
        {
          success: false,
          error: "Customer with this phone number already exists",
        },
        { status: 409 }
      );
    }

    const customer = new Customer({
      name,
      phone,
      email,
      address,
      gstNumber,
      panNumber,
      notes,
      totalPurchases: 0,
    });

    await customer.save();

    return NextResponse.json({
      success: true,
      data: customer,
      message: "Customer created successfully",
    });
  } catch (error) {
    console.error("Failed to create customer:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create customer",
      },
      { status: 500 }
    );
  }
}
