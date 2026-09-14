import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";

export interface AdminUser {
  _id: ObjectId;
  username: string;
}

export async function verifyAdminAuth(request: NextRequest): Promise<{
  admin: AdminUser | null;
  error?: NextResponse;
}> {
  try {
    const authCookie = request.cookies.get("massimo-admin-auth");

    if (!authCookie || !ObjectId.isValid(authCookie.value)) {
      return {
        admin: null,
        error: NextResponse.json(
          { success: false, message: "Unauthorized admin access" },
          { status: 401 },
        ),
      };
    }

    const client = await clientPromise;
    const db = client.db("Massimo");
    const admin = (await db.collection("admins").findOne({
      _id: new ObjectId(authCookie.value),
    })) as AdminUser | null;

    if (!admin) {
      return {
        admin: null,
        error: NextResponse.json(
          { success: false, message: "Admin user not found" },
          { status: 401 },
        ),
      };
    }

    return { admin };
  } catch (error) {
    console.error("Admin auth verification error:", error);
    return {
      admin: null,
      error: NextResponse.json(
        { success: false, message: "Internal server error" },
        { status: 500 },
      ),
    };
  }
}
