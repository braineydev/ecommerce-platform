const supabase = require("../config/supabase");

// View cart
exports.getCart = async (req, res) => {
  const userId = req.user.id;

  const { data, error } = await supabase
    .from("cart_items")
    .select(
      `
        id,
        quantity,
        product_id,
        products (name, price, images, stock)
      `
    )
    .eq("profile_id", userId);

  if (error) return res.status(500).json({ error: error.message });
  res.status(200).json({ data });
};

// Add to cart
exports.addToCart = async (req, res) => {
  const userId = req.user.id;
  const { product_id, quantity = 1 } = req.body;

  if (!product_id) {
    return res.status(400).json({ error: "Product ID is required" });
  }

  const { data: existingItem, error: existingItemError } = await supabase
    .from("cart_items")
    .select("*")
    .eq("profile_id", userId)
    .eq("product_id", product_id)
    .maybeSingle();

  if (existingItemError) {
    return res.status(500).json({ error: existingItemError.message });
  }

  let result;
  if (existingItem) {
    result = await supabase
      .from("cart_items")
      .update({ quantity: existingItem.quantity + quantity })
      .eq("id", existingItem.id)
      .select();
  } else {
    result = await supabase
      .from("cart_items")
      .insert([{ profile_id: userId, product_id, quantity }])
      .select();
  }

  if (result.error) return res.status(500).json({ error: result.error.message });
  res.status(200).json({ message: "Added to cart", data: result.data });
};
