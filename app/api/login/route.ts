import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import clientPromise from "@/lib/mongodb";

interface LoginRequest {
  username: string;
  password: string;
}

export async function POST(request: NextRequest) {
  try {
    const { username, password }: LoginRequest = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "Username and password are required",
        },
        { status: 400 },
      );
    }

    const trimmedIdentifier = username.trim();
    const client = await clientPromise;
    const db = client.db("Massimo");

    // 1. Check Admin credentials first
    const admins = db.collection("admins");
    const admin = await admins.findOne({
      $or: [
        { username: trimmedIdentifier },
        { email: trimmedIdentifier.toLowerCase() },
      ],
    });

    if (admin) {
      const adminPasswordMatch = await bcrypt.compare(password, admin.password);
      if (adminPasswordMatch) {
        const response = NextResponse.json({
          success: true,
          role: "admin",
          redirectTo: "/admin/dashboard",
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

        // Clear any active customer cookie
        response.cookies.set("massimo-auth", "", {
          httpOnly: true,
          secure: false,
          sameSite: "lax",
          path: "/",
          maxAge: 0,
        });

        return response;
      }
    }

    // 2. Check Customer credentials
    const users = db.collection("users");
    const user = await users.findOne({
      $or: [
        { username: trimmedIdentifier },
        { email: trimmedIdentifier.toLowerCase() },
      ],
    });

    if (user) {
      const userPasswordMatch = await bcrypt.compare(password, user.password);
      if (userPasswordMatch) {
        const response = NextResponse.json({
          success: true,
          role: "customer",
          redirectTo: "/",
          message: "Login successful",
          user: {
            id: user._id.toString(),
            username: user.username,
            email: user.email,
          },
        });

        response.cookies.set("massimo-auth", user._id.toString(), {
          httpOnly: true,
          secure: false,
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 24 * 7,
        });

        // Clear any active admin cookie
        response.cookies.set("massimo-admin-auth", "", {
          httpOnly: true,
          secure: false,
          sameSite: "lax",
          path: "/",
          maxAge: 0,
        });

        return response;
      }
    }

    // 3. Neither matched
    return NextResponse.json(
      {
        success: false,
        message: "Invalid username or password",
      },
      { status: 401 },
    );
  } catch (error) {
    console.error("Login error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 },
    );
  }
}

