const supabase = require("../config/supabase");

// Add a New Product
exports.addProduct = async (req, res) => {
  const { category_id, name, description, price, stock, is_featured } =
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
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(200).json({ message: `Order marked as ${status}`, order: data });
};
