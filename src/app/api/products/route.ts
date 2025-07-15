import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Product from "@/models/Product";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const category = searchParams.get("category");
    const metal = searchParams.get("metal");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = parseInt(searchParams.get("skip") || "0");

    let query: any = { isActive: true };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { serialNumber: { $regex: search, $options: "i" } },
        { slug: { $regex: search, $options: "i" } },
      ];
    }

    if (category && category !== "all") {
      query.category = category;
    }

    if (metal && metal !== "all") {
      query.metal = metal;
    }

    const products = await Product.find(query)
      .sort({ updatedAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean();

    const total = await Product.countDocuments(query);

    return NextResponse.json({
      success: true,
      data: products,
      pagination: {
        total,
        limit,
        skip,
        hasMore: skip + products.length < total,
      },
    });
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch products",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const {
      name,
      category,
      metal,
      purity,
      weight,
      stoneWeight,
      makingCharges,
      description,
      imageUrl,
    } = body;

    if (!name || !category || !metal || !purity || !weight || !makingCharges) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Required fields: name, category, metal, purity, weight, makingCharges",
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

    // Generate next serial number
    const lastProduct = await Product.findOne()
      .sort({ serialNumber: -1 })
      .lean();
    const nextSerialNumber = lastProduct
      ? (parseInt(lastProduct.serialNumber) + 1).toString()
      : "1";

    const product = new Product({
      serialNumber: nextSerialNumber,
      slug,
      name,
      category,
      metal,
      purity,
      weight: parseFloat(weight),
      stoneWeight: stoneWeight ? parseFloat(stoneWeight) : undefined,
      makingCharges: parseFloat(makingCharges),
      description,
      imageUrl,
    });

    await product.save();

    return NextResponse.json({
      success: true,
      data: product,
      message: "Product created successfully",
    });
  } catch (error) {
    console.error("Failed to create product:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create product",
      },
      { status: 500 }
    );
  }
}
