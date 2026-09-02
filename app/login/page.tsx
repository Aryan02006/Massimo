"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/components/auth";

export default function LoginPage() {
  const router = useRouter();

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

    try {
      const response = await fetch("/api/login", {
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

      router.push("/");
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
      </div>
    </main>
  );
}
