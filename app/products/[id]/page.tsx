import React from "react";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import SingleProductClient from "./SingleProductClient";

type Product = {
  _id: string;
  title: string;
  desc?: string;
  img?: string;
  price: number;
  catSlug: string;
  options?: { title: string; additionalPrice: number }[];
};

const SingleProductPage = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await params;

  const client = await clientPromise;
  const db = client.db("Massimo");

  let product: Product | null = null;

  // Try to find by ObjectId first, then fall back to string id
  try {
    const result = await db
      .collection("products")
      .findOne({ _id: new ObjectId(id) });
    if (result) {
      product = {
        ...result,
        _id: result._id.toString(),
      } as unknown as Product;
    }
  } catch {
    // If id is not a valid ObjectId, try as a string field
    const result = await db.collection("products").findOne({ slug: id });
    if (result) {
      product = {
        ...result,
        _id: result._id.toString(),
      } as unknown as Product;
    }
  }

  if (!product) {
    return <p className="p-4 text-red-500">Product not found.</p>;
  }

  return (
    <SingleProductClient
      id={product._id}
      title={product.title}
      desc={product.desc}
      img={product.img}
      price={product.price}
      options={product.options}
    />
  );
};

export default SingleProductPage;
