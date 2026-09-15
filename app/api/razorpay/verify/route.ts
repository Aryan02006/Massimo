import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { verifyPaymentSignature } from "@/lib/razorpay";

export async function POST(request: NextRequest) {
  try {
    const authCookie = request.cookies.get("massimo-auth");

    if (!authCookie || !ObjectId.isValid(authCookie.value)) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 },
      );
    }

    const userId = authCookie.value;
    const body = await request.json();

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      customer,
      items,
      subtotal,
      delivery,
      discount,
      coupon,
      total,
    } = body;

    if (!customer || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, message: "Invalid order data" },
        { status: 400 },
      );
    }

    if (
      !customer.name?.trim() ||
      !customer.phone?.trim() ||
      !customer.address?.trim() ||
      !customer.city?.trim() ||
      !customer.pincode?.trim()
    ) {
      return NextResponse.json(
        { success: false, message: "Missing customer details" },
        { status: 400 },
      );
    }

    // Verify signature
    const isValid = verifyPaymentSignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });

    if (!isValid) {
      return NextResponse.json(
        { success: false, message: "Invalid payment signature" },
        { status: 400 },
      );
    }

    const client = await clientPromise;
    const db = client.db("Massimo");
    const orders = db.collection("orders");

    const order = {
      userId: new ObjectId(userId),
      customer: {
        name: customer.name.trim(),
        phone: customer.phone.trim(),
        address: customer.address.trim(),
        city: customer.city.trim(),
        pincode: customer.pincode.trim(),
        notes: customer.notes?.trim() || "",
      },
      items: items.map(
        (item: {
          id: string;
          title: string;
          price: number;
          img?: string;
          quantity: number;
          option?: string;
        }) => ({
          id: item.id,
          title: item.title,
          price: item.price,
          img: item.img || null,
          quantity: item.quantity,
          option: item.option || null,
        }),
      ),
      subtotal: Number(subtotal) || 0,
      delivery: Number(delivery) || 0,
      discount: Number(discount) || 0,
      coupon: coupon || null,
      total: Number(total) || 0,
      status: "Confirmed",
      paymentStatus: "Paid",
      paymentMethod: "Razorpay",
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      createdAt: new Date(),
    };

    const result = await orders.insertOne(order);

    return NextResponse.json({
      success: true,
      message: "Payment verified and order placed successfully",
      orderId: result.insertedId.toString(),
      paymentId: razorpay_payment_id,
    });
  } catch (error: unknown) {
    console.error("Payment verification error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
