import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";

export async function GET(request: NextRequest) {
  try {
    const authCookie = request.cookies.get("massimo-admin-auth");

    if (!authCookie || !ObjectId.isValid(authCookie.value)) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 },
      );
    }

    const client = await clientPromise;
    const db = client.db("Massimo");
    const [totalOrders, totalProducts, categoriesResult, recentOrders] =
      await Promise.all([
        db.collection("orders").countDocuments(),
        db.collection("products").countDocuments(),
        db.collection("products").distinct("category"),
        db.collection("orders").find({}).sort({ createdAt: -1 }).toArray(),
      ]);

    const serializedOrders = recentOrders.map((order) => ({
      _id: order._id.toString(),
      customer: order.customer,
      items: order.items,
      total: order.total,
      status: order.status,
      createdAt: order.createdAt,
    }));

    return NextResponse.json({
      success: true,
      stats: {
        totalOrders,
        totalProducts,
        totalCategories: categoriesResult.length,
      },
      recentOrders: serializedOrders,
    });
  } catch (error) {
    console.error("Stats error:", error);

    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
