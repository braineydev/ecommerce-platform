const supabase = require("../config/supabase");

// Get user profile
exports.getProfile = async (req, res) => {
  const userId = req.user.id;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(200).json({ profile: data });
};

// Update user profile
exports.updateProfile = async (req, res) => {
  const userId = req.user.id;
  const { full_name, phone } = req.body;

  const { data, error } = await supabase
    .from("profiles")
    .update({ full_name, phone })
    .eq("id", userId)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  res.status(200).json({
    message: "Profile updated successfully",
    profile: data,
  });
};

// Get user's order history
exports.getMyOrders = async (req, res) => {
  const userId = req.user.id;

  const { data, error } = await supabase
    .from("orders")
    .select(
      `
        id, total_amount, status, shipping_address, created_at,
        order_items (
          quantity, price_at_purchase,
          products (name, images)
        )
      `
    )
    .eq("profile_id", userId)
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.status(200).json({ orders: data });
};
