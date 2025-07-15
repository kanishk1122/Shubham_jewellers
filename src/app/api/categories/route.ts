import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Category from "@/models/Category";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("activeOnly") === "true";

    let query: any = {};
    if (activeOnly) {
      query.isActive = true;
    }

    const categories = await Category.find(query).sort({ name: 1 }).lean();

    return NextResponse.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch categories",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { name, description, icon, color } = body;

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          error: "Category name is required",
        },
        { status: 400 }
      );
    }

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");

    // Check if category with same name or slug already exists
    const existingCategory = await Category.findOne({
      $or: [{ name }, { slug }],
    });

    if (existingCategory) {
      return NextResponse.json(
        {
          success: false,
          error: "Category with this name already exists",
        },
        { status: 409 }
      );
    }

    const category = new Category({
      name,
      slug,
      description,
      icon,
      color: color || "#3B82F6",
    });

    await category.save();

    return NextResponse.json({
      success: true,
      data: category,
      message: "Category created successfully",
    });
  } catch (error) {
    console.error("Failed to create category:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create category",
      },
      { status: 500 }
    );
  }
}
