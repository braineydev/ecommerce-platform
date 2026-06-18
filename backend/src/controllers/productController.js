const supabase = require("../config/supabase");

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
  const { search, category, featured } = req.query;

  let query = supabase.from("products").select("*, categories(name, slug)");

  if (featured === "true") {
    query = query.eq("is_featured", true);
  }

  if (category) {
    query = query.eq("category_id", category);
  }

  if (search) {
    query = query.ilike("name", `%${search}%`);
  }

  const { data, error } = await query.order("created_at", {
    ascending: false,
  });

  if (error) return res.status(500).json({ error: error.message });
  res.status(200).json({ data });
};
