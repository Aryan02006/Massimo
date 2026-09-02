"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { CART_CHANGED_EVENT, getCart } from "@/components/cart";

const CartIcon = () => {
  const [itemCount, setItemCount] = useState(0);

  useEffect(() => {
    const updateItemCount = () =>
      setItemCount(getCart().reduce((total, item) => total + item.quantity, 0));

    updateItemCount();
    window.addEventListener(CART_CHANGED_EVENT, updateItemCount);
    window.addEventListener("storage", updateItemCount);

    return () => {
      window.removeEventListener(CART_CHANGED_EVENT, updateItemCount);
      window.removeEventListener("storage", updateItemCount);
    };
  }, []);

  return (
    <Link href="/cart" className="flex items-center gap-4 md:gap-2">
      <div className="relative w-8 h-8 md:h-5">
        <Image src="/cart.png" alt="" fill />
      </div>
      <span>Cart ({itemCount})</span>
    </Link>
  );
};

export default CartIcon;
