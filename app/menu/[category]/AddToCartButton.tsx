"use client";

import React from "react";
import { isAuthenticated } from "@/components/auth";
import { useRouter } from "next/navigation";
import { addToCart } from "@/components/cart";

type AddToCartButtonProps = {
  id: string;
  title: string;
  price: number;
  img?: string;
};

const AddToCartButton = ({ id, title, price, img }: AddToCartButtonProps) => {
  const router = useRouter();

  const handleAddToCart = async () => {
    if (!(await isAuthenticated())) {
      router.push("/login");
      return;
    }

    addToCart({ id, title, price, img });
  };

  return (
    <button
      className="hidden group-hover:block uppercase bg-red-500 text-white p-2 rounded-md"
      onClick={handleAddToCart}
    >
      Add to Cart
    </button>
  );
};

export default AddToCartButton;
