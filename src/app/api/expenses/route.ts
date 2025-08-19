import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Expense from "@/models/Expense";
import { verifyToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(
      200,
      parseInt(searchParams.get("limit") || "100", 10)
    );
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const category = searchParams.get("category") || undefined;
    const sortParam = searchParams.get("sort") || "-date";

    const filter: any = {};

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) {
        const s = new Date(startDate);
        if (!isNaN(s.getTime())) filter.date.$gte = s;
      }
      if (endDate) {
        const e = new Date(endDate);
        if (!isNaN(e.getTime())) filter.date.$lte = e;
      }
      if (Object.keys(filter.date).length === 0) delete filter.date;
    }

    if (category) filter.category = category;

    const sort: any = {};
    if (sortParam.startsWith("-")) sort[sortParam.substring(1)] = -1;
    else sort[sortParam] = 1;

    const skip = (page - 1) * limit;

    const [total, items] = await Promise.all([
      Expense.countDocuments(filter),
      Expense.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    ]);

    return NextResponse.json({
      success: true,
      data: items,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (err) {
    console.error("GET /api/expenses error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to fetch expenses" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // optional: verify admin token for creating expenses (adjust per your auth)
    const authHeader = request.headers.get("authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "") || undefined;
    // allow unauthenticated for now but you can enforce:
    // const payload = verifyToken(token); if (!payload || payload.role !== 'admin') return 403

    const body = await request.json();
    const {
      date,
      amount,
      category,
      description,
      vendor,
      relatedCustomerId,
      metalWeight,
      metalType,
    } = body;

    if (!date || typeof amount !== "number") {
      return NextResponse.json(
        { success: false, error: "date and numeric amount required" },
        { status: 400 }
      );
    }

    const exp = new Expense({
      date: new Date(date),
      amount,
      category: category || "operational",
      description,
      vendor,
      relatedCustomerId: relatedCustomerId || undefined,
      metalWeight: metalWeight || undefined,
      metalType: metalType || undefined,
    });

    const saved = await exp.save();
    return NextResponse.json({ success: true, data: saved });
  } catch (err) {
    console.error("POST /api/expenses error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to create expense" },
      { status: 500 }
    );
  }
}
