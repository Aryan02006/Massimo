import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { razorpayInstance, RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } from "@/lib/razorpay";

export async function POST(request: NextRequest) {
  try {
    const authCookie = request.cookies.get("massimo-auth");

    if (!authCookie || !ObjectId.isValid(authCookie.value)) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { amount, currency = "INR", notes = {} } = body;

    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return NextResponse.json(
        { success: false, message: "Invalid amount" },
        { status: 400 },
      );
    }

    const amountInSubunits = Math.round(numericAmount * 100);
    const receipt = `rcpt_${Date.now().toString().slice(-10)}`;

    try {
      const razorpayOrder = await razorpayInstance.orders.create({
        amount: amountInSubunits,
        currency,
        receipt,
        notes: {
          userId: authCookie.value,
          ...notes,
        },
      });

      return NextResponse.json({
        success: true,
        order: razorpayOrder,
        keyId: RAZORPAY_KEY_ID,
      });
    } catch (apiError: unknown) {
      const err = apiError as { message?: string; error?: { description?: string } };
      console.warn("Razorpay API error, checking fallback:", err?.message || apiError);

      if (!RAZORPAY_KEY_SECRET) {
        const fallbackOrder = {
          id: `order_test_${Date.now()}`,
          amount: amountInSubunits,
          currency,
          receipt,
          status: "created",
        };

        return NextResponse.json({
          success: true,
          order: fallbackOrder,
          keyId: RAZORPAY_KEY_ID,
          isFallback: true,
        });
      }

      return NextResponse.json(
        {
          success: false,
          message: err?.error?.description || err?.message || "Failed to create Razorpay order",
        },
        { status: 500 },
      );
    }
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error("Create Razorpay order error:", error);
    return NextResponse.json(
      { success: false, message: err?.message || "Internal server error" },
      { status: 500 },
    );
  }
}
