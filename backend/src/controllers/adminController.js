const supabase = require("../config/supabase");

const PRODUCT_SELECT = "*, categories(id, name, slug)";

const slugify = value =>
  String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const normalizePriceValues = (priceValue, initialValue, discountedValue) => {
  const parsedInitialPrice = Number(initialValue ?? priceValue ?? 0);
  const parsedDiscountedPrice = Number(discountedValue ?? priceValue ?? 0);
  return { parsedInitialPrice, parsedDiscountedPrice };
};

const validateProductValues = ({
  category_id,
  name,
  stock,
  parsedInitialPrice,
  parsedDiscountedPrice,
}) => {
  if (
    !category_id ||
    typeof name !== "string" ||
    !name.trim() ||
    !Number.isFinite(parsedInitialPrice) ||
    !Number.isFinite(parsedDiscountedPrice) ||
    parsedInitialPrice < 0 ||
    parsedDiscountedPrice < 0
  ) {
    return "Category, name, and valid non-negative prices are required";
  }
  if (
    stock !== undefined &&
    (!Number.isInteger(Number(stock)) ||
      Number(stock) < 0 ||
      Number(stock) > 1000000)
  ) {
    return "Stock must be a whole number between 0 and 1,000,000";
  }
  if (parsedDiscountedPrice > parsedInitialPrice)
    return "Discounted price cannot exceed the initial price";
  return null;
};

const categoryExists = async categoryId => {
  const { data, error } = await supabase
    .from("categories")
    .select("id")
    .eq("id", categoryId)
    .maybeSingle();

  if (error) throw error;
  return Boolean(data);
};

const databaseWriteError = (error, resource) => {
  if (error?.code === "42501") {
    return `Database permissions rejected this ${resource} change. Set Render's SUPABASE_SERVICE_ROLE_KEY to the server-only Supabase service_role key, then redeploy.`;
  }
  if (error?.code === "23503") {
    return "The selected category is not valid in the database. Refresh the page, select a category again, and retry.";
  }
  return error?.message || `Unable to save ${resource}`;
};

const normalizeProduct = product => {
  if (!product) return product;
  const categoryCandidate = product.categories || product.category || null;
  const category = Array.isArray(categoryCandidate)
    ? categoryCandidate[0]
    : categoryCandidate;

  return {
    ...product,
    category,
    categories: category,
    category_id: category?.id ?? product.category_id ?? null,
    price: Number(product.discounted_price ?? product.price ?? 0),
    initial_price: Number(product.initial_price ?? product.price ?? 0),
    discounted_price: Number(product.discounted_price ?? product.price ?? 0),
    stock: Number(product.stock ?? 0),
  };
};

// Add a New Product
exports.addProduct = async (req, res) => {
  const {
    category_id,
    name,
    description,
    price,
    initial_price,
    discounted_price,
    stock,
    images,
    image_name,
    is_featured,
    brand,
    slug,
    meta_title,
    meta_description,
  } = req.body;

  const { parsedInitialPrice, parsedDiscountedPrice } = normalizePriceValues(
    price,
    initial_price,
    discounted_price,
  );

  const validationError = validateProductValues({
    category_id,
    name,
    stock,
    parsedInitialPrice,
    parsedDiscountedPrice,
  });
  if (validationError) return res.status(400).json({ error: validationError });

  const categoryId = String(category_id).trim();
  try {
    if (!(await categoryExists(categoryId))) {
      return res.status(400).json({
        error: "The selected category no longer exists. Refresh the page and choose a category from the list.",
      });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }

  const { data, error } = await supabase
    .from("products")
    .insert([
      {
        category_id: categoryId,
        name,
        brand: typeof brand === "string" ? brand.trim().slice(0, 80) : null,
        slug: slugify(slug || name),
        description,
        meta_title: meta_title || null,
        meta_description: meta_description || null,
        price: parsedDiscountedPrice,
        initial_price: parsedInitialPrice,
        discounted_price: parsedDiscountedPrice,
        stock: Number(stock || 0),
        images: Array.isArray(images) ? images : [],
        image_name: typeof image_name === "string" ? image_name.trim() : null,
        is_featured: Boolean(is_featured),
      },
    ])
    .select(PRODUCT_SELECT)
    .single();

  if (error) {
    console.error("Admin addProduct failed:", {
      category_id: categoryId,
      error: error.message,
      details: error.details,
      hint: error.hint,
    });
    return res.status(error.code === "23505" ? 409 : 500).json({
      error:
        error.code === "23505"
          ? "This URL slug is already in use"
          : databaseWriteError(error, "product"),
    });
  }
  res
    .status(201)
    .json({ message: "Product added successfully", product: normalizeProduct(data) });
};

// Update an Existing Product
exports.updateProduct = async (req, res) => {
  const { product_id } = req.params;
  const {
    category_id,
    name,
    description,
    price,
    initial_price,
    discounted_price,
    stock,
    images,
    image_name,
    is_featured,
    brand,
    slug,
    meta_title,
    meta_description,
  } = req.body;

  const { parsedInitialPrice, parsedDiscountedPrice } = normalizePriceValues(
    price,
    initial_price,
    discounted_price,
  );

  const validationError = validateProductValues({
    category_id,
    name,
    stock,
    parsedInitialPrice,
    parsedDiscountedPrice,
  });
  if (validationError) return res.status(400).json({ error: validationError });

  const categoryId = String(category_id).trim();
  try {
    if (!(await categoryExists(categoryId))) {
      return res.status(400).json({
        error: "The selected category no longer exists. Refresh the page and choose a category from the list.",
      });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }

  const { data, error } = await supabase
    .from("products")
    .update({
      category_id: categoryId,
      name,
      brand: typeof brand === "string" ? brand.trim().slice(0, 80) : null,
      slug: slugify(slug || name),
      description,
      meta_title: meta_title || null,
      meta_description: meta_description || null,
      price: parsedDiscountedPrice,
      initial_price: parsedInitialPrice,
      discounted_price: parsedDiscountedPrice,
      stock: Number(stock || 0),
      images: Array.isArray(images) ? images : [],
      image_name: typeof image_name === "string" ? image_name.trim() : null,
      is_featured: Boolean(is_featured),
    })
    .eq("id", product_id)
    .select(PRODUCT_SELECT)
    .maybeSingle();

  if (error)
    return res.status(error.code === "23505" ? 409 : 500).json({
      error:
        error.code === "23505"
          ? "This URL slug is already in use"
          : databaseWriteError(error, "product"),
    });
  if (!data) return res.status(404).json({ error: "Product not found" });

  res
    .status(200)
    .json({ message: "Product updated successfully", product: normalizeProduct(data) });
};

// Delete a Product
exports.deleteProduct = async (req, res) => {
  const { product_id } = req.params;

  const { data, error } = await supabase
    .from("products")
    .delete()
    .eq("id", product_id)
    .select("id")
    ;

  if (error) return res.status(500).json({ error: databaseWriteError(error, "product") });
  const product = Array.isArray(data) ? data[0] : data;
  if (!product) return res.status(404).json({ error: "Product not found or cannot be deleted" });

  res.status(200).json({ message: "Product deleted successfully" });
};

// Get all customer orders for admin
exports.getAllOrders = async (req, res) => {
  const { data, error } = await supabase
    .from("orders")
    .select(
      `
        id, total_amount, status, shipping_address, created_at, profile_id,
        profiles (full_name),
        order_items (
          quantity, price_at_purchase,
          products (name, images)
        )
      `,
    )
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.status(200).json({ orders: data });
};

// Update Order Status
exports.updateOrderStatus = async (req, res) => {
  const { order_id } = req.params;
  const { status } = req.body;

  const validStatuses = [
    "pending",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
  ];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: "Invalid status update" });
  }

  const { data, error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", order_id)
    .select();

  if (error) return res.status(500).json({ error: error.message });
  const order = Array.isArray(data) ? data[0] : data;
  if (!order) return res.status(404).json({ error: "Order not found" });
  res.status(200).json({ message: `Order marked as ${status}`, order });
};
