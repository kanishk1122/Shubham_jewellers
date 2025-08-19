import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import UserModel from "@/models/User";
import { comparePassword, signToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { identifier, password } = body; // identifier can be email or phone
    if (!identifier || !password) {
      return NextResponse.json(
        { success: false, error: "Identifier and password required" },
        { status: 400 }
      );
    }

    const user = await UserModel.findOne({
      $or: [{ email: identifier }, { phone: identifier }],
      isActive: true,
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const ok = await comparePassword(password, user.passwordHash);
    if (!ok) {
      return NextResponse.json(
        { success: false, error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const token = signToken({ id: user._id.toString(), role: user.role });

    // create cookie string safely
    const encodedToken = encodeURIComponent(token);
    const maxAge = 60 * 60 * 24 * 7; // 7 days
    const parts = [
      `token=${encodedToken}`,
      `Path=/`,
      `Max-Age=${maxAge}`,
      `HttpOnly`,
      `SameSite=Lax`,
    ];
    if (process.env.NODE_ENV === "production") parts.push("Secure");

    return NextResponse.json(
      {
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
      },
      {
        headers: {
          "Set-Cookie": parts.join("; "),
        },
      }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { success: false, error: "Failed to login" },
      { status: 500 }
    );
  }
}
