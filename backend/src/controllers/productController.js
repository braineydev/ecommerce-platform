const supabase = require("../config/supabase");

const PRODUCT_SELECT = "*, categories(name, slug)";

const normalizeProduct = product => {
  if (!product) return product;

  const category = product.categories || product.category || null;
  const stock = Number(product.stock || 0);

  const discountedPrice = Number(
    product.discounted_price ?? product.price ?? 0,
  );
  const initialPrice = Number(product.initial_price ?? discountedPrice);

  return {
    ...product,
    price: discountedPrice,
    initial_price: initialPrice,
    discounted_price: discountedPrice,
    stock,
    images: Array.isArray(product.images) ? product.images.filter(Boolean) : [],
    categories: category,
    category,
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
  res.status(200).json({ data });
};

// Get products with optional search, category, and featured filters
exports.getProducts = async (req, res) => {
  const { search, category, featured, brand, min_price, max_price } = req.query;

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

  const { data, error } = await query.order("created_at", {
    ascending: false,
  });

  if (error) return res.status(500).json({ error: error.message });
  res.status(200).json({ data: data.map(normalizeProduct) });
};

// Get a single product by ID
exports.getProductById = async (req, res) => {
  const { id } = req.params;

  // Prefer the public SEO slug while retaining ID URLs for existing bookmarks.
  let { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("slug", id)
    .single();

  if (error?.code === "PGRST116") {
    ({ data, error } = await supabase
      .from("products")
      .select(PRODUCT_SELECT)
      .eq("id", id)
      .single());
  }

  if (error) {
    if (error.code === "PGRST116") {
      return res.status(404).json({ error: "Product not found" });
    }

    return res.status(500).json({ error: error.message });
  }

  res.status(200).json({ product: normalizeProduct(data) });
};
