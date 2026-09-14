"use client";

import React, { useEffect, useState } from "react";
import RequireAuth from "@/components/RequireAuth";
import Image from "next/image";
import Link from "next/link";
import {
  CART_CHANGED_EVENT,
  getCart,
  removeFromCart,
  type CartItem,
  updateCartQuantity,
} from "@/components/cart";

const CartPage = () => {
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    const refreshCart = () => setCart(getCart());
    refreshCart();
    window.addEventListener(CART_CHANGED_EVENT, refreshCart);
    window.addEventListener("storage", refreshCart);

    return () => {
      window.removeEventListener(CART_CHANGED_EVENT, refreshCart);
      window.removeEventListener("storage", refreshCart);
    };
  }, []);

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <RequireAuth>
      <div className="min-h-[calc(100vh-6rem)] p-4 text-red-500 md:min-h-[calc(100vh-9rem)] lg:px-20 xl:px-40">
        <h1 className="mb-6 text-3xl font-bold uppercase">Your Cart</h1>
        {cart.length === 0 ? (
          <section className="rounded-2xl border border-red-100 bg-white p-8 text-center shadow-sm">
            <div className="text-5xl">🛒</div>

            <h2 className="mt-4 text-xl font-black uppercase text-red-500">
              Your Cart Is Empty
            </h2>

            <p className="mt-2 text-sm text-slate-600">
              Choose something delicious before checking out.
            </p>

            <Link
              href="/menu"
              className="mt-6 inline-flex rounded-full bg-red-500 px-6 py-3 text-sm font-bold uppercase tracking-wide text-white hover:bg-red-700"
            >
              Explore Menu
            </Link>
          </section>
        ) : (
          <div className="space-y-4">
            {cart.map((item) => (
              <div
                key={`${item.id}-${item.option ?? "default"}`}
                className="flex items-center gap-4 border-b border-red-200 pb-4"
              >
                {item.img && (
                  <Image
                    src={item.img}
                    alt={item.title}
                    width={80}
                    height={80}
                    className="h-20 w-20 object-contain"
                  />
                )}
                <div className="flex-1">
                  <h2 className="font-bold uppercase">{item.title}</h2>
                  {item.option && <p className="text-sm">{item.option}</p>}
                  <p>₹{item.price.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    aria-label={`Decrease ${item.title} quantity`}
                    onClick={() =>
                      updateCartQuantity(
                         item.id,
                        item.option,
                        item.quantity - 1,
                      )
                    }
                  >
                    −
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    aria-label={`Increase ${item.title} quantity`}
                    onClick={() =>
                      updateCartQuantity(
                        item.id,
                        item.option,
                        item.quantity + 1,
                      )
                    }
                  >
                    +
                  </button>
                </div>
                <button
                  className="rounded-md cursor-pointer bg-red-500 px-3 py-2 text-white"
                  onClick={() => removeFromCart(item.id, item.option)}
                >
                  Remove
                </button>
              </div>
            ))}
            <p className="pt-4 text-2xl font-bold">
              Total: ₹{total.toFixed(2)}
            </p>
            <Link
              href="/checkout"
              className="block w-full rounded-md bg-red-500 px-5 py-3 text-center font-bold uppercase text-white transition-colors hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Checkout
            </Link>
          </div>
        )}
      </div>
    </RequireAuth>
  );
};

export default CartPage;
