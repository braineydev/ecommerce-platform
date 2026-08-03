"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";

const TABS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "products", label: "Products" },
  { id: "customers", label: "Customers" },
  { id: "orders", label: "Orders" },
];

const formatCurrency = value => `Ksh. ${Number(value || 0).toLocaleString()}`;

const slugify = value =>
  String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const isValidSlug = slug =>
  /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(String(slug || "").trim());

const isValidPhone = phone =>
  /^[0-9()+\-.\s]*$/.test(String(phone || "").trim());

const MAX_IMAGE_FILE_SIZE = 5 * 1024 * 1024;
const MAX_IMAGE_DIMENSION = 2048;

const validateImageFile = file =>
  new Promise((resolve, reject) => {
    if (file.size > MAX_IMAGE_FILE_SIZE) {
      reject(new Error("Image file exceeds the 5MB limit."));
      return;
    }
    if (
      !["image/jpeg", "image/png", "image/webp", "image/avif"].includes(
        file.type,
      )
    ) {
      reject(new Error("Use a JPEG, PNG, WebP, or AVIF image."));
      return;
    }

    const imageUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(imageUrl);
      if (
        image.width > MAX_IMAGE_DIMENSION ||
        image.height > MAX_IMAGE_DIMENSION
      ) {
        reject(
          new Error(
            `Image dimensions must not exceed ${MAX_IMAGE_DIMENSION}x${MAX_IMAGE_DIMENSION}px.`,
          ),
        );
        return;
      }
      resolve();
    };
    image.onerror = () => {
      URL.revokeObjectURL(imageUrl);
      reject(new Error("The selected file is not a valid image."));
    };
    image.src = imageUrl;
  });

const normalizeProductForForm = product => ({
  ...product,
  category_id:
    product?.category_id ??
    product?.category?.id ??
    (Array.isArray(product?.categories)
      ? product.categories[0]?.id
      : product?.categories?.id) ??
    "",
  name: product?.name || "",
  description: product?.description || "",
  price: Number(product?.discounted_price ?? product?.price ?? 0),
  initial_price: Number(product?.initial_price ?? product?.price ?? 0),
  discounted_price: Number(product?.discounted_price ?? product?.price ?? 0),
  stock: Number(product?.stock ?? 0),
  slug: product?.slug || "",
  meta_title: product?.meta_title || "",
  meta_description: product?.meta_description || "",
  images: Array.isArray(product?.images) ? product.images : [],
  image_name:
    product?.image_name ||
    (Array.isArray(product?.images) ? product.images[0] : "") ||
    "",
  is_featured: Boolean(product?.is_featured),
});

export default function AdminPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [tab, setTab] = useState("dashboard");
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [success, setSuccess] = useState("");
  const [categoriesError, setCategoriesError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [isSavingCustomer, setIsSavingCustomer] = useState(false);

  const apiUrl = "/api";

  const fetchCategories = async () => {
    const res = await fetch(`${apiUrl}/products/categories`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Unable to load categories");
    return data.data || [];
  };

  const fetchOrders = async () => {
    const res = await fetch(`${apiUrl}/admin/orders`, {
      credentials: "include",
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Unable to load orders");
    return data.orders || [];
  };

  const fetchProducts = async () => {
    const res = await fetch(`${apiUrl}/products`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Unable to load products");
    return data.data || [];
  };

  const fetchCustomers = async () => {
    const res = await fetch(`${apiUrl}/customers`, { credentials: "include" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Unable to load customers");
    return data.customers || [];
  };

  const fetchAnalytics = async () => {
    const res = await fetch(`${apiUrl}/admin/analytics`, {
      credentials: "include",
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Unable to load analytics");
    return data;
  };

  useEffect(() => {
    if (!success) return;

    const timer = window.setTimeout(() => {
      setSuccess("");
    }, 2600);

    return () => window.clearTimeout(timer);
  }, [success]);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const results = await Promise.allSettled([
          fetchOrders(),
          fetchProducts(),
          fetchCustomers(),
          fetchAnalytics(),
          fetchCategories(),
        ]);

        results.forEach((result, index) => {
          if (result.status === "rejected") {
            console.error(
              `Admin data fetch ${index} failed:`,
              result.reason?.message || result.reason,
            );
            if (index === 4) {
              setCategoriesError(
                result.reason?.message ||
                  "Unable to load categories. Please refresh and try again.",
              );
            }
          }
        });

        setOrders(results[0].status === "fulfilled" ? results[0].value : []);
        setProducts(results[1].status === "fulfilled" ? results[1].value : []);
        setCustomers(results[2].status === "fulfilled" ? results[2].value : []);
        setAnalytics(
          results[3].status === "fulfilled" ? results[3].value : null,
        );
        setCategories(
          results[4].status === "fulfilled" ? results[4].value : [],
        );

        // Show error only if all critical data failed
        const failed = results.filter(r => r.status === "rejected");
        if (failed.length === results.length) {
          setLoadError("Unable to load admin data");
        } else if (failed.length > 0) {
          console.warn(`${failed.length} data source(s) failed to load`);
        }
      } catch (err) {
        setLoadError(err.message || "Unable to load admin data");
      } finally {
        setIsLoading(false);
      }
    };

    if (!isAuthLoading && user) {
      if (user.role !== "admin") return;
      load();
    }
  }, [isAuthLoading, user]);

  const accessDenied = !isAuthLoading && (!user || user.role !== "admin");

  const dashboardItems = useMemo(() => {
    if (!analytics) return [];
    return [
      {
        label: "Total revenue",
        value: formatCurrency(analytics.metrics.totalRevenue),
      },
      { label: "Total orders", value: analytics.metrics.totalOrders },
      { label: "Pending", value: analytics.metrics.pendingCount },
      { label: "Processing", value: analytics.metrics.processingCount },
      { label: "Shipped", value: analytics.metrics.shippedCount },
      { label: "Delivered", value: analytics.metrics.deliveredCount },
    ];
  }, [analytics]);

  const resetProductForm = () => {
    setSelectedProduct(
      normalizeProductForForm({
        name: "",
        category_id: "",
        price: 0,
        initial_price: 0,
        discounted_price: 0,
        stock: 0,
        description: "",
        slug: "",
        meta_title: "",
        meta_description: "",
        images: [],
        image_name: "",
        is_featured: false,
      }),
    );
  };

  const openProductModal = product => {
    setSelectedProduct(product ? normalizeProductForForm(product) : null);
    setError("");
    setSuccess("");
    setIsProductModalOpen(true);
  };

  const closeProductModal = () => {
    if (isSavingProduct) return;
    setIsProductModalOpen(false);
    setSelectedProduct(null);
    setError("");
    setSuccess("");
  };

  const handleProductSelect = product => {
    openProductModal(product);
  };

  const handleCustomerSelect = customer => {
    setSelectedCustomer(customer);
    setSuccess("");
    setError("");
    setIsCustomerModalOpen(true);
  };

  const closeCustomerModal = () => {
    if (isSavingCustomer) return;
    setIsCustomerModalOpen(false);
    setSelectedCustomer(null);
  };

  const uploadProductImage = async event => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError("");
    setSuccess("");
    setIsUploadingImage(true);

    try {
      await validateImageFile(file);
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch(`${apiUrl}/admin/upload-image`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Unable to upload image");
      }

      setSelectedProduct(prev => ({
        ...prev,
        image_name: data.imageUrl,
        images: [data.imageUrl],
      }));
      setSuccess("Image uploaded successfully");
    } catch (err) {
      setError(err.message || "Unable to upload image");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const saveProduct = async event => {
    event.preventDefault();
    if (isSavingProduct) return;
    setError("");
    setSuccess("");

    const normalizedName = String(selectedProduct?.name || "").trim();
    const normalizedCategoryId = String(
      selectedProduct?.category_id || "",
    ).trim();
    const initialPrice = Number(
      selectedProduct?.initial_price ?? selectedProduct?.price ?? 0,
    );
    const discountedPrice = Number(
      selectedProduct?.discounted_price ?? selectedProduct?.price ?? 0,
    );
    const rawSlug = String(selectedProduct?.slug || "").trim();
    const slugValue = rawSlug || slugify(normalizedName);

    if (!normalizedName || !normalizedCategoryId) {
      setError("Product name and category are required.");
      return;
    }

    if (rawSlug && !isValidSlug(rawSlug)) {
      setError(
        "Product slug must use only lowercase letters, numbers, and single hyphens.",
      );
      return;
    }

    if (!Number.isFinite(discountedPrice) || discountedPrice <= 0) {
      setError("A valid discounted price is required.");
      return;
    }

    if (discountedPrice > initialPrice) {
      setError("Discounted price cannot exceed the initial price.");
      return;
    }

    const method = selectedProduct.id ? "PUT" : "POST";
    const url = selectedProduct.id
      ? `${apiUrl}/admin/products/${selectedProduct.id}`
      : `${apiUrl}/admin/products`;

    const imageName =
      typeof selectedProduct.image_name === "string"
        ? selectedProduct.image_name.trim()
        : "";
    const normalizedImages = imageName
      ? [imageName]
      : Array.isArray(selectedProduct.images)
        ? selectedProduct.images.filter(Boolean)
        : [];

    const payload = {
      name: normalizedName,
      // Preserve UUID category IDs as well as numeric IDs. PostgreSQL performs
      // the appropriate conversion for the configured category column.
      category_id: normalizedCategoryId,
      description: selectedProduct.description || null,
      brand:
        typeof selectedProduct.brand === "string"
          ? selectedProduct.brand.trim()
          : null,
      slug: slugValue,
      meta_title: selectedProduct.meta_title || null,
      meta_description: selectedProduct.meta_description || null,
      price: discountedPrice,
      initial_price: initialPrice || discountedPrice,
      discounted_price: discountedPrice,
      stock: Number(selectedProduct.stock || 0),
      images: normalizedImages,
      image_name: imageName || null,
      is_featured: Boolean(selectedProduct.is_featured),
    };

    setIsSavingProduct(true);
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Unable to save product");

      setSuccess(data.message || "Product saved successfully");
      setProducts(prev => {
        const updated = prev.filter(item => item.id !== data.product.id);
        return [data.product, ...updated];
      });
      setIsProductModalOpen(false);
      resetProductForm();
    } catch (err) {
      setError(err.message || "Unable to save product");
    } finally {
      setIsSavingProduct(false);
    }
  };

  const updateCustomer = async event => {
    event.preventDefault();
    if (isSavingCustomer) return;
    setError("");
    setSuccess("");

    if (!selectedCustomer) {
      setError("Select a customer to update.");
      return;
    }

    const normalizedCustomerName = String(
      selectedCustomer.full_name || "",
    ).trim();
    const normalizedCustomerPhone = String(selectedCustomer.phone || "").trim();
    const normalizedCustomerRole = String(selectedCustomer.role || "customer");

    if (!normalizedCustomerName) {
      setError("Customer name is required.");
      return;
    }
    if (normalizedCustomerName.length > 100) {
      setError("Customer name must be 100 characters or less.");
      return;
    }
    if (
      normalizedCustomerPhone &&
      (!isValidPhone(normalizedCustomerPhone) ||
        normalizedCustomerPhone.length > 30)
    ) {
      setError(
        "Phone may only include numbers, spaces, +, -, ., and parentheses, and must be 30 characters or less.",
      );
      return;
    }
    if (!["customer", "admin"].includes(normalizedCustomerRole)) {
      setError("Invalid customer role selected.");
      return;
    }

    const payload = {
      full_name: normalizedCustomerName,
      phone: normalizedCustomerPhone || null,
      role: normalizedCustomerRole,
    };

    setIsSavingCustomer(true);
    try {
      const res = await fetch(`${apiUrl}/customers/${selectedCustomer.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Unable to update customer");

      setSuccess(data.message || "Customer updated successfully");
      setCustomers(prev =>
        prev.map(item => (item.id === data.customer.id ? data.customer : item)),
      );
      setIsCustomerModalOpen(false);
      setSelectedCustomer(null);
    } catch (err) {
      setError(err.message || "Unable to update customer");
    } finally {
      setIsSavingCustomer(false);
    }
  };

  const deleteCustomer = async () => {
    if (!selectedCustomer) return;
    const name = selectedCustomer.full_name || "this customer";
    if (!window.confirm(`Delete ${name}'s account? This cannot be undone.`))
      return;

    setError("");
    setSuccess("");
    const res = await fetch(`${apiUrl}/customers/${selectedCustomer.id}`, {
      method: "DELETE",
      credentials: "include",
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Unable to delete customer");
      return;
    }
    setCustomers(prev =>
      prev.filter(customer => customer.id !== selectedCustomer.id),
    );
    setSelectedCustomer(null);
    setSuccess(data.message || "Customer account deleted");
  };

  const updateOrderStatus = async (orderId, status) => {
    setError("");
    setSuccess("");

    const res = await fetch(`${apiUrl}/admin/orders/${orderId}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Unable to update order status");
      return;
    }

    setSuccess(data.message || "Order status updated");
    setOrders(prev =>
      prev.map(order => (order.id === data.order.id ? data.order : order)),
    );
  };

  const tabClasses = id =>
    `px-4 py-2 text-[11px] font-medium uppercase tracking-[0.11em] transition ${
      tab === id
        ? "bg-[#171716] text-white"
        : "border border-neutral-200 bg-white text-neutral-600 hover:border-neutral-400"
    }`;

  return (
    <div className="min-h-screen bg-[#fcfcfb] px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
      <div className="mx-auto max-w-7xl border border-neutral-200 bg-white p-6 sm:p-8">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-neutral-500">
              Admin panel
            </p>
            <h1 className="mt-3 text-3xl font-medium tracking-[-0.045em] text-neutral-950">
              Store management
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Signed in as {user?.email || "admin"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {TABS.map(item => (
              <button
                key={item.id}
                type="button"
                className={tabClasses(item.id)}
                onClick={() => setTab(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {accessDenied ? (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
            Access denied: Admins only.
          </div>
        ) : isLoading ? (
          <div className="border border-neutral-200 bg-[#f1f0ed] p-8 text-sm text-neutral-500">
            Loading admin dashboard…
          </div>
        ) : loadError ? (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
            {loadError}
          </div>
        ) : (
          <>
            {error && (
              <div
                className="mb-6 flex items-center justify-between gap-3 border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                role="alert"
              >
                <span>{error}</span>
                <button
                  type="button"
                  onClick={() => setError("")}
                  className="text-xs font-semibold uppercase tracking-wide"
                >
                  Dismiss
                </button>
              </div>
            )}
            {success && (
              <div
                className="pointer-events-none fixed inset-x-0 top-4 z-[80] flex justify-center px-4 sm:px-6 animate-in fade-in zoom-in-95 slide-in-from-top-4 duration-300"
                role="status"
                aria-live="polite"
              >
                <div className="pointer-events-auto flex items-center gap-3 rounded-full border border-green-200 bg-slate-950/95 px-4 py-3 text-sm font-semibold text-white shadow-[0_18px_45px_rgba(0,0,0,0.24)]">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-base text-green-400">
                    ✓
                  </div>
                  <div className="leading-tight">
                    <p>{success}</p>
                    <p className="text-xs font-medium text-gray-300">
                      Saved to your catalog
                    </p>
                  </div>
                  <button
                    type="button"
                    className="rounded-full px-2 py-1 text-xs text-gray-300 transition hover:bg-white/10 hover:text-white"
                    onClick={() => setSuccess("")}
                  >
                    ×
                  </button>
                </div>
              </div>
            )}
            {tab === "dashboard" && (
              <div className="grid gap-6 md:grid-cols-3">
                {dashboardItems.map(item => (
                  <div
                    key={item.label}
                    className="rounded-3xl border border-gray-100 bg-gray-50 p-6"
                  >
                    <p className="text-sm text-gray-500">{item.label}</p>
                    <p className="mt-3 text-2xl font-semibold text-black">
                      {item.value}
                    </p>
                  </div>
                ))}
                {analytics?.lowStockAlerts?.length > 0 && (
                  <div className="rounded-3xl border border-amber-100 bg-amber-50 p-6 md:col-span-3">
                    <p className="text-sm font-semibold text-amber-700">
                      Low stock alerts
                    </p>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      {analytics.lowStockAlerts.map(product => (
                        <div
                          key={product.id}
                          className="rounded-2xl bg-white p-4 shadow-sm"
                        >
                          <p className="font-semibold text-gray-900">
                            {product.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            Stock: {product.stock}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {tab === "products" && (
              <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
                <div className="space-y-6">
                  <div className="border border-neutral-200 bg-white">
                    <div className="flex flex-col gap-4 border-b border-neutral-200 p-6 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-neutral-500">
                          Catalogue
                        </p>
                        <h2 className="mt-2 text-2xl font-medium tracking-[-0.04em] text-neutral-950">
                          Products
                        </h2>
                        <p className="mt-1 text-sm text-neutral-500">
                          Manage your store inventory.
                        </p>
                      </div>
                      <button
                        type="button"
                        className="bg-[#171716] px-4 py-3 text-[11px] font-medium uppercase tracking-[0.12em] text-white hover:bg-neutral-700"
                        onClick={() => {
                          resetProductForm();
                          setIsProductModalOpen(true);
                        }}
                      >
                        New product
                      </button>
                    </div>
                    <div className="rounded-4xl border border-neutral-200 bg-white shadow-sm">
                      <div className="px-5 py-4 md:hidden">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-neutral-500">
                              Product list
                            </p>
                            <h3 className="mt-1 text-lg font-semibold text-neutral-950">
                              Quick catalog overview
                            </h3>
                          </div>
                          <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-700">
                            {products.length} products
                          </span>
                        </div>
                      </div>

                      <div className="space-y-4 px-4 py-4 md:hidden max-w-[min(100%,420px)] mx-auto">
                        {products.map(product => (
                          <div
                            key={product.id}
                            className="rounded-3xl border border-neutral-200 bg-[#f9faf8] p-3 shadow-sm overflow-hidden"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="min-w-0">
                                <p className="text-base font-semibold text-neutral-950 truncate">
                                  {product.name}
                                </p>
                                <p className="mt-2 text-xs uppercase tracking-[0.14em] text-neutral-500">
                                  {product.category?.name ||
                                    product.categories?.name ||
                                    "Uncategorised"}
                                </p>
                              </div>
                              <div className="shrink-0 text-right">
                                <p className="text-sm font-semibold text-neutral-950">
                                  {formatCurrency(product.price)}
                                </p>
                                <p className="mt-2 text-xs text-neutral-600">
                                  {product.stock ?? 0} in stock
                                </p>
                              </div>
                            </div>

                              <div className="mt-3 flex flex-wrap gap-2">
                              <span className="inline-flex items-center rounded-full bg-[#eef7f2] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-700">
                                {product.stock > 20
                                  ? "Plenty"
                                  : product.stock > 5
                                    ? "Low stock"
                                    : "Almost out"}
                              </span>
                              <span className="inline-flex items-center rounded-full bg-[#eff3f8] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-700">
                                {product.image_name ? "Has image" : "No image"}
                              </span>
                            </div>

                            <div className="mt-3 grid gap-2 sm:grid-cols-2">
                              <button
                                type="button"
                                className="w-full rounded-3xl border border-neutral-300 bg-white px-3 py-2 text-sm font-semibold uppercase tracking-[0.11em] text-neutral-950 transition hover:border-neutral-400 hover:bg-neutral-50"
                                onClick={() => handleProductSelect(product)}
                              >
                                Edit product
                              </button>
                              <button
                                type="button"
                                className="w-full rounded-3xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold uppercase tracking-[0.11em] text-red-700 transition hover:bg-red-100"
                                onClick={async () => {
                                  if (!confirm("Delete this product?")) return;
                                  const res = await fetch(
                                    `${apiUrl}/admin/products/${product.id}`,
                                    {
                                      method: "DELETE",
                                      credentials: "include",
                                    },
                                  );
                                  const data = await res.json();
                                  if (!res.ok) {
                                    setError(
                                      data.error || "Unable to delete product",
                                    );
                                    return;
                                  }
                                  setSuccess(data.message || "Product deleted");
                                  setProducts(prev =>
                                    prev.filter(item => item.id !== product.id),
                                  );
                                  if (selectedProduct?.id === product.id)
                                    setSelectedProduct(null);
                                }}
                              >
                                Delete product
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="hidden overflow-x-auto overscroll-x-contain md:block rounded-b-3xl">
                        <table className="w-full text-left text-sm">
                          <thead className="border-b border-neutral-200 bg-[#f1f0ed] text-[10px] font-medium uppercase tracking-[0.12em] text-neutral-500">
                            <tr>
                              <th className="px-4 py-3">Name</th>
                              <th className="hidden px-4 py-3 sm:table-cell">
                                Category
                              </th>
                              <th className="px-4 py-3">Price</th>
                              <th className="hidden px-4 py-3 md:table-cell">
                                Stock
                              </th>
                              <th className="px-4 py-3">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {products.map(product => (
                              <tr
                                key={product.id}
                                className="border-t border-neutral-200"
                              >
                                <td className="px-4 py-4 font-medium text-neutral-950">
                                  {product.name}
                                </td>
                                <td className="hidden px-4 py-3 text-neutral-600 sm:table-cell">
                                  {product.category?.name ||
                                    product.categories?.name ||
                                    "Uncategorised"}
                                </td>
                                <td className="px-4 py-3">
                                  {formatCurrency(product.price)}
                                </td>
                                <td className="hidden px-4 py-3 md:table-cell">
                                  {product.stock}
                                </td>
                                <td className="whitespace-nowrap px-4 py-3 space-x-2">
                                  <button
                                    type="button"
                                    className="border border-neutral-300 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.1em] text-neutral-700 hover:bg-neutral-100"
                                    onClick={() => handleProductSelect(product)}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    className="border border-red-200 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.1em] text-red-700 hover:bg-red-50"
                                    onClick={async () => {
                                      if (!confirm("Delete this product?"))
                                        return;
                                      const res = await fetch(
                                        `${apiUrl}/admin/products/${product.id}`,
                                        {
                                          method: "DELETE",
                                          credentials: "include",
                                        },
                                      );
                                      const data = await res.json();
                                      if (!res.ok) {
                                        setError(
                                          data.error ||
                                            "Unable to delete product",
                                        );
                                        return;
                                      }
                                      setSuccess(
                                        data.message || "Product deleted",
                                      );
                                      setProducts(prev =>
                                        prev.filter(
                                          item => item.id !== product.id,
                                        ),
                                      );
                                      if (selectedProduct?.id === product.id)
                                        setSelectedProduct(null);
                                    }}
                                  >
                                    Delete
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border border-neutral-200 bg-[#f1f0ed] p-6">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-neutral-500">
                        Editor
                      </p>
                      <h2 className="mt-2 text-xl font-medium tracking-[-0.03em] text-neutral-950">
                        Product details
                      </h2>
                      <p className="mt-1 text-sm text-gray-500">
                        Use the button below to add or edit a product.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="bg-[#171716] px-4 py-3 text-[10px] font-medium uppercase tracking-[0.1em] text-white hover:bg-neutral-700"
                      onClick={() => {
                        resetProductForm();
                        setIsProductModalOpen(true);
                      }}
                    >
                      Add product
                    </button>
                  </div>

                  <div className="mt-5 border-t border-neutral-300 pt-5 text-sm leading-6 text-neutral-600">
                    {selectedProduct?.id ? (
                      <span>
                        Editing{" "}
                        <span className="font-semibold text-gray-900">
                          {selectedProduct.name}
                        </span>{" "}
                        from the list will open the modal for changes.
                      </span>
                    ) : (
                      <span>
                        Select an existing product from the list or create a new
                        one to open the editor.
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {isProductModalOpen && selectedProduct && (
              <div className="fixed inset-0 z-60 flex items-end justify-center bg-black/40 px-4 py-6 sm:items-center sm:px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
                <div className="w-full max-w-[min(100%,420px)] sm:max-w-2xl overflow-hidden rounded-4xl border border-neutral-200 bg-white shadow-2xl sm:mx-0 mx-auto">
                  <div className="border-b border-neutral-200 bg-slate-50 px-4 py-5 sm:px-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                          {selectedProduct.id ? "Edit product" : "Add product"}
                        </p>
                        <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-neutral-950">
                          {selectedProduct.id
                            ? "Update item details"
                            : "Add a new item"}
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-neutral-600">
                          {selectedProduct.id
                            ? "Tap into the fields below to save catalog changes quickly."
                            : "Fill in the fields to add a product to your storefront."}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="rounded-full border border-neutral-300 bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-900 transition hover:bg-neutral-50"
                        onClick={closeProductModal}
                        disabled={isSavingProduct}
                      >
                        Close
                      </button>
                    </div>
                  </div>

                  <div className="max-h-[calc(100dvh-10rem)] overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
                    <form onSubmit={saveProduct} className="space-y-6 pb-6">
                      {error && (
                        <div
                          className="rounded-3xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                          role="alert"
                        >
                          {error}
                        </div>
                      )}

                      <div className="space-y-4 rounded-3xl border border-neutral-200 bg-[#f7f6f2] p-3">
                        <div>
                          <label className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-600">
                            Product name
                          </label>
                          <input
                            value={selectedProduct.name}
                            onChange={e =>
                              setSelectedProduct(prev => ({
                                ...prev,
                                name: e.target.value,
                              }))
                            }
                            className="mt-2 w-full rounded-3xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-950 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
                            required
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-600">
                            Slug / URL key
                          </label>
                          <input
                            value={selectedProduct.slug}
                            onChange={e =>
                              setSelectedProduct(prev => ({
                                ...prev,
                                slug: e.target.value,
                              }))
                            }
                            placeholder="optional product-slug"
                            className="mt-2 w-full rounded-3xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-950 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
                          />
                          <p className="mt-2 text-xs text-neutral-500">
                            Optional. If blank, a slug is generated from the
                            name.
                          </p>
                        </div>
                      </div>

                      <div className="space-y-4 rounded-3xl border border-neutral-200 bg-[#f7f6f2] p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-600">
                              Category
                            </p>
                            <p className="mt-1 text-sm text-neutral-600">
                              Tap to choose the product category.
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                          {categories.map((category, categoryIndex) => {
                            const selected =
                              String(selectedProduct.category_id) ===
                              String(category.id);
                            return (
                              <button
                                key={
                                  category.id ??
                                  category.slug ??
                                  category.name ??
                                  `category-${categoryIndex}`
                                }
                                type="button"
                                onClick={() =>
                                  setSelectedProduct(prev => ({
                                    ...prev,
                                    category_id: category.id,
                                  }))
                                }
                                className={`rounded-3xl border px-3 py-2 text-left text-sm font-semibold uppercase tracking-[0.11em] transition truncate ${selected ? "border-neutral-900 bg-neutral-950 text-white" : "border-neutral-300 bg-white text-neutral-700 hover:border-neutral-900"}`}
                                aria-pressed={selected}
                              >
                                {category.name}
                              </button>
                            );
                          })}
                        </div>
                        {!categories.length && (
                          <p className="text-sm text-red-600">
                            {categoriesError ||
                              "Categories are loading. Please try again in a moment."}
                          </p>
                        )}
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-3 rounded-3xl border border-neutral-200 bg-[#f7f6f2] p-3">
                          <label className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-600">
                            Initial price
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={selectedProduct.initial_price}
                            onChange={e =>
                              setSelectedProduct(prev => ({
                                ...prev,
                                initial_price: Number(e.target.value),
                                discounted_price: Math.min(
                                  Number(prev.discounted_price || 0),
                                  Number(e.target.value || 0),
                                ),
                              }))
                            }
                            className="w-full rounded-3xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-950 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
                          />
                        </div>
                        <div className="space-y-3 rounded-3xl border border-neutral-200 bg-[#f7f6f2] p-4">
                          <label className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-600">
                            Discounted price
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            max={selectedProduct.initial_price || 0}
                            value={selectedProduct.discounted_price}
                            onChange={e =>
                              setSelectedProduct(prev => ({
                                ...prev,
                                discounted_price: Math.min(
                                  Number(e.target.value || 0),
                                  Number(prev.initial_price || 0),
                                ),
                              }))
                            }
                            className="w-full rounded-3xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-950 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
                            required
                          />
                          <p className="text-xs text-neutral-500">
                            Keeps the sale price at or below the list price.
                          </p>
                        </div>
                      </div>

                      <div className="space-y-4 rounded-3xl border border-neutral-200 bg-[#f7f6f2] p-4">
                        <label className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-600">
                          Product image
                        </label>
                        <div className="space-y-3">
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/avif"
                            onChange={uploadProductImage}
                            className="w-full rounded-3xl border border-dashed border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900"
                          />
                          <p className="text-xs text-neutral-500">
                            {isUploadingImage
                              ? "Uploading image..."
                              : "Use JPEG, PNG, WebP, or AVIF up to 5MB."}
                          </p>
                          <input
                            value={selectedProduct.image_name || ""}
                            onChange={e =>
                              setSelectedProduct(prev => ({
                                ...prev,
                                image_name: e.target.value,
                              }))
                            }
                            placeholder="product.jpg or https://..."
                            className="w-full rounded-3xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900"
                          />
                        </div>
                      </div>

                      <div className="space-y-4 rounded-3xl border border-neutral-200 bg-[#f7f6f2] p-4">
                        <label className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-600">
                          Stock & description
                        </label>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={selectedProduct.stock}
                            onChange={e =>
                              setSelectedProduct(prev => ({
                                ...prev,
                                stock: Number(e.target.value),
                              }))
                            }
                            className="w-full rounded-3xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
                            placeholder="Stock"
                          />
                          <textarea
                            value={selectedProduct.description}
                            onChange={e =>
                              setSelectedProduct(prev => ({
                                ...prev,
                                description: e.target.value,
                              }))
                            }
                            rows={4}
                            placeholder="Product description"
                            className="w-full rounded-3xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isSavingProduct || isUploadingImage}
                        className="w-full rounded-3xl bg-[#171716] px-4 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-white shadow-[0_10px_24px_rgba(0,0,0,0.12)] transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-400"
                      >
                        {isSavingProduct ? "Saving product…" : "Save product"}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {tab === "customers" && (
              <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
                <div className="rounded-4xl border border-gray-100 bg-gray-50 p-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Customers
                  </h2>
                  <div className="mt-6 overflow-x-auto rounded-3xl border border-gray-200 bg-white">
                    <table className="min-w-full text-left text-sm">
                      <thead className="bg-gray-50 text-gray-600">
                        <tr>
                          <th className="px-4 py-3">Name</th>
                          <th className="px-4 py-3">Email</th>
                          <th className="px-4 py-3">Role</th>
                          <th className="px-4 py-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {customers.map(customer => (
                          <tr
                            key={customer.id}
                            className="border-t border-gray-100"
                          >
                            <td className="px-4 py-3 font-medium text-gray-900">
                              {customer.full_name}
                            </td>
                            <td className="px-4 py-3">{customer.email}</td>
                            <td className="px-4 py-3">{customer.role}</td>
                            <td className="px-4 py-3">
                              <button
                                type="button"
                                className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-200"
                                onClick={() => handleCustomerSelect(customer)}
                              >
                                Edit
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="rounded-4xl border border-gray-100 bg-white p-6 shadow-sm">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Customer editor
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-gray-500">
                    Select Edit on a customer to review and update their details
                    in a focused, mobile-friendly dialog.
                  </p>
                </div>
              </div>
            )}

            {isCustomerModalOpen && selectedCustomer && (
              <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6">
                <div className="w-full max-w-lg rounded-2xl border border-neutral-200 bg-white shadow-2xl">
                  <div className="flex items-start justify-between border-b border-neutral-200 px-5 py-4">
                    <div>
                      <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-neutral-500">
                        Customer editor
                      </p>
                      <h2 className="mt-1 text-xl font-semibold text-neutral-950">
                        Edit customer
                      </h2>
                    </div>
                    <button
                      type="button"
                      onClick={closeCustomerModal}
                      disabled={isSavingCustomer}
                      className="border border-red-300 bg-red-50 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-red-700 hover:bg-red-100 disabled:opacity-50"
                    >
                      Close
                    </button>
                  </div>
                  <form onSubmit={updateCustomer} className="space-y-4 p-5">
                    {error && (
                      <div
                        className="border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                        role="alert"
                      >
                        {error}
                      </div>
                    )}
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Name
                      </label>
                      <input
                        required
                        value={selectedCustomer.full_name || ""}
                        onChange={e =>
                          setSelectedCustomer(prev => ({
                            ...prev,
                            full_name: e.target.value,
                          }))
                        }
                        className="mt-2 w-full border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Phone
                      </label>
                      <input
                        value={selectedCustomer.phone || ""}
                        onChange={e =>
                          setSelectedCustomer(prev => ({
                            ...prev,
                            phone: e.target.value,
                          }))
                        }
                        className="mt-2 w-full border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Role
                      </label>
                      <select
                        value={selectedCustomer.role || "customer"}
                        onChange={e =>
                          setSelectedCustomer(prev => ({
                            ...prev,
                            role: e.target.value,
                          }))
                        }
                        className="mt-2 w-full border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900"
                      >
                        <option value="customer">Customer</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    <button
                      type="submit"
                      disabled={isSavingCustomer}
                      className="w-full bg-[#171716] px-5 py-3 text-[11px] font-medium uppercase tracking-[0.13em] text-white hover:bg-neutral-700 disabled:cursor-not-allowed disabled:bg-neutral-400"
                    >
                      {isSavingCustomer ? "Saving customer…" : "Save customer"}
                    </button>
                    {selectedCustomer.role !== "admin" && (
                      <button
                        type="button"
                        onClick={deleteCustomer}
                        disabled={isSavingCustomer}
                        className="w-full border border-red-200 px-5 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-50"
                      >
                        Delete customer account
                      </button>
                    )}
                  </form>
                </div>
              </div>
            )}

            {tab === "orders" && (
              <div className="rounded-4xl border border-gray-100 bg-gray-50 p-6">
                <h2 className="text-xl font-semibold text-gray-900">Orders</h2>
                <div className="mt-6 overflow-x-auto rounded-3xl border border-gray-200 bg-white">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-600">
                      <tr>
                        <th className="px-4 py-3">Order</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Total</th>
                        <th className="px-4 py-3">Customer</th>
                        <th className="px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map(order => (
                        <tr key={order.id} className="border-t border-gray-100">
                          <td className="px-4 py-3 font-medium text-gray-900">
                            {order.id}
                          </td>
                          <td className="px-4 py-3">{order.status}</td>
                          <td className="px-4 py-3">
                            {formatCurrency(order.total_amount)}
                          </td>
                          <td className="px-4 py-3">
                            {order.profiles?.full_name || "—"}
                          </td>
                          <td className="px-4 py-3 space-x-2">
                            {[
                              "pending",
                              "processing",
                              "shipped",
                              "delivered",
                              "cancelled",
                            ].map(statusOption => (
                              <button
                                key={statusOption}
                                type="button"
                                className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-200"
                                onClick={() =>
                                  updateOrderStatus(order.id, statusOption)
                                }
                              >
                                {statusOption}
                              </button>
                            ))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
