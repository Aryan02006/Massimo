"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import AdminShell from "@/components/admin/AdminShell";
import Image from "next/image";

interface OrderItem {
  id: string;
  title: string;
  price: number;
  img?: string | null;
  quantity: number;
  option?: string | null;
}

interface Customer {
  name: string;
  phone: string;
  address: string;
  city: string;
  pincode: string;
  notes?: string;
}

interface Order {
  _id: string;
  userId?: string | null;
  customer: Customer;
  items: OrderItem[];
  subtotal: number;
  delivery: number;
  discount: number;
  coupon?: { code: string; type: string; value: number } | null;
  total: number;
  status: string;
  paymentMethod?: string;
  paymentStatus?: string;
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  createdAt: string;
}

interface OrderStats {
  total: number;
  confirmed: number;
  preparing: number;
  outForDelivery: number;
  delivered: number;
  cancelled: number;
  totalRevenue: number;
}

const statusOptions = [
  "Confirmed",
  "Preparing",
  "Out for Delivery",
  "Delivered",
  "Cancelled",
];

const statusStyles: Record<
  string,
  { bg: string; text: string; ring: string; dot: string }
> = {
  Confirmed: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    ring: "ring-blue-600/20",
    dot: "bg-blue-500",
  },
  Preparing: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    ring: "ring-amber-600/20",
    dot: "bg-amber-500",
  },
  "Out for Delivery": {
    bg: "bg-purple-50",
    text: "text-purple-700",
    ring: "ring-purple-600/20",
    dot: "bg-purple-500",
  },
  Delivered: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    ring: "ring-emerald-600/20",
    dot: "bg-emerald-500",
  },
  Cancelled: {
    bg: "bg-red-50",
    text: "text-red-700",
    ring: "ring-red-600/20",
    dot: "bg-red-500",
  },
};

const defaultStatusStyle = {
  bg: "bg-gray-50",
  text: "text-gray-700",
  ring: "ring-gray-600/20",
  dot: "bg-gray-400",
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderStats>({
    total: 0,
    confirmed: 0,
    preparing: 0,
    outForDelivery: 0,
    delivered: 0,
    cancelled: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deleteModalOrder, setDeleteModalOrder] = useState<Order | null>(null);
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/orders", {
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders || []);
        if (data.stats) {
          setStats(data.stats);
        }
      } else {
        showToast(data.message || "Failed to fetch orders", "error");
      }
    } catch (err) {
      console.error("Failed to load orders:", err);
      showToast("Error loading orders", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      setUpdatingId(orderId);
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ orderId, status: newStatus }),
      });
      const data = await res.json();

      if (data.success) {
        setOrders((prev) =>
          prev.map((o) =>
            o._id === orderId ? { ...o, status: newStatus } : o,
          ),
        );
        if (selectedOrder && selectedOrder._id === orderId) {
          setSelectedOrder((prev) =>
            prev ? { ...prev, status: newStatus } : null,
          );
        }
        showToast(
          `Order #${orderId.slice(-6).toUpperCase()} marked as ${newStatus}`,
        );
        const statsRes = await fetch("/api/admin/orders", {
          credentials: "include",
        });
        const statsData = await statsRes.json();
        if (statsData.success && statsData.stats) {
          setStats(statsData.stats);
        }
      } else {
        showToast(data.message || "Failed to update status", "error");
      }
    } catch (err) {
      console.error("Status update error:", err);
      showToast("Error updating order status", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteOrder = async () => {
    if (!deleteModalOrder) return;
    const orderId = deleteModalOrder._id;
    try {
      const res = await fetch(`/api/admin/orders?id=${orderId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();

      if (data.success) {
        setOrders((prev) => prev.filter((o) => o._id !== orderId));
        if (selectedOrder?._id === orderId) {
          setSelectedOrder(null);
        }
        setDeleteModalOrder(null);
        showToast(`Order #${orderId.slice(-6).toUpperCase()} deleted`);
        const statsRes = await fetch("/api/admin/orders", {
          credentials: "include",
        });
        const statsData = await statsRes.json();
        if (statsData.success && statsData.stats) {
          setStats(statsData.stats);
        }
      } else {
        showToast(data.message || "Failed to delete order", "error");
      }
    } catch (err) {
      console.error("Delete order error:", err);
      showToast("Error deleting order", "error");
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesStatus =
        statusFilter === "All" ||
        (order.status || "").toLowerCase() === statusFilter.toLowerCase();

      const term = searchQuery.toLowerCase().trim();
      if (!term) return matchesStatus;

      const customerName = (order.customer?.name || "").toLowerCase();
      const customerPhone = (order.customer?.phone || "").toLowerCase();
      const customerCity = (order.customer?.city || "").toLowerCase();
      const orderId = order._id.toLowerCase();

      const matchesSearch =
        customerName.includes(term) ||
        customerPhone.includes(term) ||
        customerCity.includes(term) ||
        orderId.includes(term);

      return matchesStatus && matchesSearch;
    });
  }, [orders, statusFilter, searchQuery]);

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const money = (amount: number) => `₹${Number(amount || 0).toFixed(2)}`;

  return (
    <AdminShell
      title="Orders Management"
      subtitle="Track customer orders, manage statuses and deliveries"
      actions={
        <button
          onClick={() => fetchOrders()}
          className="flex items-center gap-2 rounded-full border border-red-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-red-500 shadow-xs transition hover:bg-red-50"
        >
          <svg
            className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
            />
          </svg>
          Refresh
        </button>
      }
    >
      {/* KPI Stats Cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-2xl border border-red-100 bg-white p-4 shadow-xs gap-5 transition hover:shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Total Orders
          </p>
          <p className="mt-1 text-2xl font-black text-gray-800">
            {stats.total}
          </p>
        </div>

        <div className="rounded-2xl border border-blue-100 bg-white p-4 shadow-xs transition hover:shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-500">
            Confirmed
          </p>
          <p className="mt-1 text-2xl font-black text-blue-700">
            {stats.confirmed}
          </p>
        </div>

        <div className="rounded-2xl border border-amber-100 bg-white p-4 shadow-xs transition hover:shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-500">
            Preparing
          </p>
          <p className="mt-1 text-2xl font-black text-amber-700">
            {stats.preparing}
          </p>
        </div>

        <div className="rounded-2xl border border-purple-100 bg-white p-4 shadow-xs transition hover:shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-purple-500">
            On Delivery
          </p>
          <p className="mt-1 text-2xl font-black text-purple-700">
            {stats.outForDelivery}
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-xs transition hover:shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-500">
            Delivered
          </p>
          <p className="mt-1 text-2xl font-black text-emerald-700">
            {stats.delivered}
          </p>
        </div>

        {/* <div className="rounded-2xl border border-red-100 bg-white p-4 shadow-xs transition hover:shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-red-500">
            Total Sales
          </p>
          <p className="mt-1 text-2xl font-black text-red-600">
            {money(stats.totalRevenue)}
          </p>
        </div> */}
      </div>

      <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-red-100 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto">
          {[
            "All",
            "Confirmed",
            "Preparing",
            "Out for Delivery",
            "Delivered",
            "Cancelled",
          ].map((tab) => {
            const isActive = statusFilter.toLowerCase() === tab.toLowerCase();
            return (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider transition ${
                  isActive
                    ? "bg-red-500 text-white shadow-xs"
                    : "bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600"
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search order ID, customer, phone..."
            className="w-full rounded-full border border-red-100 bg-gray-50/50 py-2 pl-9 pr-4 text-xs font-medium text-gray-800 placeholder-gray-400 focus:border-red-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-100"
          />
          <svg
            className="absolute left-3 top-2.5 h-4 w-4 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
            />
          </svg>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-2.5 text-xs font-bold text-gray-400 hover:text-red-500"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Orders Table */}
      <div className="overflow-hidden rounded-2xl border border-red-100 bg-white shadow-xs">
        {loading ? (
          <div className="divide-y divide-red-50 p-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="flex animate-pulse items-center justify-between py-4"
              >
                <div className="space-y-2">
                  <div className="h-4 w-28 rounded bg-red-100" />
                  <div className="h-3 w-48 rounded bg-gray-100" />
                </div>
                <div className="h-6 w-20 rounded-full bg-red-50" />
              </div>
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-500">
              <svg
                className="h-7 w-7"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
                />
              </svg>
            </div>
            <h3 className="text-base font-bold text-gray-800">
              No Orders Found
            </h3>
            <p className="mt-1 text-xs text-gray-400">
              {searchQuery || statusFilter !== "All"
                ? "Try adjusting your filters or search query."
                : "Customer orders will appear here once placed."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-red-50 bg-red-50/40 text-[11px] font-bold uppercase tracking-wider text-red-500">
                  <th className="px-5 py-3.5">Order ID</th>
                  <th className="px-5 py-3.5">Customer</th>
                  <th className="px-5 py-3.5">Items</th>
                  <th className="px-5 py-3.5">Total Amount</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-red-50 text-xs">
                {filteredOrders.map((order) => {
                  const status =
                    statusStyles[order.status] || defaultStatusStyle;
                  const isUpdating = updatingId === order._id;

                  return (
                    <tr
                      key={order._id}
                      className="transition hover:bg-red-50/30"
                    >
                      {/* Order ID */}
                      <td className="whitespace-nowrap px-5 py-4 font-mono font-bold text-gray-900">
                        <span className="rounded-lg bg-red-50 px-2.5 py-1 text-red-600">
                          #{order._id.slice(-6).toUpperCase()}
                        </span>
                      </td>

                      {/* Customer */}
                      <td className="px-5 py-4">
                        <p className="font-bold text-gray-800">
                          {order.customer?.name || "Anonymous"}
                        </p>
                        <p className="text-[11px] text-gray-400">
                          {order.customer?.phone || "No phone"} •{" "}
                          {order.customer?.city || ""}
                        </p>
                      </td>

                      {/* Items */}
                      <td className="max-w-xs truncate px-5 py-4 text-gray-600">
                        <span className="font-semibold text-gray-800">
                          {order.items?.length || 0}{" "}
                          {order.items?.length === 1 ? "item" : "items"}
                        </span>
                        <p className="truncate text-[11px] text-gray-400">
                          {order.items
                            ?.map((i) => `${i.title} (${i.quantity})`)
                            .join(", ")}
                        </p>
                      </td>

                      {/* Total & Payment */}
                      <td className="whitespace-nowrap px-5 py-4">
                        <div className="font-extrabold text-red-600">
                          {money(order.total)}
                        </div>
                        <div className="mt-0.5 flex items-center gap-1">
                          {/* <span
                            className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${
                              order.paymentStatus === "Paid" || order.paymentMethod === "Razorpay"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {order.paymentMethod === "Razorpay" ? "💳 Razorpay" : order.paymentMethod || "COD"}
                          </span> */}
                        </div>
                      </td>

                      {/* Status + Dropdown */}
                      <td className="whitespace-nowrap px-5 py-4">
                        <div className="relative inline-block">
                          <select
                            disabled={isUpdating}
                            value={order.status}
                            onChange={(e) =>
                              handleStatusChange(order._id, e.target.value)
                            }
                            className={`cursor-pointer appearance-none rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-center ring-1 transition focus:outline-none ${
                              status.bg
                            } ${status.text} ${status.ring} ${
                              isUpdating ? "opacity-50" : ""
                            }`}
                          >
                            {statusOptions.map((st) => (
                              <option
                                key={st}
                                value={st}
                                className="bg-white text-gray-800"
                              >
                                {st}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="whitespace-nowrap px-5 py-4 text-gray-400">
                        {formatDate(order.createdAt)}
                      </td>

                      {/* Actions */}
                      <td className="whitespace-nowrap px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="rounded-lg bg-red-50 p-2 text-red-600 transition hover:bg-red-500 hover:text-white"
                            title="View Order Details"
                          >
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={2}
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={() => setDeleteModalOrder(order)}
                            className="rounded-lg bg-gray-100 p-2 text-gray-500 transition hover:bg-red-100 hover:text-red-600"
                            title="Delete Order"
                          >
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={2}
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                              />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-red-100 bg-white p-6 shadow-2xl sm:p-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-red-100 pb-4">
              <div>
                <div className="flex items-center gap-3">
                  <span className="rounded-lg bg-red-50 px-3 py-1 font-mono text-sm font-bold text-red-600">
                    #{selectedOrder._id.slice(-6).toUpperCase()}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ring-1 ${
                      statusStyles[selectedOrder.status]?.bg ||
                      defaultStatusStyle.bg
                    } ${
                      statusStyles[selectedOrder.status]?.text ||
                      defaultStatusStyle.text
                    } ${
                      statusStyles[selectedOrder.status]?.ring ||
                      defaultStatusStyle.ring
                    }`}
                  >
                    {selectedOrder.status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-400">
                  Placed on {formatDate(selectedOrder.createdAt)}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="rounded-full p-2 text-gray-400 hover:bg-red-50 hover:text-red-500"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18 18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="mt-6 space-y-6">
              {/* Customer Information Card */}
              <div className="rounded-2xl border border-red-100 bg-red-50/30 p-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-red-500">
                  Customer & Delivery Details
                </h4>
                <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
                  <div>
                    <span className="text-gray-400">Name:</span>{" "}
                    <span className="font-bold text-gray-800">
                      {selectedOrder.customer?.name}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Phone:</span>{" "}
                    <a
                      href={`tel:${selectedOrder.customer?.phone}`}
                      className="font-bold text-red-500 underline"
                    >
                      {selectedOrder.customer?.phone}
                    </a>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-gray-400">Address:</span>{" "}
                    <span className="font-semibold text-gray-800">
                      {selectedOrder.customer?.address},{" "}
                      {selectedOrder.customer?.city} -{" "}
                      {selectedOrder.customer?.pincode}
                    </span>
                  </div>
                  {selectedOrder.customer?.notes && (
                    <div className="sm:col-span-2 rounded-xl bg-amber-50 p-2.5 text-amber-800">
                      <span className="font-bold">Note from Customer:</span>{" "}
                      {selectedOrder.customer.notes}
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Details Card */}
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/30 p-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                  Payment Information
                </h4>
                <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
                  <div>
                    <span className="text-gray-400">Payment Method:</span>{" "}
                    <span className="font-bold text-gray-800">
                      {selectedOrder.paymentMethod || "Razorpay Online"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Payment Status:</span>{" "}
                    <span className="inline-flex items-center gap-1 font-bold text-emerald-600">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                      {selectedOrder.paymentStatus || "Paid"}
                    </span>
                  </div>
                  {selectedOrder.razorpayPaymentId && (
                    <div className="sm:col-span-2">
                      <span className="text-gray-400">
                        Razorpay Payment ID:
                      </span>{" "}
                      <span className="font-mono font-bold text-slate-700">
                        {selectedOrder.razorpayPaymentId}
                      </span>
                    </div>
                  )}
                  {selectedOrder.razorpayOrderId && (
                    <div className="sm:col-span-2">
                      <span className="text-gray-400">Razorpay Order ID:</span>{" "}
                      <span className="font-mono text-gray-600">
                        {selectedOrder.razorpayOrderId}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Items List */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
                  Ordered Items ({selectedOrder.items?.length || 0})
                </h4>
                <div className="divide-y divide-red-50 rounded-2xl border border-red-100 bg-white">
                  {selectedOrder.items?.map((item, idx) => (
                    <div
                      key={`${item.id}-${idx}`}
                      className="flex items-center justify-between p-3.5 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        {item.img && (
                          <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl border border-red-100 bg-gray-50">
                            <Image
                              src={item.img}
                              alt={item.title}
                              fill
                              className="object-contain"
                            />
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-gray-800">
                            {item.title}
                          </p>
                          {item.option && (
                            <p className="text-[10px] font-semibold text-red-500">
                              Option: {item.option}
                            </p>
                          )}
                          <p className="text-[11px] text-gray-400">
                            {item.quantity} × {money(item.price)}
                          </p>
                        </div>
                      </div>
                      <p className="font-bold text-gray-800">
                        {money(item.price * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-red-100 bg-gray-50/60 p-4 text-xs space-y-2">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal:</span>
                  <span>{money(selectedOrder.subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery Fee:</span>
                  <span>{money(selectedOrder.delivery)}</span>
                </div>
                {selectedOrder.discount > 0 && (
                  <div className="flex justify-between font-semibold text-emerald-600">
                    <span>
                      Discount ({selectedOrder.coupon?.code || "Coupon"}):
                    </span>
                    <span>-{money(selectedOrder.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-red-100 pt-2 text-sm font-black text-red-600">
                  <span>Grand Total:</span>
                  <span>{money(selectedOrder.total)}</span>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                  Update Order Status
                </p>
                <div className="flex flex-wrap gap-2">
                  {statusOptions.map((st) => (
                    <button
                      key={st}
                      disabled={updatingId === selectedOrder._id}
                      onClick={() => handleStatusChange(selectedOrder._id, st)}
                      className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider transition ${
                        selectedOrder.status === st
                          ? "bg-red-500 text-white shadow-xs"
                          : "border border-red-100 bg-white text-gray-600 hover:bg-red-50 hover:text-red-500"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="mt-8 flex justify-end gap-3 border-t border-red-100 pt-4">
              <button
                onClick={() => setSelectedOrder(null)}
                className="rounded-full border border-gray-200 bg-white px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-gray-600 hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="rounded-full bg-red-500 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-xs transition hover:bg-red-600"
              >
                Print Invoice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-red-100 bg-white p-6 shadow-2xl text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-500">
              <svg
                className="h-7 w-7"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-800">
              Delete Order #{deleteModalOrder._id.slice(-6).toUpperCase()}?
            </h3>
            <p className="mt-2 text-xs text-gray-500">
              Are you sure you want to permanently delete this order? This
              action cannot be undone.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <button
                onClick={() => setDeleteModalOrder(null)}
                className="rounded-full border border-gray-200 bg-white px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteOrder}
                className="rounded-full bg-red-600 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-xs transition hover:bg-red-700"
              >
                Delete Order
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
