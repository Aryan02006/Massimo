import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";

export async function GET(request: NextRequest) {
  try {
    const authCookie = request.cookies.get("massimo-admin-auth");

    if (!authCookie) {
      return NextResponse.json(
        { success: false, 
          authenticated: false, 
          message: "Not authenticated" 
        },
        { status: 401 },
      );
    }

    const adminId = authCookie.value;

    if (!ObjectId.isValid(adminId)) {
      return NextResponse.json(
        {
          success: false,
          authenticated: false,
          message: "Invalid authentication",
        },
        { status: 401 },
      );
    }

    const client = await clientPromise;
    const db = client.db("Massimo");
    const admins = db.collection("admins");

    const admin = await admins.findOne({ _id: new ObjectId(adminId) });

    if (!admin) {
      return NextResponse.json(
        { success: false, authenticated: false, message: "Admin not found" },
        { status: 401 },
      );
    }

    return NextResponse.json({
      success: true,
      authenticated: true,
      admin: {
        id: admin._id.toString(),
        username: admin.username,
      },
    });
  } catch (error) {
    console.error("Admin me API error:", error);

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
