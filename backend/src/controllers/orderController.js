const supabase = require("../config/supabase");

exports.createOrder = async (req, res) => {
  const userId = req.user.id;
  const { delivery_zone_id, shipping_address } = req.body;

  if (!delivery_zone_id || !shipping_address) {
    return res
      .status(400)
      .json({ error: "Delivery zone and shipping address are required" });
  }

  const { data: cartItems, error: cartError } = await supabase
    .from("cart_items")
    .select("quantity, product_id, products(price)")
    .eq("profile_id", userId);

  if (cartError || !cartItems || cartItems.length === 0) {
    return res
      .status(400)
      .json({ error: "Cart is empty or could not be fetched" });
  }

  const { data: zone, error: zoneError } = await supabase
    .from("delivery_zones")
    .select("delivery_fee")
    .eq("id", delivery_zone_id)
    .single();

  if (zoneError || !zone) {
    return res.status(400).json({ error: "Invalid delivery zone ID" });
  }

  let totalAmount = Number(zone.delivery_fee);
  const orderItemsData = [];

  for (const item of cartItems) {
    const price = Number(item.products.price);
    totalAmount += price * item.quantity;

    orderItemsData.push({
      product_id: item.product_id,
      quantity: item.quantity,
      price_at_purchase: price,
    });
  }

  const { data: newOrder, error: orderError } = await supabase
    .from("orders")
    .insert([
      {
        profile_id: userId,
        delivery_zone_id,
        shipping_address,
        total_amount: totalAmount,
        status: "pending",
      },
    ])
    .select()
    .single();

  if (orderError) return res.status(500).json({ error: orderError.message });

  const itemsToInsert = orderItemsData.map((item) => ({
    order_id: newOrder.id,
    ...item,
  }));

  const { error: orderItemsError } = await supabase
    .from("order_items")
    .insert(itemsToInsert);

  if (orderItemsError) {
    return res.status(500).json({ error: orderItemsError.message });
  }

  const { error: clearCartError } = await supabase
    .from("cart_items")
    .delete()
    .eq("profile_id", userId);

  if (clearCartError) {
    return res.status(500).json({ error: clearCartError.message });
  }

  res.status(201).json({
    message: "Order created successfully!",
    order: newOrder,
  });
};
