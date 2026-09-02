"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import RequireAuth from "@/components/RequireAuth";
type Coupon = {
  code: string;
  type: "percentage" | "fixed";
  value: number;
  minimumSubtotal?: number;
};
import {
  CART_CHANGED_EVENT,
  CART_STORAGE_KEY,
  getCart,
  type CartItem,
  updateCartQuantity,
} from "@/components/cart";

const DELIVERY_FEE = 4.99;

const money = (amount: number) => `$${amount.toFixed(2)}`;

type CustomerDetails = {
  name: string;
  phone: string;
  address: string;
  city: string;
  pincode: string;
  notes: string;
};

export default function CheckoutPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [placed, setPlaced] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [coupon, setCoupon] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponMessage, setCouponMessage] = useState("");
  const [customer, setCustomer] = useState<CustomerDetails>({
    name: "",
    phone: "",
    address: "",
    city: "",
    pincode: "",
    notes: "",
  });

  useEffect(() => {
    const refreshCart = () => {
      setCart(getCart());
    };

    refreshCart();

    window.addEventListener(CART_CHANGED_EVENT, refreshCart);
    window.addEventListener("storage", refreshCart);

    return () => {
      window.removeEventListener(CART_CHANGED_EVENT, refreshCart);
      window.removeEventListener("storage", refreshCart);
    };
  }, []);

  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  const delivery = cart.length > 0 ? DELIVERY_FEE : 0;

  const discount = appliedCoupon
    ? appliedCoupon.type === "percentage"
      ? subtotal * (appliedCoupon.value / 100)
      : appliedCoupon.value
    : 0;

  const total = Math.max(0, subtotal + delivery - discount);

  const handleCustomerChange = (
    field: keyof CustomerDetails,
    value: string,
  ) => {
    setCustomer((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleApplyCoupon = async () => {
    if (!coupon.trim()) {
      setAppliedCoupon(null);
      setCouponMessage("Please enter a coupon code.");
      return;
    }

    try {
      const response = await fetch("/api/coupons", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          code: coupon.trim().toUpperCase(),
          subtotal,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setAppliedCoupon(null);
        setCouponMessage(data.message || "That coupon code is not valid.");
        return;
      }

      setAppliedCoupon(data.coupon);
      setCoupon(data.coupon.code);
      setCouponMessage("Coupon applied successfully.");
    } catch (error) {
      console.error("Coupon error:", error);

      setAppliedCoupon(null);
      setCouponMessage("Unable to validate coupon. Please try again.");
    }
  };

  const handlePlaceOrder = async () => {
    if (!customer.name.trim()) {
      alert("Please enter your name.");
      return;
    }

    if (!customer.phone.trim()) {
      alert("Please enter your phone number.");
      return;
    }

    if (!customer.address.trim()) {
      alert("Please enter your delivery address.");
      return;
    }

    if (!customer.city.trim()) {
      alert("Please enter your city.");
      return;
    }

    if (!customer.pincode.trim()) {
      alert("Please enter your pincode.");
      return;
    }

    if (cart.length === 0) {
      alert("Your cart is empty.");
      return;
    }

    setPlacing(true);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          customer,
          items: cart,
          subtotal,
          delivery,
          discount,
          coupon: appliedCoupon
            ? { code: appliedCoupon.code, type: appliedCoupon.type, value: appliedCoupon.value }
            : null,
          total,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Failed to place order. Please try again.");
        return;
      }

      // Clear cart from localStorage and notify listeners
      localStorage.removeItem(CART_STORAGE_KEY);
      window.dispatchEvent(new Event(CART_CHANGED_EVENT));

      setPlaced(true);
    } catch (error) {
      console.error("Order error:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setPlacing(false);
    }
  };

  return (
    <RequireAuth>
      <main className="min-h-[calc(100vh-6rem)] bg-orange-50 px-4 py-8 text-slate-800 md:min-h-[calc(100vh-9rem)] md:py-12 lg:px-20 xl:px-40">
        <div className="mx-auto max-w-7xl">
          {placed ? (
            <section className="mx-auto max-w-md rounded-2xl border border-red-100 bg-white p-8 text-center shadow-sm">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl text-green-600">
                ✓
              </div>

              <h1 className="mt-5 text-3xl font-black uppercase text-red-500">
                Order Placed
              </h1>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                Thanks for ordering with Massimo. We&apos;ll start preparing
                your food right away.
              </p>

              <div className="mt-6 rounded-xl bg-orange-50 p-4 text-left">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Payment</span>

                  <span className="font-medium uppercase">Card</span>
                </div>

                <div className="mt-3 flex justify-between border-t border-red-100 pt-3">
                  <span className="font-bold">Total</span>

                  <span className="font-black text-red-500">
                    {money(total)}
                  </span>
                </div>
              </div>

              <Link
                href="/menu"
                className="mt-6 inline-flex rounded-full bg-red-500 px-6 py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-red-700"
              >
                Continue Browsing
              </Link>
            </section>
          ) : (
            <>
              <div className="mb-8 mt-2 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h1 className="text-3xl font-black uppercase text-red-500 md:text-4xl">
                    Checkout
                  </h1>

                  <p className="mt-1 text-sm text-slate-600">
                    Review your order and delivery details.
                  </p>
                </div>
              </div>

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
                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_23rem]">
                  <div className="space-y-6">
                    <section className="rounded-2xl border border-red-100 bg-white p-5 shadow-sm md:p-6">
                      <div className="mb-5 flex items-center justify-between border-b border-red-100 pb-4">
                        <h2 className="text-lg font-black uppercase text-red-500">
                          Your Order
                        </h2>

                        <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-500">
                          {itemCount} {itemCount === 1 ? "item" : "items"}
                        </span>
                      </div>

                      <div className="divide-y divide-red-100">
                        {cart.map((item) => (
                          <article
                            key={`${item.id}-${item.option ?? "default"}`}
                            className="flex gap-3 py-4 first:pt-0 last:pb-0 sm:gap-4"
                          >
                            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-orange-50">
                              {item.img ? (
                                <Image
                                  src={item.img}
                                  alt={item.title}
                                  fill
                                  sizes="80px"
                                  className="object-contain p-1"
                                />
                              ) : (
                                <div className="flex h-full items-center justify-center text-2xl">
                                  🍽️
                                </div>
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <h3 className="font-bold uppercase text-slate-800">
                                {item.title}
                              </h3>

                              {item.option && (
                                <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                  {item.option}
                                </p>
                              )}

                              <p className="mt-2 text-sm font-bold text-red-500">
                                {money(item.price)} each
                              </p>

                              <div className="mt-3 inline-flex items-center rounded-full border border-red-200 bg-white p-1">
                                <button
                                  type="button"
                                  aria-label={`Decrease ${item.title} quantity`}
                                  onClick={() =>
                                    updateCartQuantity(
                                      item.id,
                                      item.option,
                                      item.quantity - 1,
                                    )
                                  }
                                  className="flex h-7 w-7 items-center justify-center rounded-full font-bold text-red-500 hover:bg-red-50"
                                >
                                  −
                                </button>

                                <span className="w-8 text-center text-sm font-bold">
                                  {item.quantity}
                                </span>

                                <button
                                  type="button"
                                  aria-label={`Increase ${item.title} quantity`}
                                  onClick={() =>
                                    updateCartQuantity(
                                      item.id,
                                      item.option,
                                      item.quantity + 1,
                                    )
                                  }
                                  className="flex h-7 w-7 items-center justify-center rounded-full bg-red-500 font-bold text-white hover:bg-red-700"
                                >
                                  +
                                </button>
                              </div>
                            </div>

                            <p className="whitespace-nowrap pt-1 font-black text-slate-800">
                              {money(item.price * item.quantity)}
                            </p>
                          </article>
                        ))}
                      </div>
                    </section>

                    <section className="rounded-2xl border border-red-100 bg-white p-5 shadow-sm md:p-6">
                      <h2 className="mb-5 text-lg font-black uppercase text-red-500">
                        Delivery Details
                      </h2>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field
                          label="Full Name"
                          placeholder="Your name"
                          value={customer.name}
                          onChange={(value) =>
                            handleCustomerChange("name", value)
                          }
                        />

                        <Field
                          label="Phone Number"
                          placeholder="Your phone number"
                          type="tel"
                          value={customer.phone}
                          onChange={(value) =>
                            handleCustomerChange("phone", value)
                          }
                        />

                        <Field
                          label="Delivery Address"
                          placeholder="House number, street, area"
                          className="sm:col-span-2"
                          value={customer.address}
                          onChange={(value) =>
                            handleCustomerChange("address", value)
                          }
                        />

                        <Field
                          label="City"
                          placeholder="Your city"
                          value={customer.city}
                          onChange={(value) =>
                            handleCustomerChange("city", value)
                          }
                        />

                        <Field
                          label="Pincode"
                          placeholder="Pincode"
                          inputMode="numeric"
                          value={customer.pincode}
                          onChange={(value) =>
                            handleCustomerChange("pincode", value)
                          }
                        />
                      </div>

                      <label className="mt-4 block text-xs font-bold uppercase tracking-wide text-slate-600">
                        Delivery Notes
                        <textarea
                          rows={3}
                          value={customer.notes}
                          onChange={(event) =>
                            handleCustomerChange("notes", event.target.value)
                          }
                          placeholder="Any special instructions?"
                          className="mt-2 w-full resize-none rounded-xl border border-red-100 px-3 py-3 text-sm font-normal outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                        />
                      </label>
                    </section>
                  </div>

                  <aside className="h-fit rounded-2xl border border-red-100 bg-white p-5 shadow-sm lg:sticky lg:top-28 md:p-6">
                    <h2 className="border-b border-red-100 pb-4 text-lg font-black uppercase text-red-500">
                      Order Summary
                    </h2>

                    <dl className="space-y-4 py-5 text-sm">
                      <div className="flex justify-between gap-4">
                        <dt className="text-slate-500">Subtotal</dt>

                        <dd className="font-bold">{money(subtotal)}</dd>
                      </div>

                      <div className="flex justify-between gap-4">
                        <dt className="text-slate-500">Delivery Fee</dt>

                        <dd className="font-bold">{money(delivery)}</dd>
                      </div>

                      {appliedCoupon && (
                        <div className="flex justify-between gap-4 text-green-600">
                          <dt className="font-medium">
                            Discount ({appliedCoupon.code})
                          </dt>

                          <dd className="font-bold">−{money(discount)}</dd>
                        </div>
                      )}

                      {/* <div className="flex justify-between gap-4 border-t border-red-100 pt-4 text-lg">
                        <dt className="font-black uppercase">Total</dt>

                        <dd className="font-black text-red-500">
                          {money(total)}
                        </dd>
                      </div> */}
                    </dl>

                    <div className="mb-5 border-red-100">
                      <label
                        htmlFor="coupon"
                        className="block text-xs font-bold uppercase tracking-wide text-slate-600"
                      >
                        Coupon Code
                      </label>

                      <div className="mt-2 flex gap-2">
                        <input
                          id="coupon"
                          type="text"
                          value={coupon}
                          onChange={(event) => setCoupon(event.target.value)}
                          placeholder="Enter coupon code"
                          className="min-w-0 flex-1 rounded-xl border border-red-100 px-3 py-3 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                        />

                        <button
                          type="button"
                          onClick={handleApplyCoupon}
                          className="rounded-xl border cursor-pointer border-red-500 px-4 py-3 text-xs font-black uppercase tracking-wide text-red-500 transition hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                        >
                          Apply
                        </button>
                      </div>

                      {couponMessage && (
                        <p
                          className={`mt-2 text-xs ${appliedCoupon ? "text-green-600" : "text-red-500"}`}
                          role="status"
                        >
                          {couponMessage}
                        </p>
                      )}
                    </div>

                    <div className="flex justify-between gap-2 border-red-100 pt-2 text-lg">
                      <dt className="font-black uppercase">Total</dt>

                      <dd className="font-black text-red-500">
                        {money(total)}
                      </dd>
                    </div>

                    <button
                      type="button"
                      onClick={handlePlaceOrder}
                      disabled={placing}
                      className="w-full rounded-3xl cursor-pointer bg-red-500 px-5 py-4 text-sm font-black uppercase tracking-wide text-white transition hover:bg-red-700 focus:outline-none focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {placing ? "Placing Order…" : `Place Order · ${money(total)}`}
                    </button>

                    <p className="mt-4 text-center text-xs leading-5 text-slate-500">
                      Your order is securely processed by Massimo.
                    </p>
                  </aside>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </RequireAuth>
  );
}

type FieldProps = {
  label: string;
  placeholder: string;
  type?: string;
  className?: string;
  inputMode?: "numeric";
  value: string;
  onChange: (value: string) => void;
};

function Field({
  label,
  placeholder,
  type = "text",
  className = "",
  inputMode,
  value,
  onChange,
}: FieldProps) {
  return (
    <label
      className={`block text-xs font-bold uppercase tracking-wide text-slate-600 ${className}`}
    >
      {label}

      <input
        type={type}
        inputMode={inputMode}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full rounded-xl border border-red-100 px-3 py-3 text-sm font-normal outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
      />
    </label>
  );
}
