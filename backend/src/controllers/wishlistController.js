const supabase = require("../config/supabase");

// Get User's Wishlist
exports.getWishlist = async (req, res) => {
  const userId = req.user.id;

  const { data, error } = await supabase
    .from("wishlists")
    .select(
      `
            id,
            product_id,
            created_at,
            products (name, price, images, stock)
        `,
    )
    .eq("profile_id", userId)
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.status(200).json({ wishlist: data });
};

// Add to Wishlist
exports.addToWishlist = async (req, res) => {
  const userId = req.user.id;
  const { product_id } = req.body;

  if (!product_id)
    return res.status(400).json({ error: "Product ID is required" });

  // 1. Check if the item is already in the wishlist to prevent duplicates
  const { data: existingItem } = await supabase
    .from("wishlists")
    .select("id")
    .eq("profile_id", userId)
    .eq("product_id", product_id)
    .single();

  if (existingItem) {
    return res
      .status(400)
      .json({ message: "Item is already in your wishlist" });
  }

  // 2. Insert into wishlist
  const { data, error } = await supabase
    .from("wishlists")
    .insert([{ profile_id: userId, product_id }])
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ message: "Added to wishlist", item: data });
};

// Remove from Wishlist
exports.removeFromWishlist = async (req, res) => {
  const userId = req.user.id;
  const { product_id } = req.params; // We will pass this in the URL, not the body

  const { error } = await supabase
    .from("wishlists")
    .delete()
    .eq("profile_id", userId)
    .eq("product_id", product_id);

  if (error) return res.status(500).json({ error: error.message });
  res.status(200).json({ message: "Removed from wishlist" });
};
