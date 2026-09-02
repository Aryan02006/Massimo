"use client";

import React, { useEffect, useState } from "react";
import Menu from "./Menu";
import Link from "next/link";
import CartICon from "@/components/CartIcon";
import { logout } from "@/components/auth";
import { usePathname, useRouter } from "next/navigation";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/menu", label: "Menu" },
  { href: "/orders", label: "Orders" },
  { href: "/contact", label: "Contact" },
];

const NavbarPage = () => {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

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
        } else {
          setUser(false);
        }
      } catch (error) {
        console.error("Authentication check failed:", error);
        setUser(false);
      } finally {
        setCheckingAuth(false);
      }
    };

    checkAuthentication();
  }, [pathname]);

  const handleLogout = async () => {
    const success = await logout();

    if (success) {
      setUser(false);
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
          className="text-xl font-black uppercase tracking-[0.18em] transition-colors hover:text-red-700 md:flex-1 md:text-center"
        >
          Massimo
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

              <button
                onClick={handleLogout}
                className="rounded-full border border-red-200 px-4 py-2 text-sm font-bold uppercase tracking-wide transition-colors hover:border-red-500 hover:bg-red-50"
              >
                LOGOUT
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default NavbarPage;
