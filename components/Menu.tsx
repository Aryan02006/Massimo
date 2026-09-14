"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import CartICon from "@/components/CartIcon";
import { logout } from "@/components/auth";
import { useRouter } from "next/navigation";

const links = [
  { id: 1, title: "HomePage", url: "/" },
  { id: 2, title: "Menu", url: "/menu" },
  { id: 3, title: "Contact", url: "/contact" },
];

const MenuPage = () => {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const [user, setUser] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const response = await fetch("/api/me", {
          method: "GET",
          credentials: "include",
        });

        if (!response.ok) {
          setUser(false);
          return;
        }

        const data = await response.json();

        if (data.success && data.authenticated) {
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

    checkUser();
  }, []);

  const handleLogout = async () => {
    const success = await logout();

    if (success) {
      setUser(false);
      setOpen(false);

      router.push("/login");
      router.refresh();
    } else {
      alert("Unable to logout. Please try again.");
    }
  };

  return (
    <div>
      {!open ? (
        <button
          aria-label="Open navigation menu"
          onClick={() => setOpen(true)}
          className="rounded-full p-2 transition-colors hover:bg-red-50"
        >
          <Image src="/open.png" alt="" width={20} height={20} />
        </button>
      ) : (
        <button
          aria-label="Close navigation menu"
          onClick={() => setOpen(false)}
          className="relative z-20 rounded-full bg-red-50 p-2"
        >
          <Image src="/close.png" alt="" width={20} height={20} />
        </button>
      )}

      {open && (
        <div className="absolute left-0 top-12 md:top-24 z-10 flex h-[calc(100vh-3rem)] md:h-[calc(100vh-6rem)] w-full flex-col items-center justify-center gap-4 border-t border-red-400 bg-red-500 px-6 text-white shadow-2xl">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.3em] text-red-100">
            Massimo
          </p>

          {links.map((item) => (
            <Link
              href={item.url}
              key={item.id}
              onClick={() => setOpen(false)}
              className="rounded-full px-6 py-2 text-2xl font-bold uppercase tracking-wide transition-colors hover:bg-white/15"
            >
              {item.title}
            </Link>
          ))}

          {checkingAuth ? null : !user ? (
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="mt-3 rounded-full bg-white px-7 py-3 text-lg font-bold uppercase tracking-wide text-red-500"
            >
              Login
            </Link>
          ) : (
            <>
              <Link
                href="/profile"
                onClick={() => setOpen(false)}
                className="rounded-full px-6 py-2 text-2xl font-bold uppercase tracking-wide transition-colors hover:bg-white/15"
              >
                My Profile
              </Link>

              <Link
                href="/orders"
                onClick={() => setOpen(false)}
                className="rounded-full px-6 py-2 text-2xl font-bold uppercase tracking-wide transition-colors hover:bg-white/15"
              >
                Orders
              </Link>

              <div onClick={() => setOpen(false)}>
                <CartICon />
              </div>

              <button
                onClick={handleLogout}
                className="mt-3 rounded-full border border-white/60 px-6 py-2 text-sm font-bold uppercase tracking-wide transition-colors hover:bg-white hover:text-red-500"
              >
                Logout
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default MenuPage;
