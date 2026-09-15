"use client";

import React from "react";
import { useSettings } from "@/context/SettingsContext";

const NotificationPage = () => {
  const { settings } = useSettings();

  if (!settings.showAnnouncement || !settings.announcementText) {
    return null;
  }

  return (
    <div className="h-10 md:h-12 bg-red-500 text-white px-4 py-2 flex items-center justify-center text-center text-xs md:text-sm font-medium tracking-wide transition-all">
      <span>{settings.announcementText}</span>
    </div>
  );
};

export default NotificationPage;

