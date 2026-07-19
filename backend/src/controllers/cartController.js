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
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
    return res.status(400).json({ error: "Quantity must be a whole number between 1 and 100" });
  }

  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id, stock")
    .eq("id", product_id)
    .maybeSingle();

  if (productError) return res.status(500).json({ error: "Unable to validate product availability" });
  if (!product || Number(product.stock) < 1) {
    return res.status(400).json({ error: "This product is currently unavailable" });
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
    const newQuantity = Number(existingItem.quantity) + quantity;
    if (newQuantity > 100 || newQuantity > Number(product.stock)) {
      return res.status(400).json({ error: "Requested quantity is not available" });
    }
    result = await supabase
      .from("cart_items")
      .update({ quantity: newQuantity })
      .eq("id", existingItem.id)
      .select();
  } else {
    if (quantity > Number(product.stock)) {
      return res.status(400).json({ error: "Requested quantity is not available" });
    }
    result = await supabase
      .from("cart_items")
      .insert([{ profile_id: userId, product_id, quantity }])
      .select();
  }

  if (result.error) return res.status(500).json({ error: result.error.message });
  res.status(200).json({ message: "Added to cart", data: result.data });
};
