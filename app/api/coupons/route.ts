import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

interface Coupon {
  code: string;
  type: "percentage" | "fixed";
  value: number;
  minimumSubtotal?: number;
}

export async function POST(request: NextRequest) {
  try {
    const { code, subtotal } = await request.json();

    if (!code) {
      return NextResponse.json(
        {
          success: false,
          message: "Coupon code is required",
        },
        { status: 400 },
      );
    }

    const client = await clientPromise;

    const db = client.db("Massimo");

    const coupons = db.collection<Coupon>("coupons");

    const coupon = await coupons.findOne({
      code: code.trim().toUpperCase(),
    });

    if (!coupon) {
      return NextResponse.json(
        {
          success: false,
          message: "That coupon code is not valid.",
        },
        { status: 404 },
      );
    }

    if (
      coupon.minimumSubtotal !== undefined &&
      subtotal < coupon.minimumSubtotal
    ) {
      return NextResponse.json(
        {
          success: false,
          message: `This code requires a subtotal of $${coupon.minimumSubtotal.toFixed(2)}.`,
        },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Coupon applied successfully.",
      coupon: {
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        minimumSubtotal: coupon.minimumSubtotal,
      },
    });
  } catch (error) {
    console.error("Coupon validation error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 },
    );
  }
}
