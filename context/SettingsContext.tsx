"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { DEFAULT_SETTINGS, RestaurantSettings } from "@/lib/settings";

interface SettingsContextType {
  settings: RestaurantSettings;
  loading: boolean;
  refreshSettings: () => Promise<void>;
  updateLocalSettings: (partial: Partial<RestaurantSettings>) => void;
}

const SettingsContext = createContext<SettingsContextType>({
  settings: DEFAULT_SETTINGS,
  loading: true,
  refreshSettings: async () => {},
  updateLocalSettings: () => {},
});

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<RestaurantSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.settings) {
          setSettings(data.settings);
        }
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();

    const handleSettingsUpdated = (e: CustomEvent<RestaurantSettings> | Event) => {
      if ("detail" in e && e.detail) {
        setSettings((prev) => ({ ...prev, ...e.detail }));
      } else {
        fetchSettings();
      }
    };

    window.addEventListener("massimo-settings-updated", handleSettingsUpdated);
    return () => {
      window.removeEventListener("massimo-settings-updated", handleSettingsUpdated);
    };
  }, []);

  const updateLocalSettings = (partial: Partial<RestaurantSettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        loading,
        refreshSettings: fetchSettings,
        updateLocalSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  return useContext(SettingsContext);
};
