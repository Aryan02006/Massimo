"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

interface OrderItem {
  title: string;
  quantity: number;
}

interface RecentOrder {
  _id: string;
  customer: { name: string };
  items: OrderItem[];
  total: number;
  status: string;
  createdAt: string;
}

interface Stats {
  totalOrders: number;
  totalProducts: number;
  totalCategories: number;
}

const sidebarLinks = [
  {
    href: "/admin/dashboard",
    label: "Dashboard",
  },
  {
    href: "/admin/orders",
    label: "Orders",
  },
  {
    href: "/admin/products",
    label: "Products",
  },
  {
    href: "/admin/categories",
    label: "Category",
  },
  {
    href: "/admin/settings",
    label: "Settings",
  },
];

export default function AdminDashboardPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState<Stats>({
    totalOrders: 0,
    totalProducts: 0,
    totalCategories: 0,
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [adminName, setAdminName] = useState("");

  useEffect(() => {
    const init = async () => {
      try {
        const meRes = await fetch("/api/admin/me", {
          credentials: "include",
        });
        const meData = await meRes.json();

        if (!meRes.ok || !meData.authenticated) {
          router.replace("/login");
          return;
        }

        setAdminName(meData.admin?.username || "Admin");

        const statsRes = await fetch("/api/admin/stats", {
          credentials: "include",
        });
        const statsData = await statsRes.json();

        if (statsData.success) {
          setStats(statsData.stats);
          setRecentOrders(statsData.recentOrders || []);
        }
      } catch (error) {
        console.error("Dashboard init error:", error);
        router.replace("/login");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", {
        method: "POST",
        credentials: "include",
      });
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed":
        return "bg-blue-50 text-blue-700 ring-blue-600/20";
      case "preparing":
        return "bg-yellow-50 text-yellow-700 ring-yellow-600/20";
      case "delivered":
        return "bg-green-50 text-green-700 ring-green-600/20";
      case "cancelled":
        return "bg-red-50 text-red-700 ring-red-600/20";
      default:
        return "bg-gray-50 text-gray-700 ring-gray-600/20";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-red-500 border-t-transparent" />
          <p className="font-semibold text-red-500">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-red-100 bg-white shadow-sm transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex h-16 items-center justify-between border-b border-red-100 px-5">
          <div>
            <h1 className="text-lg font-black uppercase tracking-[0.15em] text-red-500">
              Massimo
            </h1>
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-gray-400">
              Admin
            </p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 lg:hidden"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
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

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <div className="space-y-1">
            {sidebarLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 rounded-full px-3 py-2.5 text-sm font-semibold uppercase tracking-wide transition-all 
                    ${
                      isActive
                        ? "bg-red-50 text-red-600"
                        : "text-gray-500 hover:bg-red-50 hover:text-red-500"
                    }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="border-t border-red-100 p-3">
          <div className="mb-2 flex items-center gap-3 px-3 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-xs font-bold uppercase text-white">
              {adminName.charAt(0)}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-semibold capitalize">
                {adminName}
              </p>
              <p className="text-[10px] text-gray-400">Administrator</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-full px-3 py-2.5 text-sm font-semibold uppercase tracking-wide text-gray-500 transition-all hover:bg-red-50 hover:text-red-500"
          >
            Logout
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-red-100 bg-white/95 px-4 shadow-sm backdrop-blur lg:px-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-red-50 hover:text-red-500 lg:hidden"
            ></button>
            <div>
              <h2 className="text-lg font-bold text-red-500">Dashboard</h2>
              <p className="text-xs text-gray-400">Welcome back, {adminName}</p>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg border border-red-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
              <p className="text-sm font-medium uppercase text-gray-500">
                Orders
              </p>
              <p className="mt-1 text-3xl font-extrabold">
                {stats.totalOrders}
              </p>
            </div>
            <div className="rounded-lg border border-red-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
              <p className="text-sm font-medium uppercase text-gray-500">
                Products
              </p>
              <p className="mt-1 text-3xl font-extrabold">
                {stats.totalProducts}
              </p>
            </div>

            <div className="rounded-lg border border-red-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md sm:col-span-2 lg:col-span-1">
              <p className="text-sm font-medium uppercase text-gray-500">
                Categories
              </p>
              <p className="mt-1 text-3xl font-extrabold">
                {stats.totalCategories || 3}
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-red-100 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-red-100 px-6 py-4">
              <h3 className="text-base font-bold">Recent Orders</h3>
              <Link
                href="/admin/orders"
                className="rounded-full border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-500 transition-colors hover:bg-red-50"
              >
                View All
              </Link>
            </div>

            {recentOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <p className="text-sm font-medium text-gray-500">
                  No orders yet
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  Orders will appear here once customers place them
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-red-50 bg-red-50/50">
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-red-500">
                        Order
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-red-500">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-red-500">
                        Items
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-red-500">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-red-500">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-red-500">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-red-50">
                    {recentOrders.map((order) => (
                      <tr
                        key={order._id}
                        className="transition-colors hover:bg-red-50/30"
                      >
                        <td className="whitespace-nowrap px-6 py-4">
                          <span className="rounded-md bg-red-50 px-2.5 py-1 font-mono text-xs font-semibold text-red-600">
                            #{order._id.slice(-6).toUpperCase()}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <span className="text-sm font-medium">
                            {order.customer?.name || "N/A"}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <span className="text-sm text-gray-600">
                            {order.items?.length || 0}{" "}
                            {order.items?.length === 1 ? "item" : "items"}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <span className="text-sm font-semibold">
                            ₹{order.total?.toFixed(2) || "0.00"}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${getStatusColor(
                              order.status,
                            )}`}
                          >
                            {order.status}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <span className="text-xs text-gray-500">
                            {formatDate(order.createdAt)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
