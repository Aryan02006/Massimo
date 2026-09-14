import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
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

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, message: "No file provided for upload" },
        { status: 400 }
      );
    }

    // Check file type
    const validTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/svg+xml",
      "image/gif",
      "image/avif",
    ];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid file type. Please upload a valid image (PNG, JPG, WEBP, SVG, GIF, AVIF)",
        },
        { status: 400 }
      );
    }

    // Max file size: 10MB
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, message: "Image size exceeds maximum limit (10MB)" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });

    // Generate safe filename
    const originalName = file.name || "upload.png";
    const extension = path.extname(originalName) || ".png";
    const cleanBaseName = path
      .basename(originalName, extension)
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .substring(0, 50);
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    const finalFileName = `${cleanBaseName}-${uniqueSuffix}${extension}`;

    const filePath = path.join(uploadsDir, finalFileName);
    await writeFile(filePath, buffer);

    const publicUrl = `/uploads/${finalFileName}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName: finalFileName,
      message: "Image uploaded successfully",
    });
  } catch (err) {
    console.error("Image upload error:", err);
    return NextResponse.json(
      { success: false, message: "Failed to upload image" },
      { status: 500 }
    );
  }
}
