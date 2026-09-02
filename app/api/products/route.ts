import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET() {
  try {
    const client = await clientPromise;

    const db = client.db("Massimo");

    const products = db.collection("products");

    const result = await products.find({}).toArray();

    return NextResponse.json({
      success: true,
      products: result,
    });
  } catch (error) {
    console.error("Products API error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to fetch products",
      },
      { status: 500 },
    );
  }
}
