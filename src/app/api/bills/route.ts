import { NextRequest, NextResponse } from "next/server";
import BillModel from "@/models/Bill";
import mongoose from "mongoose";
import { verifyToken } from "@/lib/auth";

export async function GET(request?: NextRequest) {
  try {
    // --- AUTH: if request provided verify token ---
    if (request) {
      const authHeader =
        request.headers.get("authorization") ||
        request.headers.get("Authorization");
      const token = authHeader
        ? authHeader.replace(/^Bearer\s+/i, "")
        : undefined;
      const payload = verifyToken(token);
      if (!payload || !payload.id) {
        return NextResponse.json(
          { success: false, error: "Unauthorized" },
          { status: 401 }
        );
      }
    }

    // support both direct call and NextRequest (for tests)
    const url = request ? new URL(request.url) : null;
    const params = url ? url.searchParams : new URLSearchParams();

    // parse pagination & filters
    const page = parseInt(params.get("page") || "1", 10) || 1;
    const limit = Math.min(
      parseInt(params.get("limit") || "100", 10) || 100,
      1000
    );
    const startDate = params.get("startDate");
    const endDate = params.get("endDate");
    const paymentStatus = params.get("paymentStatus");
    const search = params.get("search");
    const tag = params.get("tag"); // optional - model may ignore if not present
    const sortParam = params.get("sort") || "-date";

    const filter: any = {};

    // date range filter
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
      // clean if empty
      if (Object.keys(filter.date).length === 0) delete filter.date;
    }

    if (paymentStatus) {
      filter.paymentStatus = paymentStatus;
    }

    if (tag) {
      // if your Bill schema has tags: [String] you can filter; harmless if not present
      filter.tags = tag;
    }

    if (search) {
      const s = search.trim();
      const searchRegex = new RegExp(
        s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "i"
      );
      filter.$or = [
        { billNumber: { $regex: searchRegex } },
        { customerName: { $regex: searchRegex } },
        { customerPhone: { $regex: searchRegex } },
        { "items.productName": { $regex: searchRegex } },
      ];
    }

    // compute pagination
    const skip = (page - 1) * limit;

    // build sort
    const sort: any = {};
    if (sortParam.startsWith("-")) {
      sort[sortParam.substring(1)] = -1;
    } else {
      sort[sortParam] = 1;
    }

    const [total, bills] = await Promise.all([
      BillModel.countDocuments(filter),
      BillModel.find(filter).sort(sort).skip(skip).limit(limit),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return NextResponse.json({
      success: true,
      data: bills,
      total,
      page,
      limit,
      totalPages,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch bills" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // AUTH: require token for creating bills
    const authHeader =
      request.headers.get("authorization") ||
      request.headers.get("Authorization");
    const token = authHeader
      ? authHeader.replace(/^Bearer\s+/i, "")
      : undefined;
    const payload = verifyToken(token);
    if (!payload || !payload.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const billData = await request.json();

    const billNumber = (await BillModel.countDocuments()) + 1; // Generate a new bill number

    // helper to coerce to number
    const toNum = (v: any, fallback = 0) =>
      typeof v === "number" ? v : parseFloat(String(v || "")) || fallback;

    // convert rate to per-gram basis based on metal like client logic
    const toRatePerGram = (rate: number, metal?: string) => {
      if (!rate) return 0;
      if (metal === "silver") return rate / 1000; // per kg -> per g
      if (metal === "gold") return rate / 10; // per 10g -> per g
      return rate; // platinum or default per g
    };

    // Ensure each item has schema-required fields and compute amount if missing
    const sanitizedItems = (billData.items || []).map((item: any) => {
      const copy: any = { ...item };

      // defaults for string fields
      copy.productName = copy.productName || "Custom Item";
      copy.category = copy.category || "Custom";
      copy.metal = copy.metal || "gold";
      copy.purity = copy.purity || "24K";
      copy.productSerialNumber =
        copy.productSerialNumber || `CUSTOM-${Date.now()}`;

      // numeric coercion with safe defaults
      copy.weight = toNum(copy.weight, 0);
      copy.stoneWeight = toNum(copy.stoneWeight, 0);
      copy.netWeight =
        typeof copy.netWeight === "number"
          ? copy.netWeight
          : Math.max(0, copy.weight - (copy.stoneWeight || 0));
      copy.rate = toNum(copy.rate, 0);
      copy.makingCharges = toNum(copy.makingCharges, 0);
      copy.makingChargesType =
        copy.makingChargesType === "percentage" ? "percentage" : "fixed";
      copy.wastage = toNum(copy.wastage, 0);
      copy.wastageType = copy.wastageType === "fixed" ? "fixed" : "percentage";

      // ensure amount: if provided use it, else compute based on netWeight/rate/making/wastage
      if (typeof copy.amount !== "number" || isNaN(copy.amount)) {
        const ratePerGram = toRatePerGram(copy.rate, copy.metal);
        const baseAmount = (copy.netWeight || 0) * ratePerGram;
        let makingAmt = 0;
        let wastageAmt = 0;
        if (copy.makingCharges) {
          makingAmt =
            copy.makingChargesType === "percentage"
              ? (baseAmount * copy.makingCharges) / 100
              : copy.makingCharges;
        }
        if (copy.wastage) {
          wastageAmt =
            copy.wastageType === "percentage"
              ? (baseAmount * copy.wastage) / 100
              : copy.wastage;
        }
        copy.amount = baseAmount + makingAmt + wastageAmt;
      } else {
        copy.amount = toNum(copy.amount, 0);
      }

      // Ensure productId is an ObjectId:
      const makeObjectId = (val: any) => {
        try {
          return new mongoose.Types.ObjectId(val);
        } catch {
          return new mongoose.Types.ObjectId();
        }
      };

      if (
        copy.productId &&
        typeof copy.productId === "string" &&
        mongoose.Types.ObjectId.isValid(copy.productId)
      ) {
        copy.productId = makeObjectId(copy.productId);
      } else if (
        copy.bulkProductId &&
        typeof copy.bulkProductId === "string" &&
        mongoose.Types.ObjectId.isValid(copy.bulkProductId)
      ) {
        copy.productId = makeObjectId(copy.bulkProductId);
      } else {
        // synthetic ObjectId for custom items
        copy.productId = new mongoose.Types.ObjectId();
      }

      return copy;
    });

    // Compute subtotal if not provided
    const subtotal =
      typeof billData.subtotal === "number"
        ? billData.subtotal
        : sanitizedItems.reduce(
            (s: number, it: any) => s + toNum(it.amount, 0),
            0
          );

    const discount = toNum(billData.discount, 0);
    const discountedAmount = Math.max(0, subtotal - discount);
    // compute taxes if not provided
    let cgst = typeof billData.cgst === "number" ? billData.cgst : 0;
    let sgst = typeof billData.sgst === "number" ? billData.sgst : 0;
    let igst = typeof billData.igst === "number" ? billData.igst : 0;

    // taxType: 'cgst' (default) or 'igst'
    const taxType =
      billData.taxType === "igst" ? "igst" : billData.taxType ? "none" : "cgst";

    if (!cgst && !sgst && !igst) {
      if (taxType === "igst") {
        igst = parseFloat(((discountedAmount * 6) / 100).toFixed(2)); // 6%
        cgst = 0;
        sgst = 0;
      } else if (taxType === "cgst") {
        cgst = parseFloat(((discountedAmount * 3) / 100).toFixed(2)); // 3%
        sgst = parseFloat(((discountedAmount * 3) / 100).toFixed(2)); // 3%
        igst = 0;
      } else {
        igst = 0;
        cgst = 0;
        sgst = 0;
      }
    }

    const finalAmount =
      typeof billData.finalAmount === "number"
        ? billData.finalAmount
        : parseFloat(
            (
              discountedAmount +
              (cgst || 0) +
              (sgst || 0) +
              (igst || 0)
            ).toFixed(2)
          );

    // Build payload - include customerGST only if present
    const billPayload: any = {
      customerId: billData.customerId,
      billNumber: String(billNumber),
      customerName: billData.customerName,
      customerPhone: billData.customerPhone,
      items: sanitizedItems,
      subtotal,
      cgst,
      sgst,
      igst,
      totalAmount: discountedAmount + cgst + sgst + igst,
      discount,
      finalAmount,
      paymentMode: billData.paymentMode,
      paymentStatus: billData.paymentStatus,
      notes: billData.notes,
      date: billData.date || new Date(),
      isActive: true,
    };

    if (billData.customerGST) {
      billPayload.customerGST = billData.customerGST;
    }

    // Save
    const newBill = new BillModel(billPayload);
    const savedBill = await newBill.save();

    return NextResponse.json({
      success: true,
      data: savedBill,
      message: "Bill created successfully",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unexpected error occurred while creating bill",
      },
      { status: 500 }
    );
  }
}
