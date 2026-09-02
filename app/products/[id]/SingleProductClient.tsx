"use client";

import React from "react";
import Price from "@/components/Price";
import RequireAuth from "@/components/RequireAuth";
import Image from "next/image";

type SingleProductClientProps = {
  id: string;
  title: string;
  desc?: string;
  img?: string;
  price: number;
  options?: { title: string; additionalPrice: number }[];
};

const SingleProductClient = ({
  id,
  title,
  desc,
  img,
  price,
  options,
}: SingleProductClientProps) => {
  return (
    <RequireAuth>
      <div className="p-4 lg:px-20 xl:px-40 h-screen flex flex-col justify-around text-red-500 md:flex-row md:gap-8 md:items-center">
        {/* IMAGE CONTAINER */}
        {img && (
          <div className="relative w-full h-1/2 md:h-[70%]">
            <Image src={img} alt={title} className="object-contain" fill />
          </div>
        )}

        <div className="h-1/2 flex flex-col gap-4 md:h-[70%] md:justify-center md:gap-6 xl:gap-8">
          <h1 className="text-3xl font-bold uppercase xl:text-5xl">{title}</h1>
          <p>{desc}</p>
          <Price
            price={price}
            id={id}
            title={title}
            img={img}
            options={options}
          />
        </div>
      </div>
    </RequireAuth>
  );
};

export default SingleProductClient;
