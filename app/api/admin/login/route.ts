import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import clientPromise from "@/lib/mongodb";

interface AdminLoginRequest {
  username: string;
  password: string;
}

export async function POST(request: NextRequest) {
  try {
    const { username, password }: AdminLoginRequest = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: "Username and password are required" },
        { status: 400 },
      );
    }

    const client = await clientPromise;
    const db = client.db("Massimo");
    const admins = db.collection("admins");

    const admin = await admins.findOne({ username });

    if (!admin) {
      return NextResponse.json(
        { success: false, message: "Invalid admin credentials" },
        { status: 401 },
      );
    }

    const passwordMatch = await bcrypt.compare(password, admin.password);

    if (!passwordMatch) {
      return NextResponse.json(
        { success: false, message: "Invalid admin credentials" },
        { status: 401 },
      );
    }

    const response = NextResponse.json({
      success: true,
      message: "Admin login successful",
      admin: {
        id: admin._id.toString(),
        username: admin.username,
      },
    });

    response.cookies.set("massimo-admin-auth", admin._id.toString(), {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error("Admin login error:", error);

    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
