import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import UserModel from "@/models/User";
import { hashPassword, signToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { name, email, phone, password } = body;
    if (!name || !password || (!email && !phone)) {
      return NextResponse.json(
        { success: false, error: "Name, password and email or phone required" },
        { status: 400 }
      );
    }

    // prevent duplicate by email or phone
    const existing = await UserModel.findOne({
      $or: [{ email: email || null }, { phone: phone || null }],
    });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "User already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const user = new UserModel({
      name,
      email,
      phone,
      passwordHash,
      role: "user",
    });
    await user.save();

    const token = signToken({ id: user._id.toString(), role: user.role });
    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
        },
        token,
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { success: false, error: "Failed to register user" },
      { status: 500 }
    );
  }
}
