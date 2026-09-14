import { NextRequest, NextResponse } from "next/server";
import { ObjectId, Filter } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { verifyAdminAuth } from "@/lib/adminAuth";

export async function GET(request: NextRequest) {
  try {
    const { admin, error } = await verifyAdminAuth(request);
    if (!admin || error) {
      return error || NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    const client = await clientPromise;
    const db = client.db("Massimo");
    const productsCollection = db.collection("products");
    const categoriesCollection = db.collection("categories");

    const query: Filter<Record<string, unknown>> = {};

    if (category && category !== "all") {
      query.catSlug = category;
    }

    if (search && search.trim()) {
      const term = search.trim();
      query.$or = [
        { title: { $regex: term, $options: "i" } },
        { desc: { $regex: term, $options: "i" } },
        { catSlug: { $regex: term, $options: "i" } },
      ];
    }

    const [products, categories] = await Promise.all([
      productsCollection.find(query).toArray(),
      categoriesCollection.find({}).toArray(),
    ]);

    const serializedProducts = products.map((p) => ({
      _id: p._id.toString(),
      id: p.id || p._id.toString(),
      title: p.title,
      desc: p.desc || "",
      img: p.img || "",
      price: typeof p.price === "number" ? p.price : Number(p.price) || 0,
      catSlug: p.catSlug || "pizzas",
      options: Array.isArray(p.options) ? p.options : [],
      isFeatured: !!p.isFeatured,
      createdAt: p.createdAt,
    }));

    const serializedCategories = categories.map((c) => ({
      _id: c._id.toString(),
      slug: c.slug,
      title: c.title,
      desc: c.desc || "",
      img: c.img || "",
      color: c.color || "white",
    }));

    // Stats
    const totalProducts = products.length;
    const avgPrice =
      totalProducts > 0
        ? serializedProducts.reduce((sum, p) => sum + p.price, 0) /
          totalProducts
        : 0;

    return NextResponse.json({
      success: true,
      products: serializedProducts,
      categories: serializedCategories,
      stats: {
        totalProducts,
        totalCategories: serializedCategories.length,
        featuredCount: serializedProducts.filter((p) => p.isFeatured).length,
        avgPrice: Number(avgPrice.toFixed(2)),
      },
    });
  } catch (err) {
    console.error("Admin products GET error:", err);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { admin, error } = await verifyAdminAuth(request);
    if (!admin || error) {
      return error || NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
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

    if (!catSlug || !catSlug.trim()) {
      return NextResponse.json(
        { success: false, message: "Product category is required" },
        { status: 400 },
      );
    }

    const client = await clientPromise;
    const db = client.db("Massimo");
    const productsCollection = db.collection("products");

    // Clean options
    const formattedOptions = Array.isArray(options)
      ? options
          .filter((opt) => opt && opt.title && opt.title.trim())
          .map((opt) => ({
            title: opt.title.trim(),
            additionalPrice: Number(opt.additionalPrice) || 0,
          }))
      : [];

    const newProduct = {
      title: title.trim(),
      desc: (desc || "").trim(),
      price: Number(price),
      catSlug: catSlug.trim().toLowerCase(),
      img: (img || "").trim() || "/temporary/p1.png",
      options: formattedOptions,
      isFeatured: Boolean(isFeatured),
      createdAt: new Date(),
    };

    const result = await productsCollection.insertOne(newProduct);

    return NextResponse.json({
      success: true,
      message: "Product created successfully",
      productId: result.insertedId.toString(),
      product: {
        _id: result.insertedId.toString(),
        ...newProduct,
      },
    });
  } catch (err) {
    console.error("Admin products POST error:", err);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { admin, error } = await verifyAdminAuth(request);
    if (!admin || error) {
      return error || NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { _id, id, title, desc, price, catSlug, img, options, isFeatured } =
      body;

    const targetId = _id || id;
    if (!targetId || !ObjectId.isValid(targetId)) {
      return NextResponse.json(
        { success: false, message: "Valid Product ID is required" },
        { status: 400 },
      );
    }

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

    const client = await clientPromise;
    const db = client.db("Massimo");

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

    const result = await db
      .collection("products")
      .updateOne({ _id: new ObjectId(targetId) }, { $set: updateDoc });

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
        _id: targetId,
        ...updateDoc,
      },
    });
  } catch (err) {
    console.error("Admin products PUT error:", err);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { admin, error } = await verifyAdminAuth(request);
    if (!admin || error) {
      return error || NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("id");

    if (!productId || !ObjectId.isValid(productId)) {
      return NextResponse.json(
        { success: false, message: "Invalid product ID" },
        { status: 400 },
      );
    }

    const client = await clientPromise;
    const db = client.db("Massimo");
    const result = await db.collection("products").deleteOne({
      _id: new ObjectId(productId),
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
    console.error("Admin products DELETE error:", err);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
