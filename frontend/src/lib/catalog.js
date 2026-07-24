import { createClient } from "@supabase/supabase-js";

const PRODUCT_SELECT = "*, categories(id, name, slug)";

export function createSupabaseAdminClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export function normalizeProduct(product) {
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

  const uploadedImages = Array.isArray(product.images)
    ? product.images.filter(image => typeof image === "string" && image.trim())
    : [];
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
    images,
    image_name: imageName || images[0] || null,
    categories: category,
    category,
    category_id: category?.id ?? product.category_id ?? null,
    category_name: category?.name ?? product.category_name ?? "",
    availability_status: stock > 0 ? "in_stock" : "out_of_stock",
  };
}

export async function getProductsFromSupabase({
  search,
  category,
  featured,
  brand,
  min_price,
  max_price,
  page = 1,
  limit = 24,
} = {}) {
  const supabase = createSupabaseAdminClient();
  const normalizedPage =
    Number.isInteger(Number(page)) && Number(page) > 0 ? Number(page) : 1;
  const normalizedLimit =
    Number.isInteger(Number(limit)) && Number(limit) > 0 ? Number(limit) : 24;

  let query = supabase.from("products").select(PRODUCT_SELECT);

  if (featured === "true") {
    query = query.eq("is_featured", true);
  }

  if (category) {
    query = query.eq("category_id", category);
  }

  if (brand) query = query.ilike("brand", `%${brand}%`);
  if (min_price !== undefined && Number.isFinite(Number(min_price))) {
    query = query.gte("price", Number(min_price));
  }
  if (max_price !== undefined && Number.isFinite(Number(max_price))) {
    query = query.lte("price", Number(max_price));
  }

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
    .range(
      (normalizedPage - 1) * normalizedLimit,
      normalizedPage * normalizedLimit - 1,
    );

  if (error) throw error;

  return {
    data: data.map(normalizeProduct),
    page: normalizedPage,
    limit: normalizedLimit,
  };
}

export async function getProductByIdFromSupabase(id) {
  const supabase = createSupabaseAdminClient();
  const normalizedId = String(id || "").trim();
  const isUuid = /^[0-9a-fA-F-]{8,}$/.test(normalizedId);
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
    if (error.code === "PGRST116") return null;
    throw error;
  }

  return data ? normalizeProduct(data) : null;
}

export async function getCategoriesFromSupabase() {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name");
  if (error) throw error;
  return data;
}
