import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Customer from "@/models/Customer";
import { verifyToken, getUserFromAuthHeader } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = Math.min(
      parseInt(searchParams.get("limit") || "50", 10),
      200
    ); // max 200 per page

    // support sort parameter e.g. ?sort=-totalPurchases or ?sort=createdAt
    const sortParam = searchParams.get("sort") || "-updatedAt";

    // build sort object
    const sort: any = {};
    if (sortParam.startsWith("-")) {
      sort[sortParam.substring(1)] = -1;
    } else {
      sort[sortParam] = 1;
    }

    let query: any = {};

    if (search && search.trim().length > 0) {
      const regex = new RegExp(search.trim(), "i");
      query.$or = [
        { name: regex },
        { phone: regex },
        { email: regex },
        { gstNumber: regex },
      ];
    }

    const total = await Customer.countDocuments(query);
    const customers = await Customer.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return NextResponse.json({
      success: true,
      data: customers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
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

    // --- AUTH: require Bearer token and admin role ---
    const authHeader =
      request.headers.get("authorization") ||
      request.headers.get("Authorization");
    const payload = verifyToken(
      authHeader ? authHeader.replace(/^Bearer\s+/i, "") : undefined
    );
    if (!payload || !payload.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    if (payload.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Forbidden: admin only" },
        { status: 403 }
      );
    }

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
