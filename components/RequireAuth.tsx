"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

type Props = {
  children: ReactNode;
};

const RequireAuth = ({ children }: Props) => {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        const response = await fetch("/api/me", {
          method: "GET",
          credentials: "include",
        });

        if (!response.ok) {
          setAuthenticated(false);
          router.replace("/login");
          return;
        }

        const data = await response.json();

        if (data.success && data.authenticated) {
          setAuthenticated(true);
        } else {
          setAuthenticated(false);
          router.replace("/login");
        }
      } catch (error) {
        console.error("Authentication check failed:", error);

        setAuthenticated(false);
        router.replace("/login");
      } finally {
        setLoading(false);
      }
    };

    checkAuthentication();
  }, [router]);

  // Authentication is still being checked
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Checking authentication...</p>
      </div>
    );
  }

  // User is not authenticated
  if (!authenticated) {
    return null;
  }

  // User is authenticated
  return <>{children}</>;
};

export default RequireAuth;
