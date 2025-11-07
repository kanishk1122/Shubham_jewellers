import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import UserModel from "@/models/User";
import { hashPassword, signToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json().catch(() => ({}));
    const adminEmail =
      body.email || process.env.SEED_ADMIN_EMAIL || "admin@example.com";
    const adminPhone =
      body.phone || process.env.SEED_ADMIN_PHONE || "9999999999";
    const adminPassword =
      body.password || process.env.SEED_ADMIN_PASSWORD || "Admin@123";

    // If an admin exists, return it (safe idempotent seed)
    const existingAdmin = await UserModel.findOne({ role: "admin" });
    if (existingAdmin) {
      const token = signToken({
        id: existingAdmin._id.toString(),
        role: existingAdmin.role,
      });
      return NextResponse.json({
        success: true,
        message: "Admin already exists",
        data: { user: existingAdmin, token },
      });
    }

    const passwordHash = await hashPassword(adminPassword);
    const admin = new UserModel({
      name: "Admin",
      email: adminEmail,
      phone: adminPhone,
      passwordHash,
      role: "admin",
      isActive: true,
    });
    await admin.save();

    const token = signToken({ id: admin._id.toString(), role: admin.role });
    return NextResponse.json(
      {
        success: true,
        message: "Admin user created successfully",
        data: { user: admin, token },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Seed error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to seed admin" },
      { status: 500 }
    );
  }
}
