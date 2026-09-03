"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/components/auth";
import Link from "next/link";

type Role = "customer" | "admin";

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role>("customer");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const check = async () => {
      const loggedIn = await isAuthenticated();
      if (loggedIn) {
        router.replace("/");
      } else {
        setCheckingAuth(false);
      }
    };
    check();
  }, [router]);

  useEffect(() => {
    setUsername("");
    setPassword("");
  }, [role]);

  if (checkingAuth) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-100">
        <p>Loading...</p>
      </main>
    );
  }

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!username || !password) {
      alert("Username and password are required");
      return;
    }

    setLoading(true);

    const endpoint = role === "admin" ? "/api/admin/login" : "/api/login";
    const redirectTo = role === "admin" ? "/admin/dashboard" : "/";

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          username,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Invalid username or password");
        return;
      }

      router.push(redirectTo);
      router.refresh();
    } catch (error) {
      console.error("Login error:", error);
      alert("Unable to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100 px-4 py-8 sm:px-6 lg:px-8">
      <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-md sm:p-8">
        <h1 className="mb-6 text-center text-xl font-serif font-extrabold uppercase sm:text-2xl">
          Login
        </h1>

        <div className="mb-6 flex rounded-full border border-gray-200 p-1">
          <button
            type="button"
            onClick={() => setRole("customer")}
            className={`flex-1 rounded-full py-2 text-sm font-semibold uppercase tracking-wide transition-all ${
              role === "customer"
                ? "bg-red-500 text-white shadow-sm"
                : "text-gray-500 hover:text-red-500"
            }`}
          >
            Customer
          </button>
          <button
            type="button"
            onClick={() => setRole("admin")}
            className={`flex-1 rounded-full py-2 text-sm font-semibold uppercase tracking-wide transition-all ${
              role === "admin"
                ? "bg-red-500 text-white shadow-sm"
                : "text-gray-500 hover:text-red-500"
            }`}
          >
            Admin
          </button>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm sm:text-base">Username</label>

            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              className="w-full rounded-md border p-2.5 text-sm outline-none focus:border-red-500 sm:p-3 sm:text-base"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm sm:text-base">Password</label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full rounded-md border p-2.5 text-sm outline-none focus:border-red-500 sm:p-3 sm:text-base"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-3xl bg-red-600 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60 sm:py-3 sm:text-base"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {role === "customer" && (
          <p className="mt-5 border-t border-gray-200 pt-4 text-center text-sm text-gray-500">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-semibold text-red-500 transition-colors hover:text-red-700"
            >
              Register
            </Link>
          </p>
        )}
      </div>
    </main>
  );
}
