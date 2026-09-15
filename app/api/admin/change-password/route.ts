import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import clientPromise from "@/lib/mongodb";
import { verifyAdminAuth } from "@/lib/adminAuth";

export async function POST(request: NextRequest) {
  try {
    const { admin, error } = await verifyAdminAuth(request);
    if (!admin || error) {
      return (
        error ||
        NextResponse.json(
          { success: false, message: "Unauthorized admin access" },
          { status: 401 }
        )
      );
    }

    const { currentPassword, newPassword, confirmPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, message: "Current and new passwords are required" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, message: "New password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      return NextResponse.json(
        { success: false, message: "New passwords do not match" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("Massimo");
    const admins = db.collection("admins");

    const adminDoc = await admins.findOne({ _id: admin._id });
    if (!adminDoc) {
      return NextResponse.json(
        { success: false, message: "Admin account not found" },
        { status: 404 }
      );
    }

    const passwordMatch = await bcrypt.compare(currentPassword, adminDoc.password);
    if (!passwordMatch) {
      return NextResponse.json(
        { success: false, message: "Incorrect current password" },
        { status: 400 }
      );
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await admins.updateOne(
      { _id: admin._id },
      { $set: { password: hashedPassword, updatedAt: new Date() } }
    );

    return NextResponse.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Admin change password error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to change password" },
      { status: 500 }
    );
  }
}
