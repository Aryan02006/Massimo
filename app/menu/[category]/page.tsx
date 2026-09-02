import clientPromise from "@/lib/mongodb";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import AddToCartButton from "./AddToCartButton";

type Product = {
  _id: string;
  title: string;
  desc?: string;
  img?: string;
  price: number;
  catSlug: string;
};

const CategoryPage = async ({
  params,
}: {
  params: Promise<{ category: string }>;
}) => {
  const { category } = await params;
  const client = await clientPromise;
  const db = client.db("Massimo");

  const products = await db
    .collection("products")
    .find({ catSlug: category })
    .toArray();

  if (products.length === 0) {
    return (
      <div className="p-8 text-center text-red-500">
        <p className="text-lg">No products found.</p>
      </div>
    );
  }


  return (
    <div className="flex flex-wrap text-red-500">
      {products.map((item) => {
        const product = item as unknown as Product;
        return (
          <div
            className="w-full h-[60vh] border-r-2 border-b-2 border-red-500 sm:w-1/2 lg:w-1/3 p-4 flex flex-col justify-between group odd:bg-fuchsia-50"
            key={product._id.toString()}
          >
            {/* IMAGE CONTAINER */}
            {product.img && (
              <div className="relative h-[80%]">
                <Image
                  src={product.img}
                  alt={product.title}
                  fill
                  className="object-contain"
                />
              </div>
            )}
            {/* TEXT CONTAINER */}
            <div className="flex items-center justify-between font-bold">
              <Link
                href={`/products/${product._id}`}
                className="text-2xl uppercase p-2"
              >
                {product.title}
              </Link>
              <h2 className="group-hover:hidden text-xl">${product.price}</h2>
              <AddToCartButton
                id={product._id.toString()}
                title={product.title}
                price={product.price}
                img={product.img}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CategoryPage;

