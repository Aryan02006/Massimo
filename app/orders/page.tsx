"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import RequireAuth from "@/components/RequireAuth";

type OrderItem = {
  id: string;
  title: string;
  price: number;
  img?: string | null;
  quantity: number;
  option?: string | null;
};

type Order = {
  _id: string;
  customer: {
    name: string;
    phone: string;
    address: string;
    city: string;
    pincode: string;
    notes: string;
  };
  items: OrderItem[];
  subtotal: number;
  delivery: number;
  discount: number;
  coupon?: { code: string; type: string; value: number } | null;
  total: number;
  status: string;
  createdAt: string;
};

const money = (amount: number) => `$${amount.toFixed(2)}`;

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const statusConfig: Record<string, { bg: string; text: string; dot: string }> =
  {
    Confirmed: {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      dot: "bg-emerald-500",
    },
    Preparing: {
      bg: "bg-amber-50",
      text: "text-amber-700",
      dot: "bg-amber-500",
    },
    "Out for Delivery": {
      bg: "bg-blue-50",
      text: "text-blue-700",
      dot: "bg-blue-500",
    },
    Delivered: {
      bg: "bg-green-50",
      text: "text-green-700",
      dot: "bg-green-500",
    },
    Cancelled: {
      bg: "bg-red-50",
      text: "text-red-600",
      dot: "bg-red-500",
    },
  };

const defaultStatus = {
  bg: "bg-slate-50",
  text: "text-slate-700",
  dot: "bg-slate-500",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch("/api/orders", {
          method: "GET",
          credentials: "include",
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setOrders(data.orders);
        }
      } catch (error) {
        console.error("Failed to fetch orders:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  return (
    <RequireAuth>
      <main className="min-h-[calc(100vh-6rem)] bg-orange-50 px-4 py-8 text-slate-800 md:min-h-[calc(100vh-9rem)] md:py-12 lg:px-20 xl:px-40">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8 mt-2">
            <h1 className="text-2xl font-black uppercase text-red-500 md:text-4xl">
              My Orders
            </h1>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="animate-pulse rounded-2xl border border-red-100 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="h-4 w-28 rounded-full bg-red-100" />
                      <div className="h-3 w-40 rounded-full bg-orange-100" />
                    </div>

                    <div className="h-6 w-16 rounded-full bg-red-100" />
                  </div>
                </div>
              ))}
            </div>
          ) : orders.length === 0 ? (
            <section className="rounded-2xl border border-red-100 bg-white p-10 text-center shadow-sm">
              <h2 className="mt-5 text-xl font-black uppercase text-red-500">
                No Orders Yet
              </h2>

              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-600">
                You have not placed any orders yet. Explore our menu and
                treat yourself to something delicious!
              </p>

              <Link
                href="/menu"
                className="mt-6 inline-flex rounded-full bg-red-500 px-6 py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-red-700"
              >
                Explore Menu
              </Link>
            </section>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => {
                const status = statusConfig[order.status] || defaultStatus;
                const itemSummary = order.items
                  .map(
                    (item) =>
                      `${item.title}${item.quantity > 1 ? ` ×${item.quantity}` : ""}`,
                  )
                  .join(", ");

                return (
                  <article
                    key={order._id}
                    className="rounded-2xl border border-red-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h2 className="text-sm font-black uppercase tracking-wide text-slate-800">
                        Order #{order._id.slice(-6).toUpperCase()}
                      </h2>

                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${status.bg} ${status.text}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${status.dot}`}
                        />
                        {order.status}
                      </span>
                    </div>

                    <p className="mt-2 text-sm leading-relaxed text-slate-600 line-clamp-2">
                      {itemSummary}
                    </p>

                    <div className="mt-3 flex items-center justify-between border-t border-red-50 pt-3">
                      <span className="text-xs text-slate-400">
                        {formatDate(order.createdAt)}
                      </span>

                      <span className="text-base font-black text-red-500">
                        {money(order.total)}
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </RequireAuth>
  );
}
