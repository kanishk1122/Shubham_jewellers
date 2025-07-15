import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Customer from "@/models/Customer";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const customer = await Customer.findById(params.id);
    if (!customer) {
      return NextResponse.json(
        {
          success: false,
          error: "Customer not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: customer,
    });
  } catch (error) {
    console.error("Failed to fetch customer:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch customer",
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

    // Check if another customer with same phone exists (excluding current customer)
    const existingCustomer = await Customer.findOne({
      phone,
      _id: { $ne: params.id },
      isActive: true,
    });

    if (existingCustomer) {
      return NextResponse.json(
        {
          success: false,
          error: "Another customer with this phone number already exists",
        },
        { status: 409 }
      );
    }

    const customer = await Customer.findByIdAndUpdate(
      params.id,
      {
        name,
        phone,
        email,
        address,
        gstNumber,
        panNumber,
        notes,
      },
      { new: true, runValidators: true }
    );

    if (!customer) {
      return NextResponse.json(
        {
          success: false,
          error: "Customer not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: customer,
      message: "Customer updated successfully",
    });
  } catch (error) {
    console.error("Failed to update customer:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update customer",
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
    await connectDB();

    // Soft delete - set isActive to false
    const customer = await Customer.findByIdAndUpdate(
      params.id,
      { isActive: false },
      { new: true }
    );

    if (!customer) {
      return NextResponse.json(
        {
          success: false,
          error: "Customer not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Customer deleted successfully",
    });
  } catch (error) {
    console.error("Failed to delete customer:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete customer",
      },
      { status: 500 }
    );
  }
}
