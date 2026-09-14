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

const DELIVERY_FEE = 49;

const money = (amount: number) => `₹${amount.toFixed(2)}`;

type CustomerDetails = {
  name: string;
  phone: string;
  address: string;
  city: string;
  pincode: string;
  notes: string;
};

type PlacedOrderInfo = {
  orderId?: string;
  paymentId?: string;
  paymentMethod: string;
  total: number;
};

const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function CheckoutPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [placed, setPlaced] = useState(false);
  const [placedOrderInfo, setPlacedOrderInfo] = useState<PlacedOrderInfo | null>(null);
  const [placing, setPlacing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"razorpay" | "cod">("razorpay");
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

    // Preload Razorpay checkout script
    loadRazorpayScript();

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

  const validateForm = () => {
    if (!customer.name.trim()) {
      alert("Please enter your name.");
      return false;
    }

    if (!customer.phone.trim()) {
      alert("Please enter your phone number.");
      return false;
    }

    if (!customer.address.trim()) {
      alert("Please enter your delivery address.");
      return false;
    }

    if (!customer.city.trim()) {
      alert("Please enter your city.");
      return false;
    }

    if (!customer.pincode.trim()) {
      alert("Please enter your pincode.");
      return false;
    }

    if (cart.length === 0) {
      alert("Your cart is empty.");
      return false;
    }

    return true;
  };

  const handlePlaceOrder = async () => {
    if (!validateForm()) return;

    setPlacing(true);

    if (paymentMethod === "razorpay") {
      try {
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
          alert("Razorpay SDK failed to load. Please check your internet connection.");
          setPlacing(false);
          return;
        }

        // Create Razorpay Order from backend
        const orderResponse = await fetch("/api/razorpay/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            amount: total,
            currency: "INR",
            notes: {
              customerName: customer.name,
              customerPhone: customer.phone,
            },
          }),
        });

        const orderData = await orderResponse.json();

        if (!orderResponse.ok || !orderData.success) {
          alert(orderData.message || "Failed to initialize payment gateway. Please try again.");
          setPlacing(false);
          return;
        }

        const razorpayKey =
          orderData.keyId ||
          process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
          "rzp_test_Tbu9TJLNylQ579";

        const options = {
          key: razorpayKey,
          amount: orderData.order.amount,
          currency: orderData.order.currency || "INR",
          name: "Massimo Restaurant",
          description: `Payment for ${itemCount} ${itemCount === 1 ? "item" : "items"}`,
          image: "https://cdn-icons-png.flaticon.com/512/1046/1046784.png",
          order_id:
            orderData.order.id && !orderData.order.id.startsWith("order_test_")
              ? orderData.order.id
              : undefined,
          prefill: {
            name: customer.name,
            contact: customer.phone,
          },
          notes: {
            address: `${customer.address}, ${customer.city} - ${customer.pincode}`,
          },
          theme: {
            color: "#ef4444",
          },
          handler: async function (response: any) {
            try {
              const verifyResponse = await fetch("/api/razorpay/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id || orderData.order.id,
                  razorpay_payment_id: response.razorpay_payment_id || `pay_${Date.now()}`,
                  razorpay_signature: response.razorpay_signature || "test_signature",
                  customer,
                  items: cart,
                  subtotal,
                  delivery,
                  discount,
                  coupon: appliedCoupon
                    ? {
                        code: appliedCoupon.code,
                        type: appliedCoupon.type,
                        value: appliedCoupon.value,
                      }
                    : null,
                  total,
                }),
              });

              const verifyData = await verifyResponse.json();

              if (!verifyResponse.ok || !verifyData.success) {
                alert(verifyData.message || "Payment verification failed. Please contact support.");
                setPlacing(false);
                return;
              }

              localStorage.removeItem(CART_STORAGE_KEY);
              window.dispatchEvent(new Event(CART_CHANGED_EVENT));

              setPlacedOrderInfo({
                orderId: verifyData.orderId,
                paymentId: verifyData.paymentId || response.razorpay_payment_id,
                paymentMethod: "Razorpay Online",
                total,
              });

              setPlaced(true);
            } catch (err) {
              console.error("Verification error:", err);
              alert("Something went wrong while verifying payment. Please contact support.");
            } finally {
              setPlacing(false);
            }
          },
          modal: {
            ondismiss: function () {
              setPlacing(false);
            },
          },
        };

        const razorpayInstance = new (window as any).Razorpay(options);
        razorpayInstance.on("payment.failed", function (response: any) {
          alert(`Payment failed: ${response.error?.description || "Transaction declined"}`);
          setPlacing(false);
        });

        razorpayInstance.open();
      } catch (error) {
        console.error("Razorpay initiation error:", error);
        alert("Failed to start payment gateway. Please try again.");
        setPlacing(false);
      }
    } else {
      // Cash on Delivery
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
              ? {
                  code: appliedCoupon.code,
                  type: appliedCoupon.type,
                  value: appliedCoupon.value,
                }
              : null,
            total,
            paymentMethod: "Cash on Delivery",
            paymentStatus: "Pending",
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          alert(data.message || "Failed to place order. Please try again.");
          return;
        }

        localStorage.removeItem(CART_STORAGE_KEY);
        window.dispatchEvent(new Event(CART_CHANGED_EVENT));

        setPlacedOrderInfo({
          orderId: data.orderId,
          paymentMethod: "Cash on Delivery",
          total,
        });

        setPlaced(true);
      } catch (error) {
        console.error("Order error:", error);
        alert("Something went wrong. Please try again.");
      } finally {
        setPlacing(false);
      }
    }
  };

  return (
    <RequireAuth>
      <main className="min-h-[calc(100vh-6rem)] bg-orange-50 px-4 py-8 text-slate-800 md:min-h-[calc(100vh-9rem)] md:py-12 lg:px-20 xl:px-40">
        <div className="mx-auto max-w-7xl">
          {placed ? (
            <section className="mx-auto max-w-md rounded-3xl border border-red-100 bg-white p-8 text-center shadow-lg">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-4xl text-emerald-600 shadow-sm animate-bounce">
                ✓
              </div>

              <h1 className="mt-6 text-3xl font-black uppercase tracking-tight text-red-500">
                Order Confirmed!
              </h1>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                Thank you for ordering with Massimo. We&apos;ve received your order and are preparing it right now.
              </p>

              <div className="mt-6 space-y-2.5 rounded-2xl border border-red-100 bg-orange-50/70 p-5 text-left text-xs">
                {placedOrderInfo?.orderId && (
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-500">Order ID:</span>
                    <span className="font-mono font-bold text-red-600">
                      #{placedOrderInfo.orderId.slice(-6).toUpperCase()}
                    </span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="font-semibold text-slate-500">Payment Method:</span>
                  <span className="font-bold text-slate-800">
                    {placedOrderInfo?.paymentMethod || (paymentMethod === "razorpay" ? "Razorpay Online" : "Cash on Delivery")}
                  </span>
                </div>

                {placedOrderInfo?.paymentId && (
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-500">Payment ID:</span>
                    <span className="font-mono text-[11px] font-semibold text-emerald-700">
                      {placedOrderInfo.paymentId}
                    </span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="font-semibold text-slate-500">Status:</span>
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                    {paymentMethod === "razorpay" ? "Paid (Success)" : "Confirmed (COD)"}
                  </span>
                </div>

                <div className="mt-3 flex justify-between border-t border-red-100 pt-3 text-sm">
                  <span className="font-black text-slate-800">Total Paid</span>
                  <span className="font-black text-red-500">
                    {money(placedOrderInfo?.total ?? total)}
                  </span>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/orders"
                  className="flex-1 rounded-full bg-red-500 py-3.5 text-center text-xs font-black uppercase tracking-wider text-white shadow-md transition hover:bg-red-600"
                >
                  View My Orders
                </Link>
                <Link
                  href="/menu"
                  className="flex-1 rounded-full border border-red-200 bg-white py-3.5 text-center text-xs font-black uppercase tracking-wider text-red-500 transition hover:bg-red-50"
                >
                  Explore Menu
                </Link>
              </div>
            </section>
          ) : (
            <>
              <div className="mb-8 mt-2 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h1 className="text-3xl font-black uppercase text-red-500 md:text-4xl">
                    Checkout
                  </h1>
                  <p className="mt-1 text-sm text-slate-600">
                    Review your order and complete secure payment with Razorpay.
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
                    {/* Order Items */}
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

                    {/* Delivery Details */}
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
                          placeholder="Your phone number (10 digits)"
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
                          placeholder="Any special instructions for the restaurant or driver?"
                          className="mt-2 w-full resize-none rounded-xl border border-red-100 px-3 py-3 text-sm font-normal outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                        />
                      </label>
                    </section>

                    {/* Payment Method Selector */}
                    <section className="rounded-2xl border border-red-100 bg-white p-5 shadow-sm md:p-6">
                      <h2 className="mb-4 text-lg font-black uppercase text-red-500">
                        Payment Method
                      </h2>

                      <div className="grid gap-3 sm:grid-cols-2">
                        {/* Razorpay Option */}
                        <div
                          onClick={() => setPaymentMethod("razorpay")}
                          className={`relative flex cursor-pointer items-center justify-between rounded-2xl border p-4 transition ${
                            paymentMethod === "razorpay"
                              ? "border-red-500 bg-red-50/40 ring-2 ring-red-500/20"
                              : "border-gray-200 bg-white hover:border-red-200"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                                paymentMethod === "razorpay"
                                  ? "border-red-500 bg-red-500 text-white"
                                  : "border-gray-300 bg-white"
                              }`}
                            >
                              {paymentMethod === "razorpay" && (
                                <div className="h-2 w-2 rounded-full bg-white" />
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-black text-slate-800">
                                  Razorpay Online
                                </span>
                                <span className="rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue-600">
                                  Fast & Secure
                                </span>
                              </div>
                              <p className="mt-0.5 text-[11px] text-slate-500">
                                UPI, Cards, Netbanking, Wallets
                              </p>
                            </div>
                          </div>
                          <div className="text-lg font-bold text-blue-600">
                            💳
                          </div>
                        </div>

                        {/* Cash on Delivery Option */}
                        <div
                          onClick={() => setPaymentMethod("cod")}
                          className={`relative flex cursor-pointer items-center justify-between rounded-2xl border p-4 transition ${
                            paymentMethod === "cod"
                              ? "border-red-500 bg-red-50/40 ring-2 ring-red-500/20"
                              : "border-gray-200 bg-white hover:border-red-200"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                                paymentMethod === "cod"
                                  ? "border-red-500 bg-red-500 text-white"
                                  : "border-gray-300 bg-white"
                              }`}
                            >
                              {paymentMethod === "cod" && (
                                <div className="h-2 w-2 rounded-full bg-white" />
                              )}
                            </div>
                            <div>
                              <span className="text-sm font-black text-slate-800">
                                Cash on Delivery
                              </span>
                              <p className="mt-0.5 text-[11px] text-slate-500">
                                Pay with cash when food arrives
                              </p>
                            </div>
                          </div>
                          <div className="text-lg font-bold text-amber-600">
                            💵
                          </div>
                        </div>
                      </div>
                    </section>
                  </div>

                  {/* Summary Sidebar */}
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
                    </dl>

                    {/* Coupon */}
                    <div className="mb-5 border-t border-red-100 pt-4">
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

                    <div className="flex justify-between gap-2 border-t border-red-100 py-4 text-lg">
                      <dt className="font-black uppercase">Total</dt>
                      <dd className="font-black text-red-500">
                        {money(total)}
                      </dd>
                    </div>

                    <button
                      type="button"
                      onClick={handlePlaceOrder}
                      disabled={placing}
                      className="w-full flex items-center justify-center gap-2 rounded-3xl cursor-pointer bg-red-500 px-5 py-4 text-sm font-black uppercase tracking-wide text-white shadow-md transition hover:bg-red-700 focus:outline-none focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {placing ? (
                        <>
                          <svg
                            className="h-4 w-4 animate-spin text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8v8H4z"
                            />
                          </svg>
                          <span>Processing...</span>
                        </>
                      ) : paymentMethod === "razorpay" ? (
                        `Pay with Razorpay · ${money(total)}`
                      ) : (
                        `Place Order (COD) · ${money(total)}`
                      )}
                    </button>

                    <div className="mt-4 flex items-center justify-center gap-2 text-center text-xs text-slate-500">
                      <svg
                        className="h-4 w-4 text-emerald-500"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>256-bit Secure Razorpay Checkout</span>
                    </div>
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
