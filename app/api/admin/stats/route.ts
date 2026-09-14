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
    const [totalOrders, totalProducts, categoriesCount, distinctCatSlugs, recentOrders] =
      await Promise.all([
        db.collection("orders").countDocuments(),
        db.collection("products").countDocuments(),
        db.collection("categories").countDocuments(),
        db.collection("products").distinct("catSlug"),
        db.collection("orders").find({}).sort({ createdAt: -1 }).toArray(),
      ]);

    const totalCategories =
      categoriesCount > 0
        ? categoriesCount
        : distinctCatSlugs.length > 0
        ? distinctCatSlugs.length
        : 3;

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
        totalCategories,
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
