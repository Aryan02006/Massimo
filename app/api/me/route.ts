import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";

export async function GET(request: NextRequest) {
  try {
    const authCookie = request.cookies.get("massimo-auth");

    if (!authCookie) {
      return NextResponse.json(
        {
          success: false,
          authenticated: false,
          message: "Not authenticated",
        },
        { status: 401 },
      );
    }

    const userId = authCookie.value;

    if (!ObjectId.isValid(userId)) {
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

    const users = db.collection("users");

    // Find user
    const user = await users.findOne({
      _id: new ObjectId(userId),
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          authenticated: false,
          message: "User not found",
        },
        { status: 401 },
      );
    }

    return NextResponse.json({
      success: true,
      authenticated: true,
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Me API error:", error);

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
