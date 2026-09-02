import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";

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

    const { customer, items, subtotal, delivery, discount, coupon, total } =
      body;

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
      createdAt: new Date(),
    };

    const result = await orders.insertOne(order);

    return NextResponse.json({
      success: true,
      message: "Order placed successfully",
      orderId: result.insertedId.toString(),
    });
  } catch (error) {
    console.error("Create order error:", error);

    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const authCookie = request.cookies.get("massimo-auth");

    if (!authCookie || !ObjectId.isValid(authCookie.value)) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 },
      );
    }

    const userId = authCookie.value;
    const client = await clientPromise;
    const db = client.db("Massimo");
    const orders = db.collection("orders");

    const userOrders = await orders
      .find({ userId: new ObjectId(userId) })
      .sort({ createdAt: -1 })
      .toArray();

    const serialized = userOrders.map((order) => ({
      ...order,
      _id: order._id.toString(),
      userId: order.userId.toString(),
    }));

    return NextResponse.json({
      success: true,
      orders: serialized,
    });
  } catch (error) {
    console.error("Fetch orders error:", error);

    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
