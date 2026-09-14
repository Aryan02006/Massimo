import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { verifyAdminAuth } from "@/lib/adminAuth";

export async function GET(request: NextRequest) {
  try {
    const { admin, error } = await verifyAdminAuth(request);
    if (!admin || error) {
      return (
        error ||
        NextResponse.json(
          { success: false, message: "Unauthorized" },
          { status: 401 }
        )
      );
    }

    const client = await clientPromise;
    const db = client.db("Massimo");

    const categoriesCollection = db.collection("categories");
    const productsCollection = db.collection("products");

    const [categories, products] = await Promise.all([
      categoriesCollection.find({}).toArray(),
      productsCollection.find({}, { projection: { catSlug: 1 } }).toArray(),
    ]);

    // Calculate product counts per category slug
    const productCounts: Record<string, number> = {};
    for (const p of products) {
      if (p.catSlug) {
        const slug = p.catSlug.toLowerCase();
        productCounts[slug] = (productCounts[slug] || 0) + 1;
      }
    }

    const serializedCategories = categories.map((c) => ({
      _id: c._id.toString(),
      slug: c.slug,
      title: c.title,
      desc: c.desc || "",
      img: c.img || "",
      color: c.color || "white",
      createdAt: c.createdAt,
      productCount: productCounts[c.slug.toLowerCase()] || 0,
    }));

    return NextResponse.json({
      success: true,
      categories: serializedCategories,
      total: serializedCategories.length,
    });
  } catch (err) {
    console.error("Admin categories GET error:", err);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { admin, error } = await verifyAdminAuth(request);
    if (!admin || error) {
      return (
        error ||
        NextResponse.json(
          { success: false, message: "Unauthorized" },
          { status: 401 }
        )
      );
    }

    const body = await request.json();
    const { title, slug, desc, img, color } = body;

    if (!title || !title.trim()) {
      return NextResponse.json(
        { success: false, message: "Category title is required" },
        { status: 400 }
      );
    }

    // Generate or clean slug
    const generatedSlug = (slug || title)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    if (!generatedSlug) {
      return NextResponse.json(
        { success: false, message: "Valid slug could not be generated" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("Massimo");
    const categoriesCollection = db.collection("categories");

    // Check if category with same slug already exists
    const existing = await categoriesCollection.findOne({
      slug: generatedSlug,
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          message: `Category with slug "${generatedSlug}" already exists`,
        },
        { status: 400 }
      );
    }

    const newCategory = {
      title: title.trim(),
      slug: generatedSlug,
      desc: (desc || "").trim(),
      img: (img || "").trim() || "/temporary/m1.png",
      color: color === "black" ? "black" : "white",
      createdAt: new Date(),
    };

    const result = await categoriesCollection.insertOne(newCategory);

    return NextResponse.json({
      success: true,
      message: "Category created successfully",
      category: {
        _id: result.insertedId.toString(),
        ...newCategory,
        productCount: 0,
      },
    });
  } catch (err) {
    console.error("Admin categories POST error:", err);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { admin, error } = await verifyAdminAuth(request);
    if (!admin || error) {
      return (
        error ||
        NextResponse.json(
          { success: false, message: "Unauthorized" },
          { status: 401 }
        )
      );
    }

    const body = await request.json();
    const { _id, id, title, slug, desc, img, color } = body;

    const targetId = _id || id;
    if (!targetId || !ObjectId.isValid(targetId)) {
      return NextResponse.json(
        { success: false, message: "Valid Category ID is required" },
        { status: 400 }
      );
    }

    if (!title || !title.trim()) {
      return NextResponse.json(
        { success: false, message: "Category title is required" },
        { status: 400 }
      );
    }

    const generatedSlug = (slug || title)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const client = await clientPromise;
    const db = client.db("Massimo");
    const categoriesCollection = db.collection("categories");

    // Fetch original category
    const currentCategory = await categoriesCollection.findOne({
      _id: new ObjectId(targetId),
    });

    if (!currentCategory) {
      return NextResponse.json(
        { success: false, message: "Category not found" },
        { status: 404 }
      );
    }

    // Check slug uniqueness if changed
    if (generatedSlug !== currentCategory.slug) {
      const existingSlug = await categoriesCollection.findOne({
        slug: generatedSlug,
        _id: { $ne: new ObjectId(targetId) },
      });

      if (existingSlug) {
        return NextResponse.json(
          {
            success: false,
            message: `Category with slug "${generatedSlug}" already exists`,
          },
          { status: 400 }
        );
      }

      // Update products that reference the old slug
      await db.collection("products").updateMany(
        { catSlug: currentCategory.slug },
        { $set: { catSlug: generatedSlug } }
      );
    }

    const updateDoc = {
      title: title.trim(),
      slug: generatedSlug,
      desc: (desc || "").trim(),
      img: (img || "").trim() || "/temporary/m1.png",
      color: color === "black" ? "black" : "white",
      updatedAt: new Date(),
    };

    await categoriesCollection.updateOne(
      { _id: new ObjectId(targetId) },
      { $set: updateDoc }
    );

    return NextResponse.json({
      success: true,
      message: "Category updated successfully",
      category: {
        _id: targetId,
        ...updateDoc,
      },
    });
  } catch (err) {
    console.error("Admin categories PUT error:", err);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { admin, error } = await verifyAdminAuth(request);
    if (!admin || error) {
      return (
        error ||
        NextResponse.json(
          { success: false, message: "Unauthorized" },
          { status: 401 }
        )
      );
    }

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("id");

    if (!categoryId || !ObjectId.isValid(categoryId)) {
      return NextResponse.json(
        { success: false, message: "Invalid category ID" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("Massimo");

    const result = await db.collection("categories").deleteOne({
      _id: new ObjectId(categoryId),
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: "Category not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (err) {
    console.error("Admin categories DELETE error:", err);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
