"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/components/auth";
import { addToCart } from "@/components/cart";

type Props = {
  price: number;
  id: string;
  title: string;
  img?: string;
  options?: { title: string; additionalPrice: number }[];
};

const Price = ({ price, id, title, img, options }: Props) => {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [selected, setSelected] = useState(0);
  const selectedOption =
    options && options.length > 0 ? options[selected] : null;
  const unitPrice = price + (selectedOption?.additionalPrice ?? 0);
  const total = quantity * unitPrice;

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-2xl font-bold">${total.toFixed(2)}</h2>

      <div className="flex gap-4">
        {options?.map((option, index) => (
          <button
            key={option.title}
            className="min-w-24 p-2 ring-1 ring-red-400 rounded-md cursor-pointer"
            style={{
              background: selected === index ? "rgb(248 113 113)" : "white",
              color: selected === index ? "white" : "red",
            }}
            onClick={() => setSelected(index)}
          >
            {option.title}
          </button>
        ))}
      </div>
      <div className="flex justify-between items-center">
        {/* QUANTITY */}
        <div className="flex justify-between w-full p-3 ring-1 ring-red-500">
          <span>Quantity</span>
          <div className="flex gap-4 items-center">
            <button
              onClick={() => setQuantity((prev) => (prev > 1 ? prev - 1 : 1))}
            >
              {"<"}
            </button>
            <span>{quantity}</span>
            <button
              onClick={() => setQuantity((prev) => (prev < 9 ? prev + 1 : 9))}
            >
              {">"}
            </button>
          </div>
        </div>
        {/* CART BUTTON */}
        <button
          className="uppercase w-56 bg-red-500 text-white p-3 ring-1 ring-red-500 cursor-pointer"
          onClick={async () => {
            if (!(await isAuthenticated())) {
              router.push("/login");
              return;
            }

            addToCart({
              id,
              title,
              price: unitPrice,
              img,
              option: selectedOption?.title,
              quantity,
            });
          }}
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
};

export default Price;
