"use client";

import { usePathname } from "next/navigation";
import Notification from "@/components/Notification";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { SettingsProvider } from "@/context/SettingsContext";

export default function ConditionalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  if (isAdmin) {
    return <SettingsProvider>{children}</SettingsProvider>;
  }

  return (
    <SettingsProvider>
      <Notification />
      <Navbar />
      {children}
      <Footer />
    </SettingsProvider>
  );
}

