"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { DEFAULT_SETTINGS, RestaurantSettings } from "@/lib/settings";

interface Toast {
  type: "success" | "error" | "info";
  message: string;
}

type SettingsTab = "branding" | "security";

export default function AdminSettingsPage() {
  const [settings, setSettings] =
    useState<RestaurantSettings>(DEFAULT_SETTINGS);
  const [initialSettings, setInitialSettings] =
    useState<RestaurantSettings>(DEFAULT_SETTINGS);
  const [activeTab, setActiveTab] = useState<SettingsTab>("branding");
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [changingPassword, setChangingPassword] = useState(false);

  const hasUnsavedChanges =
    JSON.stringify(settings) !== JSON.stringify(initialSettings);

  const showToast = useCallback(
    (type: "success" | "error" | "info", message: string) => {
      setToast({ type, message });
      setTimeout(() => {
        setToast((prev) => (prev?.message === message ? null : prev));
      }, 4000);
    },
    [],
  );

  useEffect(() => {
    let isMounted = true;

    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/admin/settings", {
          credentials: "include",
          cache: "no-store",
        });
        const data = await res.json();
        if (isMounted) {
          if (res.ok && data.success && data.settings) {
            setSettings(data.settings);
            setInitialSettings(data.settings);
          } else {
            showToast("error", data.message || "Failed to load settings");
          }
        }
      } catch (err) {
        console.error("Fetch settings error:", err);
        if (isMounted) {
          showToast("error", "Error connecting to server");
        }
      }
    };

    fetchSettings();

    return () => {
      isMounted = false;
    };
  }, [showToast]);

  const handleSaveSettings = useCallback(async () => {
    try {
      setSaving(true);
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(settings),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setInitialSettings(settings);
        showToast("success", "Settings saved and published successfully!");

        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("massimo-settings-updated", {
              detail: settings,
            }),
          );
        }
      } else {
        showToast("error", data.message || "Failed to save settings");
      }
    } catch (err) {
      console.error("Save error:", err);
      showToast("error", "Error saving settings");
    } finally {
      setSaving(false);
    }
  }, [settings, showToast]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        handleSaveSettings();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSaveSettings]);

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      showToast("error", "Image must be smaller than 10MB");
      return;
    }

    try {
      setUploadingLogo(true);
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.success && data.url) {
        setSettings((prev) => ({
          ...prev,
          logoUrl: data.url,
        }));
        showToast("success", "Logo uploaded! Click Save Settings to publish.");
      } else {
        showToast("error", data.message || "Failed to upload image");
      }
    } catch (err) {
      console.error("Upload error:", err);
      showToast("error", "Network error during upload");
    } finally {
      setUploadingLogo(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleResetSettings = () => {
    setSettings(initialSettings);
    showToast("info", "Changes reverted to saved values");
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      showToast("error", "Please fill in all password fields");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast("error", "New passwords do not match");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      showToast("error", "New password must be at least 6 characters");
      return;
    }

    try {
      setChangingPassword(true);
      const res = await fetch("/api/admin/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(passwordForm),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast("success", "Admin password changed successfully!");
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        showToast("error", data.message || "Failed to change password");
      }
    } catch (err) {
      console.error("Password change error:", err);
      showToast("error", "Network error updating password");
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <AdminShell
      title="Settings & Branding"
      subtitle="Manage your restaurant's branding, logo, and admin security settings."
      actions={
        <div className="flex items-center gap-3">
          {hasUnsavedChanges && (
            <button
              type="button"
              onClick={handleResetSettings}
              disabled={saving}
              className="rounded-full border border-gray-300 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-gray-700 shadow-xs transition hover:bg-gray-50"
            >
              Discard Changes
            </button>
          )}
          <button
            type="button"
            onClick={handleSaveSettings}
            disabled={saving || uploadingLogo}
            className={`flex items-center gap-2 rounded-full px-6 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-md transition ${
              hasUnsavedChanges
                ? "bg-red-500 shadow-red-200 hover:bg-red-600 animate-pulse"
                : "bg-red-500 hover:bg-red-600"
            }`}
          >
            {saving ? (
              <>
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m4.5 12.75 6 6 9-13.5"
                  />
                </svg>
                <span>Save Settings</span>
              </>
            )}
          </button>
        </div>
      }
    >
      {toast && (
        <div
          className={`mb-6 flex items-center justify-between rounded-2xl px-5 py-3.5 text-sm font-semibold shadow-sm animate-in fade-in duration-200 ${
            toast.type === "success"
              ? "border border-green-200 bg-green-50 text-green-800"
              : toast.type === "error"
                ? "border border-red-200 bg-red-50 text-red-800"
                : "border border-blue-200 bg-blue-50 text-blue-800"
          }`}
        >
          <span>{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="text-xs font-bold uppercase opacity-70 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="rounded-3xl border border-red-100 bg-white shadow-xs overflow-hidden">
        <div className="border-b border-red-100 bg-red-50/40 px-4 sm:px-8 pt-4">
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {[
              {
                id: "branding" as SettingsTab,
                label: "Branding & Logo",
                icon: (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                ),
              },
              {
                id: "security" as SettingsTab,
                label: "Admin Security",
                icon: (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                ),
              },
            ].map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold uppercase tracking-wider transition ${
                    active
                      ? "border-red-500 text-red-600 bg-white rounded-t-xl shadow-xs"
                      : "border-transparent text-gray-500 hover:text-red-500"
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-6 sm:p-10">
          {activeTab === "branding" && (
            <div className="space-y-8 max-w-2xl">
              <div>
                <h2 className="text-xl font-black uppercase tracking-wider text-gray-900">
                  Restaurant Logo
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Upload a new logo for your restaurant.
                </p>
              </div>

              <div className="rounded-3xl border border-gray-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                  Current Saved Logo
                </label>

                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="flex h-28 w-44 shrink-0 items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 p-3">
                    {settings.logoUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={settings.logoUrl}
                        alt="Current logo"
                        className="max-h-20 max-w-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <span className="text-xs font-bold text-gray-400">
                        No logo uploaded
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col items-start gap-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleFileUpload(e.target.files[0]);
                        }
                      }}
                    />

                    <button
                      type="button"
                      disabled={uploadingLogo}
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 rounded-full bg-red-500 px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-xs hover:bg-red-600 transition disabled:opacity-50"
                    >
                      {uploadingLogo ? (
                        <>
                          <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
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
                              d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
                            />
                          </svg>
                          <span>Upload New Logo</span>
                        </>
                      )}
                    </button>

                    <p className="text-[11px] text-gray-400">
                      Supports PNG, JPG, SVG, WEBP (Max 10MB)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="space-y-8 max-w-xl">
              <div>
                <h2 className="text-xl font-black uppercase tracking-wider text-gray-900">
                  Admin Credentials & Security
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Change your admin password to keep your account secure.
                </p>
              </div>

              <form onSubmit={handlePasswordSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                    Current Admin Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={passwordForm.currentPassword}
                    onChange={(e) =>
                      setPasswordForm((p) => ({
                        ...p,
                        currentPassword: e.target.value,
                      }))
                    }
                    placeholder="Enter current password"
                    className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                    New Password (Min. 6 Characters) *
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={passwordForm.newPassword}
                    onChange={(e) =>
                      setPasswordForm((p) => ({
                        ...p,
                        newPassword: e.target.value,
                      }))
                    }
                    placeholder="Enter new strong password"
                    className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                    Confirm New Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={passwordForm.confirmPassword}
                    onChange={(e) =>
                      setPasswordForm((p) => ({
                        ...p,
                        confirmPassword: e.target.value,
                      }))
                    }
                    placeholder="Re-enter new password"
                    className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={changingPassword}
                  className="rounded-full bg-red-600 px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm hover:bg-red-700 transition disabled:opacity-50"
                >
                  {changingPassword
                    ? "Updating Password..."
                    : "Update Admin Password"}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
