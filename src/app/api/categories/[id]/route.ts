import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Category from "@/models/Category";
import Product from "@/models/Product";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Check if another category with same name or slug exists (excluding current category)
    const existingCategory = await Category.findOne({
      $or: [{ name }, { slug }],
      _id: { $ne: params.id },
    });

    if (existingCategory) {
      return NextResponse.json(
        {
          success: false,
          error: "Another category with this name already exists",
        },
        { status: 409 }
      );
    }

    const category = await Category.findByIdAndUpdate(
      params.id,
      {
        name,
        slug,
        description,
        icon,
        color: color || "#3B82F6",
      },
      { new: true, runValidators: true }
    );

    if (!category) {
      return NextResponse.json(
        {
          success: false,
          error: "Category not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: category,
      message: "Category updated successfully",
    });
  } catch (error) {
    console.error("Failed to update category:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update category",
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

    // Check if category has products
    const productCount = await Product.countDocuments({
      category: { $exists: true },
      isActive: true,
    });

    if (productCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Cannot delete category that has products. Please reassign or delete products first.",
        },
        { status: 400 }
      );
    }

    // Soft delete - set isActive to false
    const category = await Category.findByIdAndUpdate(
      params.id,
      { isActive: false },
      { new: true }
    );

    if (!category) {
      return NextResponse.json(
        {
          success: false,
          error: "Category not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error("Failed to delete category:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete category",
      },
      { status: 500 }
    );
  }
}
