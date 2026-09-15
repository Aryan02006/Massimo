"use client";

import React, { useEffect, useRef, useState } from "react";
import Menu from "./Menu";
import Link from "next/link";
import CartICon from "@/components/CartIcon";
import { logout } from "@/components/auth";
import { usePathname, useRouter } from "next/navigation";
import { useSettings } from "@/context/SettingsContext";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/menu", label: "Menu" },
  { href: "/orders", label: "Orders" },
  { href: "/contact", label: "Contact" },
];

type UserData = {
  id?: string;
  username?: string;
  email?: string;
  role?: string;
};

const NavbarPage = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { settings } = useSettings();

  const [user, setUser] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [imgError, setImgError] = useState(false);

  // Reset image error state when logoUrl changes
  useEffect(() => {
    setImgError(false);
  }, [settings.logoUrl]);

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        const response = await fetch("/api/me", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        const data = await response.json();

        if (response.ok && data.success && data.authenticated) {
          setUser(true);
          setUserData(data.user || null);
        } else {
          setUser(false);
          setUserData(null);
        }
      } catch (error) {
        console.error("Authentication check failed:", error);
        setUser(false);
        setUserData(null);
      } finally {
        setCheckingAuth(false);
      }
    };

    checkAuthentication();
  }, [pathname]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);

  const handleLogout = async () => {
    setDropdownOpen(false);
    const success = await logout();

    if (success) {
      setUser(false);
      setUserData(null);
      router.push("/login");
      router.refresh();
    } else {
      alert("Unable to logout. Please try again.");
    }
  };

  return (
    <header className="sticky top-0 z-30 border-b border-red-100 bg-white/95 text-red-500 shadow-sm backdrop-blur">
      <div className="mx-auto flex h-12 max-w-screen-2xl items-center justify-between px-4 md:h-24 lg:px-20 xl:px-40">
        <nav
          className="hidden flex-1 items-center gap-1 md:flex"
          aria-label="Primary navigation"
        >
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={`rounded-full px-3 py-2 text-sm font-semibold uppercase tracking-wide transition-colors hover:bg-red-50 hover:text-red-600 ${
                pathname === link.href && link.href !== "/"
                  ? "bg-red-50 text-red-600"
                  : ""
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/"
          className="flex items-center gap-2.5 transition-transform duration-200 hover:scale-[1.02] md:flex-1 md:justify-center"
        >
          {settings.logoUrl && !imgError ? (
            <div className="relative flex items-center h-8 md:h-11 max-w-[170px] md:max-w-[220px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={settings.logoUrl}
                alt={settings.restaurantName || "Massimo"}
                className="h-full w-auto max-h-8 md:max-h-11 object-contain"
                onError={() => setImgError(true)}
              />
            </div>
          ) : (
            <span className="text-xl font-black uppercase tracking-[0.18em] text-red-500 transition-colors hover:text-red-700">
              {settings.restaurantName || "Massimo"}
            </span>
          )}
        </Link>

        <div className="md:hidden">
          <Menu />
        </div>

        <div className="hidden flex-1 items-center justify-end gap-3 md:flex">
          {checkingAuth ? null : !user ? (
            <>
              <Link
                href="/login"
                className="rounded-full bg-red-500 px-4 py-2 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-red-700"
              >
                Login
              </Link>

              <Link
                href="/register"
                className="rounded-full border border-red-500 px-4 py-2 text-sm font-bold uppercase tracking-wide text-red-500 transition-colors hover:bg-red-50"
              >
                Register
              </Link>
            </>
          ) : (
            <>
              <div className="rounded-full px-3 py-2 text-sm font-semibold transition-colors hover:bg-red-50">
                <CartICon />
              </div>

              {/* User Icon & Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  aria-expanded={dropdownOpen}
                  aria-label="User profile menu"
                  onClick={() => setDropdownOpen((prev) => !prev)}
                  className={`flex h-10 w-10 items-center justify-center rounded-full border transition-all duration-200 focus:outline-none ${
                    dropdownOpen
                      ? "border-red-500 bg-red-500 text-white shadow-md shadow-red-200"
                      : "border-red-200 bg-red-50 text-red-600 hover:border-red-400 hover:bg-red-100/70"
                  }`}
                >
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
                      d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                    />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 origin-top-right rounded-2xl border border-red-100 bg-white p-2 text-gray-800 shadow-xl ring-1 ring-black/5 z-50 animate-in fade-in zoom-in-95">
                    {userData?.username && (
                      <div className="border-b border-gray-100 px-3 py-2.5">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                            Signed in as
                          </p>
                          {userData?.role === "admin" && (
                            <span className="rounded-full bg-red-100 px-2 py-0.2 text-[10px] font-black uppercase tracking-wider text-red-600">
                              Admin
                            </span>
                          )}
                        </div>
                        <p className="truncate text-sm font-bold text-gray-900">
                          {userData.username}
                        </p>
                        {userData.email && (
                          <p className="truncate text-xs text-gray-500">
                            {userData.email}
                          </p>
                        )}
                      </div>
                    )}

                    <div className="py-1">
                      {userData?.role === "admin" && (
                        <Link
                          href="/admin/dashboard"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-bold text-red-600 transition hover:bg-red-50"
                        >
                          <svg
                            className="h-4 w-4 text-red-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z"
                            />
                          </svg>
                          <span>Admin Dashboard</span>
                        </Link>
                      )}

                      <Link
                        href="/orders"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-red-50 hover:text-red-600"
                      >
                        <svg
                          className="h-4 w-4 text-red-500"
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
                        <span>My Orders</span>
                      </Link>
                    </div>

                    <div className="border-t border-gray-100 pt-1">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
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
                            d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75"
                          />
                        </svg>
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default NavbarPage;
