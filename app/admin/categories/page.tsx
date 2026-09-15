"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import AdminShell from "@/components/admin/AdminShell";
import Link from "next/link";
import Image from "next/image";

interface Category {
  _id: string;
  slug: string;
  title: string;
  desc?: string;
  img?: string;
  color?: string;
  productCount?: number;
  createdAt?: string;
}

const DEFAULT_PRESET_IMAGES = [
  { name: "Pizzas Hero", url: "/temporary/m1.png" },
  { name: "Burgers Hero", url: "/temporary/m2.png" },
  { name: "Pastas Hero", url: "/temporary/m3.png" },
];

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Add / Edit Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // Form states
  const [formTitle, setFormTitle] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formImg, setFormImg] = useState("/temporary/m1.png");
  const [formColor, setFormColor] = useState<"white" | "black">("white");
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);

  // File Upload states
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Delete Modal
  const [deleteCategory, setDeleteCategory] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/categories", {
        credentials: "include",
      });
      const data = await res.json();
      if (data.success && data.categories) {
        setCategories(data.categories);
      } else {
        // Fallback to admin products endpoint if categories endpoint is warming up
        const fallbackRes = await fetch("/api/admin/products", {
          credentials: "include",
        });
        const fallbackData = await fallbackRes.json();
        if (fallbackData.success && fallbackData.categories) {
          setCategories(fallbackData.categories);
        }
      }
    } catch (err) {
      console.error("Failed to load categories:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleTitleChange = (val: string) => {
    setFormTitle(val);
    if (!isSlugManuallyEdited || !formSlug) {
      const generated = val
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      setFormSlug(generated);
    }
  };

  const handleSlugChange = (val: string) => {
    setIsSlugManuallyEdited(true);
    setFormSlug(val.toLowerCase().replace(/[^a-z0-9-]/g, "-"));
  };

  const openAddModal = () => {
    setEditingCategory(null);
    setFormTitle("");
    setFormSlug("");
    setFormDesc("");
    setFormImg("/temporary/m1.png");
    setFormColor("white");
    setIsSlugManuallyEdited(false);
    setFormError("");
    setUploadingImg(false);
    setIsDragging(false);
    setModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setFormTitle(cat.title || "");
    setFormSlug(cat.slug || "");
    setFormDesc(cat.desc || "");
    setFormImg(cat.img || "/temporary/m1.png");
    setFormColor(
      (cat.color === "black" ? "black" : "white") as "white" | "black",
    );
    setIsSlugManuallyEdited(true);
    setFormError("");
    setUploadingImg(false);
    setIsDragging(false);
    setModalOpen(true);
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setFormError("Please select a valid image file (PNG, JPG, WEBP)");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setFormError("Image file size must be less than 10MB");
      return;
    }

    try {
      setUploadingImg(true);
      setFormError("");
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.url) {
        setFormImg(data.url);
      } else {
        setFormError(data.message || "Failed to upload image");
      }
    } catch (err) {
      console.error("Upload error:", err);
      setFormError("Network error during file upload");
    } finally {
      setUploadingImg(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadingImg) return;

    if (!formTitle.trim()) {
      setFormError("Category title is required");
      return;
    }

    const cleanSlug = (formSlug || formTitle)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    if (!cleanSlug) {
      setFormError("Please enter a valid slug");
      return;
    }

    try {
      setSaving(true);
      setFormError("");

      const payload = {
        title: formTitle.trim(),
        slug: cleanSlug,
        desc: formDesc.trim(),
        img: formImg.trim(),
        color: formColor,
      };

      if (editingCategory) {
        const res = await fetch("/api/admin/categories", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            _id: editingCategory._id,
            ...payload,
          }),
        });
        const data = await res.json();
        if (data.success) {
          setModalOpen(false);
          fetchCategories();
        } else {
          setFormError(data.message || "Failed to update category");
        }
      } else {
        const res = await fetch("/api/admin/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.success) {
          setModalOpen(false);
          fetchCategories();
        } else {
          setFormError(data.message || "Failed to create category");
        }
      }
    } catch (err) {
      console.error("Save category error:", err);
      setFormError("Something went wrong while saving. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteCategory) return;
    try {
      setDeleting(true);
      const res = await fetch(
        `/api/admin/categories?id=${deleteCategory._id}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );
      const data = await res.json();
      if (data.success) {
        setDeleteCategory(null);
        fetchCategories();
      } else {
        alert(data.message || "Failed to delete category");
      }
    } catch (err) {
      console.error("Delete category error:", err);
      alert("Network error while deleting category");
    } finally {
      setDeleting(false);
    }
  };

  const filteredCategories = useMemo(() => {
    const term = searchQuery.toLowerCase().trim();
    if (!term) return categories;
    return categories.filter(
      (c) =>
        (c.title || "").toLowerCase().includes(term) ||
        (c.slug || "").toLowerCase().includes(term) ||
        (c.desc || "").toLowerCase().includes(term),
    );
  }, [categories, searchQuery]);

  const totalProductsCount = useMemo(() => {
    return categories.reduce((sum, c) => sum + (c.productCount || 0), 0);
  }, [categories]);

  return (
    <AdminShell
      title="Category Management"
      subtitle="Manage your restaurant menu categories"
      actions={
        <div className="flex items-center gap-2.5">
          <Link
            href="/admin/products"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-red-500 shadow-xs transition hover:bg-red-50"
          >
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
                d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z"
              />
            </svg>
            Manage Products
          </Link>
        </div>
      }
    >
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-red-100 bg-white p-4 shadow-xs transition hover:shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Catalog Products
          </p>
          <p className="mt-1 text-2xl font-black text-gray-800">
            {totalProductsCount}
          </p>
          <p className="mt-1 text-[11px] text-gray-400">
            Across all category sections
          </p>
        </div>

        <div className="rounded-2xl border border-red-100 bg-white p-4 shadow-xs transition hover:shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-red-500">
            Total Categories
          </p>
          <p className="mt-1 text-2xl font-black text-red-600">
            {categories.length}
          </p>
          <p className="mt-1 text-[11px] text-gray-400">
            Active visible sections on /menu
          </p>
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-red-100 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-md">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search categories by title, slug, or description..."
            className="w-full rounded-full border border-red-100 bg-gray-50/50 py-2 pl-9 pr-8 text-xs font-medium text-gray-800 placeholder-gray-400 focus:border-red-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-100"
          />
          <svg
            className="absolute left-3 top-2.5 h-4 w-4 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
            />
          </svg>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-2.5 text-xs font-bold text-gray-400 hover:text-red-500"
            >
              ✕
            </button>
          )}
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-red-500 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-xs transition hover:bg-red-600 sm:w-auto"
        >
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
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
          Add Category
        </button>
      </div>

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-2xl border border-red-100 bg-white p-5 shadow-xs"
            >
              <div className="h-36 w-full rounded-xl bg-red-50" />
              <div className="mt-4 space-y-2">
                <div className="h-4 w-1/2 rounded bg-red-100" />
                <div className="h-3 w-3/4 rounded bg-gray-100" />
                <div className="h-8 w-full rounded bg-red-50" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-red-100 bg-white py-20 text-center shadow-xs">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-500">
            <svg
              className="h-7 w-7"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z"
              />
            </svg>
          </div>
          <h3 className="text-base font-bold text-gray-800">
            {searchQuery ? "No Matching Categories" : "No Categories Found"}
          </h3>
          <p className="mt-1 text-xs text-gray-400">
            {searchQuery
              ? "Try adjusting your search keywords."
              : "Start by creating your first food category."}
          </p>
          <button
            onClick={openAddModal}
            className="mt-4 rounded-full bg-red-500 px-5 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-xs transition hover:bg-red-600"
          >
            Add New Category
          </button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCategories.map((cat) => (
            <div
              key={cat._id || cat.slug}
              className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-red-100 bg-white shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-red-200 hover:shadow-md"
            >
              {/* Card Banner with Background */}
              <div>
                <div
                  className="relative flex h-40 flex-col justify-between bg-cover bg-center p-4 overflow-hidden"
                  style={{
                    backgroundImage: cat.img ? `url(${cat.img})` : "none",
                    backgroundColor: "#f87171",
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />

                  {/* Top Badges */}
                  <div className="relative z-10 flex items-center justify-between">
                    <span className="rounded-full bg-white/90 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-600 shadow-xs backdrop-blur-xs">
                      {cat.slug}
                    </span>
                  </div>

                  {/* Title & Product Count */}
                  <div className="relative z-10 text-white">
                    <h3 className="text-xl font-black uppercase tracking-wide drop-shadow-sm">
                      {cat.title}
                    </h3>
                    <p className="mt-0.5 text-[11px] font-medium text-white/80">
                      {cat.productCount !== undefined
                        ? `${cat.productCount} ${
                            cat.productCount === 1 ? "product" : "products"
                          }`
                        : "Menu Category"}
                    </p>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <p className="text-xs text-gray-600 line-clamp-2 min-h-[32px]">
                    {cat.desc || "No description provided."}
                  </p>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="border-t border-red-50 bg-red-50/20 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/products`}
                      className="rounded-lg bg-white border border-red-100 px-2.5 py-1.5 text-[11px] font-bold text-gray-700 shadow-2xs transition hover:bg-gray-50"
                    >
                      Products
                    </Link>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openEditModal(cat)}
                      className="rounded-lg bg-red-50 p-2 text-red-600 transition hover:bg-red-500 hover:text-white"
                      title="Edit Category"
                    >
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
                          d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => setDeleteCategory(cat)}
                      className="rounded-lg bg-gray-100 p-2 text-gray-500 transition hover:bg-red-100 hover:text-red-600"
                      title="Delete Category"
                    >
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
                          d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Category Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="relative max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-red-100 bg-white p-6 shadow-2xl sm:p-8">
            <div className="flex items-center justify-between border-b border-red-100 pb-4">
              <div>
                <h3 className="text-lg font-black uppercase text-red-500 sm:text-xl">
                  {editingCategory ? "Edit Category" : "Add New Category"}
                </h3>
                <p className="text-xs text-gray-400">
                  {editingCategory
                    ? `Update information for "${editingCategory.title}"`
                    : "Fill in the details to add a new category to your restaurant"}
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-full p-2 text-gray-400 hover:bg-red-50 hover:text-red-500"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18 18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {formError && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-600">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveCategory} className="mt-5 space-y-4">
              {/* Category Title */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                  Category Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="e.g. Artisanal Desserts & Drinks"
                  className="mt-1.5 w-full rounded-xl border border-red-100 bg-gray-50/50 p-3 text-xs font-medium text-gray-800 placeholder-gray-400 focus:border-red-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-100"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                    Slug (URL identifier){" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formSlug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    placeholder="e.g. desserts"
                    className="mt-1.5 w-full rounded-xl border border-red-100 bg-gray-50/50 p-3 text-xs font-medium text-gray-800 placeholder-gray-400 focus:border-red-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-100"
                  />
                  <p className="mt-1 text-[10px] text-gray-400">
                    Used for URL: /menu/{formSlug || "slug"}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                    Banner Text Color
                  </label>
                  <select
                    value={formColor}
                    onChange={(e) =>
                      setFormColor(e.target.value as "white" | "black")
                    }
                    className="mt-1.5 w-full rounded-xl border border-red-100 bg-gray-50/50 p-3 text-xs font-medium text-gray-800 focus:border-red-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-100"
                  >
                    <option value="white">White Text (For dark images)</option>
                    <option value="black">Black Text (For light images)</option>
                  </select>
                  <p className="mt-1 text-[10px] text-gray-400">
                    Controls typography contrast on /menu
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="e.g. Handcrafted sweets and freshly brewed espresso beverages."
                  className="mt-1.5 w-full rounded-xl border border-red-100 bg-gray-50/50 p-3 text-xs font-medium text-gray-800 placeholder-gray-400 focus:border-red-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                  Category Banner Image
                </label>

                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                  className={`mt-1.5 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-4 text-center transition-all ${
                    isDragging
                      ? "border-red-500 bg-red-50/60"
                      : "border-red-200 bg-red-50/20 hover:border-red-400 hover:bg-red-50/40"
                  }`}
                >
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

                  {uploadingImg ? (
                    <div className="flex items-center gap-2 py-2 text-xs font-semibold text-red-500">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-500 border-t-transparent"></div>
                      Uploading image...
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <svg
                        className="h-7 w-7 text-red-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
                        />
                      </svg>
                      <p className="mt-1 text-xs font-semibold text-gray-700">
                        Click to upload or drag and drop image here
                      </p>
                      <p className="text-[10px] text-gray-400">
                        PNG, JPG, WEBP up to 10MB
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                    Or select a preset background:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {DEFAULT_PRESET_IMAGES.map((preset) => (
                      <button
                        type="button"
                        key={preset.url}
                        onClick={() => setFormImg(preset.url)}
                        className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-medium transition ${
                          formImg === preset.url
                            ? "border-red-500 bg-red-50 text-red-600 font-bold"
                            : "border-gray-200 bg-gray-50 text-gray-600 hover:bg-red-50/50"
                        }`}
                      >
                        <span>{preset.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-2.5">
                  <input
                    type="text"
                    value={formImg}
                    onChange={(e) => setFormImg(e.target.value)}
                    placeholder="Or enter image URL (e.g. /temporary/m1.png)"
                    className="w-full rounded-xl border border-red-100 bg-gray-50/50 p-2.5 text-xs font-medium text-gray-800 placeholder-gray-400 focus:border-red-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-100"
                  />
                </div>

                {formImg && (
                  <div className="mt-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                      Banner Preview:
                    </p>
                    <div
                      className="relative h-24 w-full rounded-xl bg-cover bg-center p-3 flex flex-col justify-end overflow-hidden border border-red-100"
                      style={{
                        backgroundImage: `url(${formImg})`,
                        backgroundColor: "#f87171",
                      }}
                    >
                      <div className="absolute inset-0 bg-black/40" />
                      <div className="relative z-10">
                        <span className="rounded bg-red-500 px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">
                          {formSlug || "category"}
                        </span>
                        <h4
                          className={`text-sm font-bold mt-0.5 ${
                            formColor === "black"
                              ? "text-gray-900"
                              : "text-white"
                          }`}
                        >
                          {formTitle || "Category Title Preview"}
                        </h4>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-red-100 pt-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-full border border-gray-200 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-gray-600 transition hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || uploadingImg}
                  className="flex items-center gap-2 rounded-full bg-red-500 px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-xs transition hover:bg-red-600 disabled:opacity-50"
                >
                  {saving && (
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  )}
                  {editingCategory ? "Update Category" : "Create Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-red-100 bg-white p-6 shadow-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                />
              </svg>
            </div>
            <h3 className="mt-4 text-base font-bold text-gray-900">
              Delete &quot;{deleteCategory.title}&quot;?
            </h3>
            <p className="mt-2 text-xs text-gray-500">
              This action cannot be undone. All products under this category will be moved to the default category. Are you sure you want to proceed?
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteCategory(null)}
                className="rounded-full border border-gray-200 px-4 py-2 text-xs font-bold uppercase tracking-wider text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-full bg-red-500 px-5 py-2 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-red-600 disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete Category"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
