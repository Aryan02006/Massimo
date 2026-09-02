import clientPromise from "@/lib/mongodb";
import Link from "next/link";
import React from "react";

const MenuPage = async () => {
  const client = await clientPromise;

  const db = client.db("Massimo");

  const menu = await db.collection("categories").find({}).toArray();

  return (
    <div className="p-4 lg:px-20 xl:px-40 h-[calc(100vh-6rem)] md:h-[calc(100vh-9rem)] flex flex-col md:flex-row items-center">
      {menu.map((category) => (
        <Link
          href={`/menu/${category.slug}`}
          key={category._id.toString()}
          className="w-full h-1/3 bg-cover p-8 md:h-1/2"
          style={{
            backgroundImage: `url(${category.img})`,
          }}
        >
          <div
            className={`${
              category.color === "black" ? "text-black" : "text-white"
            } w-1/2`}
          >
            <h1 className="uppercase font-bold text-3xl">{category.title}</h1>

            <p className="text-sm my-8">{category.desc}</p>

            <button
              className={`hidden 2xl:block ${
                category.color === "black"
                  ? "bg-black text-white"
                  : "bg-white text-red-500"
              } py-2 px-4 rounded-md`}
            >
              Explore
            </button>
          </div>
        </Link>
      ))}
    </div>
  );
};

export default MenuPage;
