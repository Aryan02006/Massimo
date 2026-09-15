import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";

export async function GET(request: NextRequest) {
  try {
    const adminAuthCookie = request.cookies.get("massimo-admin-auth");
    const userAuthCookie = request.cookies.get("massimo-auth");

    const client = await clientPromise;
    const db = client.db("Massimo");

    // 1. Check if logged in as Admin
    if (adminAuthCookie && ObjectId.isValid(adminAuthCookie.value)) {
      const admin = await db.collection("admins").findOne({
        _id: new ObjectId(adminAuthCookie.value),
      });

      if (admin) {
        return NextResponse.json({
          success: true,
          authenticated: true,
          user: {
            id: admin._id.toString(),
            username: admin.username,
            email: admin.email || `${admin.username.toLowerCase()}@massimo.admin`,
            role: "admin",
          },
        });
      }
    }

    // 2. Check if logged in as Customer
    if (userAuthCookie && ObjectId.isValid(userAuthCookie.value)) {
      const user = await db.collection("users").findOne({
        _id: new ObjectId(userAuthCookie.value),
      });

      if (user) {
        return NextResponse.json({
          success: true,
          authenticated: true,
          user: {
            id: user._id.toString(),
            username: user.username,
            email: user.email,
            role: "customer",
          },
        });
      }
    }

    return NextResponse.json(
      {
        success: false,
        authenticated: false,
        message: "Not authenticated",
      },
      { status: 401 },
    );
  } catch (error) {
    console.error("GET /api/me error:", error);
    return NextResponse.json(
      {
        success: false,
        authenticated: false,
        message: "Internal server error",
      },
      { status: 500 },
    );
  }
}
