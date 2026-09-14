import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { verifyAdminAuth } from "@/lib/adminAuth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { admin, error } = await verifyAdminAuth(request);
    if (!admin || error) {
      return error || NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid product ID" },
        { status: 400 },
      );
    }

    const client = await clientPromise;
    const db = client.db("Massimo");
    const product = await db.collection("products").findOne({
      _id: new ObjectId(id),
    });

    if (!product) {
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      product: {
        ...product,
        _id: product._id.toString(),
      },
    });
  } catch (err) {
    console.error("Admin single product GET error:", err);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { admin, error } = await verifyAdminAuth(request);
    if (!admin || error) {
      return error || NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid product ID" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const { title, desc, price, catSlug, img, options, isFeatured } = body;

    if (!title || !title.trim()) {
      return NextResponse.json(
        { success: false, message: "Product title is required" },
        { status: 400 },
      );
    }

    if (price === undefined || isNaN(Number(price)) || Number(price) < 0) {
      return NextResponse.json(
        { success: false, message: "Valid product price is required" },
        { status: 400 },
      );
    }

    const formattedOptions = Array.isArray(options)
      ? options
          .filter((opt) => opt && opt.title && opt.title.trim())
          .map((opt) => ({
            title: opt.title.trim(),
            additionalPrice: Number(opt.additionalPrice) || 0,
          }))
      : [];

    const updateDoc = {
      title: title.trim(),
      desc: (desc || "").trim(),
      price: Number(price),
      catSlug: (catSlug || "pizzas").trim().toLowerCase(),
      img: (img || "").trim() || "/temporary/p1.png",
      options: formattedOptions,
      isFeatured: Boolean(isFeatured),
      updatedAt: new Date(),
    };

    const client = await clientPromise;
    const db = client.db("Massimo");
    const result = await db.collection("products").updateOne(
      { _id: new ObjectId(id) },
      { $set: updateDoc },
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Product updated successfully",
      product: {
        _id: id,
        ...updateDoc,
      },
    });
  } catch (err) {
    console.error("Admin single product PUT error:", err);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { admin, error } = await verifyAdminAuth(request);
    if (!admin || error) {
      return error || NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid product ID" },
        { status: 400 },
      );
    }

    const client = await clientPromise;
    const db = client.db("Massimo");
    const result = await db.collection("products").deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (err) {
    console.error("Admin single product DELETE error:", err);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
