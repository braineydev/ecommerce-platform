const supabase = require("../config/supabase");

const PRODUCT_SELECT = "*, categories(id, name, slug)";

const normalizeImageValues = value => {
  if (Array.isArray(value)) {
    return value.filter(image => typeof image === "string" && image.trim());
  }

  if (typeof value === "string") {
    const trimmedValue = value.trim();
    if (!trimmedValue) return [];

    try {
      const parsedValue = JSON.parse(trimmedValue);
      if (Array.isArray(parsedValue)) {
        return parsedValue.filter(
          image => typeof image === "string" && image.trim(),
        );
      }
      if (typeof parsedValue === "string" && parsedValue.trim()) {
        return [parsedValue.trim()];
      }
    } catch {
      return [trimmedValue];
    }
  }

  return [];
};

const normalizeProduct = product => {
  if (!product) return product;

  const categoryCandidate = product.categories || product.category || null;
  const category = Array.isArray(categoryCandidate)
    ? categoryCandidate[0]
    : categoryCandidate;
  const stock = Number(product.stock || 0);

  const discountedPrice = Number(
    product.discounted_price ?? product.price ?? 0,
  );
  const initialPrice = Number(product.initial_price ?? discountedPrice);

  const uploadedImages = normalizeImageValues(product.images);
  const imageName =
    typeof product.image_name === "string" && product.image_name.trim()
      ? product.image_name.trim()
      : null;
  const images =
    uploadedImages.length > 0 ? uploadedImages : imageName ? [imageName] : [];

  return {
    ...product,
    price: discountedPrice,
    initial_price: initialPrice,
    discounted_price: discountedPrice,
    stock,
    // `image_name` was used before `images` became the storefront field.
    // Preserve it as a fallback so older products keep their uploaded image.
    images,
    image_name: imageName || images[0] || null,
    categories: category,
    category,
    category_id: category?.id ?? product.category_id ?? null,
    category_name: category?.name ?? product.category_name ?? "",
    availability_status: stock > 0 ? "in_stock" : "out_of_stock",
  };
};

// Get all categories
exports.getCategories = async (req, res) => {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name");

  if (error) return res.status(500).json({ error: error.message });

  // These IDs are foreign keys. Never substitute display-only, hard-coded IDs
  // here: doing so makes the admin form submit category IDs that do not exist.
  res.status(200).json({ data });
};

// Get products with optional search, category, and featured filters
exports.getProducts = async (req, res) => {
  const { search, category, featured, brand, min_price, max_price } = req.query;
  const page = Number(req.query.page || 1);
  const pageSize = Number(req.query.limit || 24);

  if (
    !Number.isInteger(page) ||
    page < 1 ||
    !Number.isInteger(pageSize) ||
    pageSize < 1 ||
    pageSize > 100
  ) {
    return res.status(400).json({ error: "Invalid pagination values" });
  }
  if (
    typeof search === "string" &&
    (search.length > 100 || !/^[\p{L}\p{N}\s-]*$/u.test(search))
  ) {
    return res
      .status(400)
      .json({ error: "Search contains unsupported characters" });
  }
  if (typeof brand === "string" && brand.length > 80) {
    return res.status(400).json({ error: "Brand filter is too long" });
  }

  let query = supabase.from("products").select(PRODUCT_SELECT);

  if (featured === "true") {
    query = query.eq("is_featured", true);
  }

  if (category) {
    query = query.eq("category_id", category);
  }

  if (brand) query = query.ilike("brand", `%${brand}%`);
  if (min_price !== undefined && Number.isFinite(Number(min_price)))
    query = query.gte("price", Number(min_price));
  if (max_price !== undefined && Number.isFinite(Number(max_price)))
    query = query.lte("price", Number(max_price));

  if (search) {
    const searchTerm = String(search).trim();
    if (searchTerm) {
      query = query.or(
        `name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,brand.ilike.%${searchTerm}%,slug.ilike.%${searchTerm}%`,
      );
    }
  }

  const { data, error } = await query
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (error) return res.status(500).json({ error: error.message });
  res
    .status(200)
    .json({ data: data.map(normalizeProduct), page, limit: pageSize });
};

// Get a single product by ID
exports.getProductById = async (req, res) => {
  const { id } = req.params;
  const normalizedId = String(id || "").trim();
  const isUuid = /^[0-9a-fA-F-]{36}$/.test(normalizedId);
  const isNumericId =
    Number.isFinite(Number(normalizedId)) &&
    String(Number(normalizedId)) === normalizedId;

  const query = supabase.from("products").select(PRODUCT_SELECT);
  const request =
    isUuid || isNumericId
      ? query.or(`slug.eq.${normalizedId},id.eq.${normalizedId}`).single()
      : query.eq("slug", normalizedId).single();

  const { data, error } = await request;

  if (error) {
    if (error.code === "PGRST116") {
      return res.status(404).json({ error: "Product not found" });
    }

    return res.status(500).json({ error: error.message });
  }

  if (!data) {
    return res.status(404).json({ error: "Product not found" });
  }

  res.status(200).json({ product: normalizeProduct(data) });
};
