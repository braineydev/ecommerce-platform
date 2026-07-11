const supabase = require("../config/supabase");

// Add a New Product
exports.addProduct = async (req, res) => {
  const { category_id, name, description, price, stock, images, is_featured } =
    req.body;

  if (!category_id || !name || !price) {
    return res
      .status(400)
      .json({ error: "Category, name, and price are required" });
  }

  const { data, error } = await supabase
    .from("products")
    .insert([
      {
        category_id,
        name,
        description,
        price,
        stock: stock || 0,
        images: Array.isArray(images) ? images : [],
        is_featured: is_featured || false,
      },
    ])
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res
    .status(201)
    .json({ message: "Product added successfully", product: data });
};

// Update an Existing Product
exports.updateProduct = async (req, res) => {
  const { product_id } = req.params;
  const { category_id, name, description, price, stock, images, is_featured } =
    req.body;

  if (!category_id || !name || !price) {
    return res
      .status(400)
      .json({ error: "Category, name, and price are required" });
  }

  const { data, error } = await supabase
    .from("products")
    .update({
      category_id,
      name,
      description,
      price,
      stock: stock || 0,
      images: Array.isArray(images) ? images : [],
      is_featured: is_featured || false,
    })
    .eq("id", product_id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
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
