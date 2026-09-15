"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSettings } from "@/context/SettingsContext";

const FooterPage = () => {
  const { settings } = useSettings();
  const [failedLogoUrl, setFailedLogoUrl] = useState<string | null>(null);

  const hasValidLogo = Boolean(
    settings.logoUrl && failedLogoUrl !== settings.logoUrl,
  );

  return (
    <footer className="border-t border-red-100 bg-white text-red-500">
      <div className="mx-auto flex h-16 md:h-24 max-w-screen-2xl items-center justify-between px-4 lg:px-20 xl:px-40">
        <Link
          href="/"
          className="flex items-center gap-2 transition-opacity hover:opacity-90"
        >
          {hasValidLogo ? (
            <div className="relative flex items-center h-7 md:h-9 max-w-[140px] md:max-w-[170px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={settings.logoUrl}
                alt={settings.restaurantName || "Massimo"}
                className="h-full w-auto max-h-7 md:max-h-9 object-contain"
                onError={() => setFailedLogoUrl(settings.logoUrl)}
              />
            </div>
          ) : (
            <span className="font-black text-lg md:text-xl uppercase tracking-wider">
              {settings.restaurantName || "MASSIMO"}
            </span>
          )}
        </Link>
        <p className="text-xs md:text-sm font-semibold tracking-wide text-gray-500">
          ALL RIGHTS RESERVED @{new Date().getFullYear()}
        </p>
      </div>
    </footer>
  );
};

export default FooterPage;
