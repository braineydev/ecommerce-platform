const supabase = require("../config/supabase");

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

  const numericCategoryId = Number(category_id);
  const { data, error } = await supabase
    .from("products")
    .insert([
      {
        category_id: numericCategoryId,
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
    .select()
    .single();

  if (error) {
    console.error("Admin addProduct failed:", {
      category_id: numericCategoryId,
      error: error.message,
      details: error.details,
      hint: error.hint,
    });
    return res.status(error.code === "23505" ? 409 : 500).json({
      error:
        error.code === "23505"
          ? "This URL slug is already in use"
          : error.message,
    });
  }
  res
    .status(201)
    .json({ message: "Product added successfully", product: data });
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

  const numericCategoryId = Number(category_id);
  const { data, error } = await supabase
    .from("products")
    .update({
      category_id: numericCategoryId,
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
    .select()
    .maybeSingle();

  if (error)
    return res.status(error.code === "23505" ? 409 : 500).json({
      error:
        error.code === "23505"
          ? "This URL slug is already in use"
          : error.message,
    });
  if (!data) return res.status(404).json({ error: "Product not found" });

  res
    .status(200)
    .json({ message: "Product updated successfully", product: data });
};

// Delete a Product
exports.deleteProduct = async (req, res) => {
  const { product_id } = req.params;

  const { data, error } = await supabase
    .from("products")
    .delete()
    .eq("id", product_id)
    .select("id")
    .single();

  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: "Product not found" });

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
  res.status(200).json({ message: `Order marked as ${status}`, order });
};
