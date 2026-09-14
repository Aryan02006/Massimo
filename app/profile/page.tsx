"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import RequireAuth from "@/components/RequireAuth";
import { logout } from "@/components/auth";

type UserProfile = {
  id: string;
  username: string;
  email: string;
};

const ProfileContent = () => {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [ordersCount, setOrdersCount] = useState<number | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const [meRes, ordersRes] = await Promise.all([
          fetch("/api/me", { credentials: "include" }),
          fetch("/api/orders", { credentials: "include" }),
        ]);

        if (meRes.ok) {
          const meData = await meRes.json();
          if (meData.success && meData.user) {
            setUser(meData.user);
          }
        }

        if (ordersRes.ok) {
          const ordersData = await ordersRes.json();
          if (Array.isArray(ordersData)) {
            setOrdersCount(ordersData.length);
          } else if (ordersData?.orders && Array.isArray(ordersData.orders)) {
            setOrdersCount(ordersData.orders.length);
          }
        }
      } catch (error) {
        console.error("Failed to load profile details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleLogout = async () => {
    const success = await logout();
    if (success) {
      router.push("/login");
      router.refresh();
    } else {
      alert("Unable to logout. Please try again.");
    }
  };

  return (
    <div className="min-h-[calc(100vh-6rem)] bg-gradient-to-b from-red-50/40 to-white px-4 py-8 md:px-12 lg:px-24">
      <div className="mx-auto max-w-4xl">
        {/* Header Breadcrumb */}
        <div className="mb-6 flex items-center gap-2 text-sm text-gray-500">
          <Link href="/" className="hover:text-red-500 transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="font-semibold text-gray-800">My Profile</span>
        </div>

        {/* Profile Card */}
        <div className="overflow-hidden rounded-3xl border border-red-100 bg-white shadow-xl shadow-red-500/5">
          {/* Banner */}
          <div className="h-32 bg-gradient-to-r from-red-500 via-rose-500 to-red-600 px-8 py-6 text-white relative">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
          </div>

          {/* User Info Bar */}
          <div className="relative px-6 pb-8 pt-0 md:px-10">
            <div className="-mt-14 flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
              <div className="flex items-end gap-4">
                <div className="flex h-24 w-24 items-center justify-center rounded-2xl border-4 border-white bg-gradient-to-tr from-red-500 to-rose-400 text-3xl font-black uppercase text-white shadow-lg">
                  {user?.username ? user.username.charAt(0).toUpperCase() : "U"}
                </div>
                <div className="mb-1">
                  <h1 className="text-2xl font-black text-gray-900 md:text-3xl">
                    {user?.username || "Massimo Member"}
                  </h1>
                  <p className="text-sm font-medium text-gray-500">
                    {user?.email || "customer@massimo.com"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-600 border border-emerald-200">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Active Account
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-red-600 transition hover:bg-red-50 hover:border-red-300"
                >
                  <svg
                    className="h-3.5 w-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75"
                    />
                  </svg>
                  Logout
                </button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-8">
              <Link
                href="/orders"
                className="group rounded-2xl border border-red-50 bg-red-50/30 p-5 transition hover:bg-red-50 hover:border-red-200"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                      Total Orders
                    </p>
                    <p className="mt-1 text-2xl font-black text-gray-900">
                      {loading ? "..." : ordersCount !== null ? ordersCount : "0"}
                    </p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-red-500 shadow-sm transition group-hover:scale-110">
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
                      />
                    </svg>
                  </div>
                </div>
              </Link>

              <Link
                href="/cart"
                className="group rounded-2xl border border-red-50 bg-red-50/30 p-5 transition hover:bg-red-50 hover:border-red-200"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                      My Cart
                    </p>
                    <p className="mt-1 text-sm font-bold text-red-600">
                      View items →
                    </p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-red-500 shadow-sm transition group-hover:scale-110">
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.141a48.667 48.667 0 0 0-14.142 0L6.75 9.75M7.5 14.25 6.375 9.75m0 0L4.72 4.272"
                      />
                    </svg>
                  </div>
                </div>
              </Link>

              <Link
                href="/menu"
                className="group rounded-2xl border border-red-50 bg-red-50/30 p-5 transition hover:bg-red-50 hover:border-red-200"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                      Explore Menu
                    </p>
                    <p className="mt-1 text-sm font-bold text-red-600">
                      Browse dishes →
                    </p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-red-500 shadow-sm transition group-hover:scale-110">
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25"
                      />
                    </svg>
                  </div>
                </div>
              </Link>
            </div>

            {/* Account Information Details */}
            <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-6 md:p-8">
              <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <svg
                  className="h-5 w-5 text-red-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                  />
                </svg>
                Account Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                    Username
                  </label>
                  <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-800 shadow-xs">
                    {user?.username || "—"}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                    Email Address
                  </label>
                  <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-800 shadow-xs">
                    {user?.email || "—"}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                    Account ID
                  </label>
                  <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-xs font-mono text-gray-600 shadow-xs">
                    {user?.id || "—"}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                    Membership Tier
                  </label>
                  <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-red-600 shadow-xs flex items-center justify-between">
                    <span>Massimo Gourmet Member</span>
                    <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-bold">
                      Standard
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function ProfilePage() {
  return (
    <RequireAuth>
      <ProfileContent />
    </RequireAuth>
  );
}
