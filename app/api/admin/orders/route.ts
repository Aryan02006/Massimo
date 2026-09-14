import { NextRequest, NextResponse } from "next/server";
import { ObjectId, Filter } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { verifyAdminAuth } from "@/lib/adminAuth";

export async function GET(request: NextRequest) {
  try {
    const { admin, error } = await verifyAdminAuth(request);
    if (!admin || error) {
      return error || NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const client = await clientPromise;
    const db = client.db("Massimo");
    const ordersCollection = db.collection("orders");

    const query: Filter<Record<string, unknown>> = {};

    if (status && status !== "All") {
      query.status = { $regex: new RegExp(`^${status}$`, "i") };
    }

    if (search && search.trim()) {
      const term = search.trim();
      const searchConditions: Filter<Record<string, unknown>>[] = [
        { "customer.name": { $regex: term, $options: "i" } },
        { "customer.phone": { $regex: term, $options: "i" } },
        { "customer.city": { $regex: term, $options: "i" } },
        { "customer.address": { $regex: term, $options: "i" } },
      ];

      if (ObjectId.isValid(term)) {
        searchConditions.push({ _id: new ObjectId(term) });
      }

      query.$or = searchConditions;
    }

    const [orders, allOrders] = await Promise.all([
      ordersCollection.find(query).sort({ createdAt: -1 }).toArray(),
      ordersCollection.find({}).project({ total: 1, status: 1 }).toArray(),
    ]);

    const serializedOrders = orders.map((order) => ({
      _id: order._id.toString(),
      userId: order.userId ? order.userId.toString() : null,
      customer: order.customer || {},
      items: order.items || [],
      subtotal: order.subtotal || 0,
      delivery: order.delivery || 0,
      discount: order.discount || 0,
      coupon: order.coupon || null,
      total: order.total || 0,
      status: order.status || "Confirmed",
      paymentStatus: order.paymentStatus || (order.paymentMethod === "Razorpay" ? "Paid" : "Pending"),
      paymentMethod: order.paymentMethod || "Razorpay",
      razorpayPaymentId: order.razorpayPaymentId || null,
      razorpayOrderId: order.razorpayOrderId || null,
      createdAt: order.createdAt,
    }));

    const stats = {
      total: allOrders.length,
      confirmed: allOrders.filter((o) => (o.status || "").toLowerCase() === "confirmed").length,
      preparing: allOrders.filter((o) => (o.status || "").toLowerCase() === "preparing").length,
      outForDelivery: allOrders.filter(
        (o) => (o.status || "").toLowerCase() === "out for delivery",
      ).length,
      delivered: allOrders.filter((o) => (o.status || "").toLowerCase() === "delivered").length,
      cancelled: allOrders.filter((o) => (o.status || "").toLowerCase() === "cancelled").length,
      totalRevenue: allOrders.reduce((sum, o) => sum + (o.total || 0), 0),
    };

    return NextResponse.json({
      success: true,
      orders: serializedOrders,
      stats,
    });
  } catch (err) {
    console.error("Admin orders GET error:", err);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { admin, error } = await verifyAdminAuth(request);
    if (!admin || error) {
      return error || NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { orderId, status } = body;

    if (!orderId || !ObjectId.isValid(orderId)) {
      return NextResponse.json(
        { success: false, message: "Invalid order ID" },
        { status: 400 },
      );
    }

    const validStatuses = [
      "Confirmed",
      "Preparing",
      "Out for Delivery",
      "Delivered",
      "Cancelled",
    ];

    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, message: "Invalid status value" },
        { status: 400 },
      );
    }

    const client = await clientPromise;
    const db = client.db("Massimo");
    const result = await db.collection("orders").updateOne(
      { _id: new ObjectId(orderId) },
      {
        $set: {
          status,
          updatedAt: new Date(),
        },
      },
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: `Order status updated to ${status}`,
    });
  } catch (err) {
    console.error("Admin orders PATCH error:", err);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { admin, error } = await verifyAdminAuth(request);
    if (!admin || error) {
      return error || NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("id");

    if (!orderId || !ObjectId.isValid(orderId)) {
      return NextResponse.json(
        { success: false, message: "Invalid order ID" },
        { status: 400 },
      );
    }

    const client = await clientPromise;
    const db = client.db("Massimo");
    const result = await db.collection("orders").deleteOne({
      _id: new ObjectId(orderId),
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Order deleted successfully",
    });
  } catch (err) {
    console.error("Admin orders DELETE error:", err);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
