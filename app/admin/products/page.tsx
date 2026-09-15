"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import AdminShell from "@/components/admin/AdminShell";
import Image from "next/image";

interface ProductOption {
  title: string;
  additionalPrice: number;
}

interface Product {
  _id: string;
  id?: string | number;
  title: string;
  desc?: string;
  img?: string;
  price: number;
  catSlug: string;
  options?: ProductOption[];
  isFeatured?: boolean;
  createdAt?: string;
}

interface Category {
  _id: string;
  slug: string;
  title: string;
  desc?: string;
  img?: string;
  color?: string;
}

interface ProductStats {
  totalProducts: number;
  totalCategories: number;
  featuredCount: number;
  avgPrice: number;
}

const DEFAULT_CATEGORIES = [
  { slug: "pizzas", title: "Pizzas" },
  { slug: "burgers", title: "Burgers" },
  { slug: "pastas", title: "Pastas" },
];

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stats, setStats] = useState<ProductStats>({
    totalProducts: 0,
    totalCategories: 0,
    featuredCount: 0,
    avgPrice: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);

  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formCatSlug, setFormCatSlug] = useState("pizzas");
  const [formImg, setFormImg] = useState("");
  const [formOptions, setFormOptions] = useState<ProductOption[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/products", {
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setProducts(data.products || []);
        if (data.categories && data.categories.length > 0) {
          setCategories(data.categories);
        }
        if (data.stats) {
          setStats(data.stats);
        }
      }
    } catch (err) {
      console.error("Failed to load products:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      try {
        const res = await fetch("/api/admin/products", {
          credentials: "include",
        });
        const data = await res.json();
        if (isMounted) {
          if (data.success) {
            setProducts(data.products || []);
            if (data.categories && data.categories.length > 0) {
              setCategories(data.categories);
            }
            if (data.stats) {
              setStats(data.stats);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load products:", err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    init();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      return;
    }

    try {
      setUploadingImg(true);
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
      }
    } catch (err) {
      console.error("Upload error:", err);
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

  const openAddModal = () => {
    setEditingProduct(null);
    setFormTitle("");
    setFormDesc("");
    setFormPrice("");
    setFormCatSlug(categories[0]?.slug || "pizzas");
    setFormImg("");
    setFormOptions([
      { title: "Small", additionalPrice: 0 },
      { title: "Medium", additionalPrice: 2 },
      { title: "Large", additionalPrice: 4 },
    ]);
    setUploadingImg(false);
    setIsDragging(false);
    setModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormTitle(product.title || "");
    setFormDesc(product.desc || "");
    setFormPrice(String(product.price || ""));
    setFormCatSlug(product.catSlug || "pizzas");
    setFormImg(product.img || "");
    setFormOptions(product.options ? [...product.options] : []);
    setUploadingImg(false);
    setIsDragging(false);
    setModalOpen(true);
  };

  const handleAddOption = () => {
    setFormOptions((prev) => [...prev, { title: "", additionalPrice: 0 }]);
  };

  const handleUpdateOption = (
    index: number,
    field: "title" | "additionalPrice",
    val: string | number,
  ) => {
    setFormOptions((prev) => {
      const next = [...prev];
      if (field === "title") {
        next[index].title = String(val);
      } else {
        next[index].additionalPrice = Number(val) || 0;
      }
      return next;
    });
  };

  const handleRemoveOption = (index: number) => {
    setFormOptions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadingImg) {
      return;
    }
    if (!formTitle.trim()) {
      return;
    }
    const priceNum = Number(formPrice);
    if (isNaN(priceNum) || priceNum < 0) {
      return;
    }

    try {
      setSaving(true);
      const payload = {
        title: formTitle.trim(),
        desc: formDesc.trim(),
        price: priceNum,
        catSlug: formCatSlug.trim().toLowerCase(),
        img: formImg.trim(),
        options: formOptions.filter((o) => o.title.trim()),
      };

      if (editingProduct) {
        // Update product
        const res = await fetch(`/api/admin/products`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            _id: editingProduct._id,
            ...payload,
          }),
        });
        const data = await res.json();
        if (data.success) {
          setModalOpen(false);
          fetchProducts();
        }
      } else {
        // Create product
        const res = await fetch("/api/admin/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.success) {
          setModalOpen(false);
          fetchProducts();
        }
      }
    } catch (err) {
      console.error("Save product error:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteProduct) return;
    try {
      setDeleting(true);
      const res = await fetch(`/api/admin/products?id=${deleteProduct._id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setDeleteProduct(null);
        fetchProducts();
      }
    } catch (err) {
      console.error("Delete product error:", err);
    } finally {
      setDeleting(false);
    }
  };

  const allCategories = useMemo(() => {
    const list = categories.length > 0 ? categories : DEFAULT_CATEGORIES;
    return list;
  }, [categories]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCat =
        selectedCategory === "all" ||
        (p.catSlug || "").toLowerCase() === selectedCategory.toLowerCase();

      const term = searchQuery.toLowerCase().trim();
      if (!term) return matchesCat;

      const matchesSearch =
        (p.title || "").toLowerCase().includes(term) ||
        (p.desc || "").toLowerCase().includes(term) ||
        (p.catSlug || "").toLowerCase().includes(term);

      return matchesCat && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  const money = (amount: number) => `₹${Number(amount || 0).toFixed(2)}`;

  return (
    <AdminShell
      title="Products Management"
      subtitle="Create, update, and manage your restaurant menu items"
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 rounded-full bg-red-500 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition hover:bg-red-600"
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
            Add Product
          </button>
        </div>
      }
    >
      {/* KPI Stats Cards */}
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-red-100 bg-white p-4 shadow-xs transition hover:shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Products
          </p>
          <p className="mt-1 text-2xl font-black text-gray-800">
            {stats.totalProducts}
          </p>
        </div>

        <div className="rounded-2xl border border-red-100 bg-white p-4 shadow-xs transition hover:shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-red-500">
            Categories
          </p>
          <p className="mt-1 text-2xl font-black text-red-600">
            {stats.totalCategories || allCategories.length}
          </p>
        </div>

        <div className="rounded-2xl border border-red-100 bg-white p-4 shadow-xs transition hover:shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Average Price
          </p>
          <p className="mt-1 text-2xl font-black text-gray-800">
            {money(stats.avgPrice)}
          </p>
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-red-100 bg-white p-4 shadow-xs lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`rounded-full px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider transition ${
              selectedCategory === "all"
                ? "bg-red-500 text-white shadow-xs"
                : "bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600"
            }`}
          >
            All Products ({products.length})
          </button>
          {allCategories.map((c) => {
            const count = products.filter(
              (p) => (p.catSlug || "").toLowerCase() === c.slug.toLowerCase(),
            ).length;
            return (
              <button
                key={c.slug}
                onClick={() => setSelectedCategory(c.slug)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider transition ${
                  selectedCategory.toLowerCase() === c.slug.toLowerCase()
                    ? "bg-red-500 text-white shadow-xs"
                    : "bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600"
                }`}
              >
                {c.title} ({count})
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full rounded-full border border-red-100 bg-gray-50/50 py-2 pl-9 pr-4 text-xs font-medium text-gray-800 placeholder-gray-400 focus:border-red-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-100"
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

          {/* View Mode Toggle */}
          <div className="flex items-center rounded-full border border-red-100 bg-gray-50/80 p-1">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`rounded-full p-1.5 transition ${
                viewMode === "grid"
                  ? "bg-red-500 text-white shadow-xs"
                  : "text-gray-400 hover:text-gray-600"
              }`}
              title="Grid View"
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
                  d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z"
                />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`rounded-full p-1.5 transition ${
                viewMode === "table"
                  ? "bg-red-500 text-white shadow-xs"
                  : "text-gray-400 hover:text-gray-600"
              }`}
              title="Table View"
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
                  d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-2xl border border-red-100 bg-white p-5 shadow-xs"
            >
              <div className="h-44 w-full rounded-xl bg-red-50" />
              <div className="mt-4 space-y-2">
                <div className="h-4 w-3/4 rounded bg-red-100" />
                <div className="h-3 w-1/2 rounded bg-gray-100" />
                <div className="h-6 w-1/3 rounded bg-red-100" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
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
                d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z"
              />
            </svg>
          </div>
          <h3 className="text-base font-bold text-gray-800">
            No Products Found
          </h3>
          <p className="mt-1 text-xs text-gray-400">
            {searchQuery || selectedCategory !== "all"
              ? "Try adjusting your search or category filter."
              : "Start by creating your first menu item."}
          </p>
          <button
            onClick={openAddModal}
            className="mt-4 rounded-full bg-red-500 px-5 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-xs transition hover:bg-red-600"
          >
            + Add New Product
          </button>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.map((product) => (
            <div
              key={product._id}
              className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-red-100 bg-white p-4 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-red-200 hover:shadow-md"
            >
              <div>
                <div className="relative mb-3 flex h-48 w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-b from-red-50/50 to-orange-50/30 p-2">
                  {product.img ? (
                    <Image
                      src={product.img}
                      alt={product.title}
                      fill
                      className="object-contain p-2 transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex flex-col items-center text-gray-300">
                      <svg
                        className="h-10 w-10"
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
                      <span className="text-[10px]">No Image</span>
                    </div>
                  )}

                  <span className="absolute left-2.5 top-2.5 rounded-full bg-white/90 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-500 shadow-xs backdrop-blur-xs">
                    {product.catSlug}
                  </span>
                </div>

                <h4 className="font-extrabold uppercase text-gray-900 line-clamp-1">
                  {product.title}
                </h4>
                <p className="mt-1 text-xs text-gray-500 line-clamp-2">
                  {product.desc || "No description provided."}
                </p>

                {product.options && product.options.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {product.options.map((opt, i) => (
                      <span
                        key={i}
                        className="rounded-md bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-600"
                      >
                        {opt.title}{" "}
                        {opt.additionalPrice > 0
                          ? `(+₹${opt.additionalPrice})`
                          : ""}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Price & Action Row */}
              <div className="mt-4 flex items-center justify-between border-t border-red-50 pt-3">
                <span className="text-lg font-black text-red-500">
                  {money(product.price)}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openEditModal(product)}
                    className="rounded-lg bg-red-50 p-2 text-red-600 transition hover:bg-red-500 hover:text-white"
                    title="Edit Product"
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
                    onClick={() => setDeleteProduct(product)}
                    className="rounded-lg bg-gray-100 p-2 text-gray-500 transition hover:bg-red-100 hover:text-red-600"
                    title="Delete Product"
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
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="overflow-hidden rounded-2xl border border-red-100 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-red-50 bg-red-50/40 text-[11px] font-bold uppercase tracking-wider text-red-500">
                  <th className="px-5 py-3.5">Item</th>
                  <th className="px-5 py-3.5">Category</th>
                  <th className="px-5 py-3.5">Price</th>
                  <th className="px-5 py-3.5">Options</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-red-50 text-xs">
                {filteredProducts.map((product) => (
                  <tr
                    key={product._id}
                    className="transition hover:bg-red-50/30"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl border border-red-100 bg-red-50/30">
                          {product.img ? (
                            <Image
                              src={product.img}
                              alt={product.title}
                              fill
                              className="object-contain p-1"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[10px] text-gray-300">
                              N/A
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-extrabold text-gray-900 uppercase">
                            {product.title}
                          </p>
                          <p className="max-w-xs truncate text-[11px] text-gray-400">
                            {product.desc || "No description"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5">
                      <span className="rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-red-600">
                        {product.catSlug}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 font-black text-red-600">
                      {money(product.price)}
                    </td>
                    <td className="px-5 py-3.5 text-gray-500">
                      {product.options && product.options.length > 0 ? (
                        <span className="text-[11px]">
                          {product.options.map((o) => o.title).join(", ")}
                        </span>
                      ) : (
                        <span className="text-gray-300">Standard</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(product)}
                          className="rounded-lg bg-red-50 p-2 text-red-600 transition hover:bg-red-500 hover:text-white"
                          title="Edit Product"
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
                          onClick={() => setDeleteProduct(product)}
                          className="rounded-lg bg-gray-100 p-2 text-gray-500 transition hover:bg-red-100 hover:text-red-600"
                          title="Delete Product"
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-red-100 bg-white p-6 shadow-2xl sm:p-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-red-100 pb-4">
              <div>
                <h3 className="text-lg font-black uppercase text-red-500 sm:text-xl">
                  {editingProduct ? "Edit Product" : "Add New Product"}
                </h3>
                <p className="text-xs text-gray-400">
                  {editingProduct
                    ? `Update details for "${editingProduct.title}"`
                    : "Fill in the details to add a new dish to your menu"}
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

            {/* Form */}
            <form onSubmit={handleSaveProduct} className="mt-6 space-y-5">
              {/* Title, Category & Price */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                    Product Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. Sicilian Margherita"
                    className="mt-1.5 w-full rounded-xl border border-red-100 bg-gray-50/50 p-3 text-xs font-medium text-gray-800 placeholder-gray-400 focus:border-red-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formCatSlug}
                    onChange={(e) => setFormCatSlug(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-red-100 bg-gray-50/50 p-3 text-xs font-medium text-gray-800 focus:border-red-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-100"
                  >
                    {allCategories.map((c) => (
                      <option key={c.slug} value={c.slug}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                    Base Price (₹) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative mt-1.5">
                    <span className="absolute left-3.5 top-3 text-xs font-bold text-gray-400">
                      ₹
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={formPrice}
                      onChange={(e) => setFormPrice(e.target.value)}
                      placeholder="19.99"
                      className="w-full rounded-xl border border-red-100 bg-gray-50/50 py-3 pl-8 pr-4 text-xs font-medium text-gray-800 placeholder-gray-400 focus:border-red-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-100"
                    />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Describe ingredients, taste profile, and preparation..."
                  className="mt-1.5 w-full rounded-xl border border-red-100 bg-gray-50/50 p-3 text-xs font-medium text-gray-800 placeholder-gray-400 focus:border-red-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-100"
                />
              </div>

              {/* Product Image Upload */}
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                    Product Image
                  </label>
                  {formImg && (
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-600">
                      ✓ Image Attached
                    </span>
                  )}
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileUpload(e.target.files[0]);
                    }
                    e.target.value = "";
                  }}
                  accept="image/png, image/jpeg, image/webp, image/svg+xml, image/gif, image/avif"
                  className="hidden"
                />

                {uploadingImg ? (
                  <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-red-300 bg-red-50/50 p-6 text-center animate-pulse">
                    <div className="mb-2 h-8 w-8 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
                    <p className="text-xs font-bold text-red-600">
                      Uploading Image...
                    </p>
                    <p className="mt-0.5 text-[10px] text-gray-500">
                      Please wait while the image is being uploaded
                    </p>
                  </div>
                ) : formImg ? (
                  <div className="flex items-center gap-4 rounded-2xl border border-red-200 bg-white p-3.5 shadow-sm transition hover:border-red-300">
                    <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border border-gray-100 bg-gray-50 p-1.5 shadow-inner">
                      <Image
                        src={formImg}
                        alt="Product Image"
                        fill
                        className="object-contain"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-gray-800">
                        {formImg.startsWith("/uploads/")
                          ? formImg.replace("/uploads/", "")
                          : formImg.split("/").pop() || "Product Image"}
                      </p>
                      <p className="mt-0.5 truncate text-[11px] text-gray-400">
                        {formImg}
                      </p>
                      <div className="mt-2.5 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 transition hover:bg-red-100 active:scale-95"
                        >
                          <svg
                            className="h-3.5 w-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2.5}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                            />
                          </svg>
                          Change Image
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormImg("")}
                          className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-gray-500 transition hover:bg-gray-100 hover:text-red-600"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-all duration-200 ${
                      isDragging
                        ? "scale-[0.99] border-red-500 bg-red-50/80"
                        : "border-red-200 bg-red-50/20 hover:border-red-400 hover:bg-red-50/40"
                    }`}
                  >
                    <div className="mb-2.5 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100/80 text-red-600 shadow-sm">
                      <svg
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>
                    </div>
                    <p className="text-xs font-bold text-gray-800">
                      <span className="text-red-600 hover:underline">
                        Click to upload
                      </span>{" "}
                      or drag and drop
                    </p>
                    <p className="mt-1 text-[11px] font-medium text-gray-400">
                      PNG, JPG, WEBP, SVG or GIF (Max 10MB)
                    </p>
                  </div>
                )}
              </div>

              {/* Options Section */}
              <div className="rounded-2xl border border-red-100 bg-gray-50/40 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-800">
                      Product Options & Sizes
                    </h4>
                    <p className="text-[10px] text-gray-400">
                      Optional size variations and extra charges
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddOption}
                    className="rounded-full border border-red-200 bg-white px-3 py-1 text-xs font-bold text-red-500 transition hover:bg-red-50"
                  >
                    + Add Option
                  </button>
                </div>

                {formOptions.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {formOptions.map((opt, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 rounded-xl border border-red-100 bg-white p-2"
                      >
                        <input
                          type="text"
                          value={opt.title}
                          onChange={(e) =>
                            handleUpdateOption(idx, "title", e.target.value)
                          }
                          placeholder="Option Name (e.g. Medium, Spicy, Extra Cheese)"
                          className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-800 focus:border-red-400 focus:outline-none"
                        />
                        <div className="relative w-28">
                          <span className="absolute left-2.5 top-1.5 text-xs font-bold text-gray-400">
                            +₹
                          </span>
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            value={opt.additionalPrice}
                            onChange={(e) =>
                              handleUpdateOption(
                                idx,
                                "additionalPrice",
                                e.target.value,
                              )
                            }
                            placeholder="0.00"
                            className="w-full rounded-lg border border-gray-200 py-1.5 pl-7 pr-2 text-xs text-gray-800 focus:border-red-400 focus:outline-none"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(idx)}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
                          title="Remove option"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit & Cancel */}
              <div className="flex justify-end gap-3 border-t border-red-100 pt-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-full border border-gray-200 bg-white px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 rounded-full bg-red-500 px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-xs transition hover:bg-red-600 disabled:opacity-50"
                >
                  {saving && (
                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  )}
                  {editingProduct ? "Update Product" : "Create Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-red-100 bg-white p-6 shadow-2xl text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-500">
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
                  d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-800">
              Delete &quot;{deleteProduct.title}&quot;?
            </h3>
            <p className="mt-2 text-xs text-gray-500">
              Are you sure you want to permanently delete this product? It will
              no longer appear on the customer menu or categories page.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <button
                disabled={deleting}
                onClick={() => setDeleteProduct(null)}
                className="rounded-full border border-gray-200 bg-white px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                disabled={deleting}
                onClick={handleDelete}
                className="rounded-full bg-red-600 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-xs transition hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete Product"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
