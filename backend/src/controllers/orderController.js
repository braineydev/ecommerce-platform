const supabase = require("../config/supabase");

exports.createOrder = async (req, res) => {
  const userId = req.user.id;
  const { delivery_zone_id, items = [] } = req.body;
  const shipping_address =
    req.body.shipping_address || req.body.shippingAddress;

  if (typeof shipping_address !== "string" || !shipping_address.trim() || shipping_address.trim().length > 500) {
    return res.status(400).json({ error: "Shipping address is required" });
  }

  let deliveryZoneId = delivery_zone_id;
  let deliveryFee = 0;

  if (deliveryZoneId) {
    const { data: zone, error: zoneError } = await supabase
      .from("delivery_zones")
      .select("delivery_fee")
      .eq("id", deliveryZoneId)
      .single();

    if (zoneError || !zone) {
      return res.status(400).json({ error: "Invalid delivery zone ID" });
    }

    deliveryFee = Number(zone.delivery_fee);
  } else {
    const { data: zone } = await supabase
      .from("delivery_zones")
      .select("id, delivery_fee")
      .limit(1)
      .maybeSingle();

    if (zone) {
      deliveryZoneId = zone.id;
      deliveryFee = Number(zone.delivery_fee);
    }
  }

  let cartItems = [];

  if (Array.isArray(items) && items.length > 0) {
    const productIds = items
      .map(item => item.id || item.product_id)
      .filter(Boolean);

    if (productIds.length === 0 || new Set(productIds).size !== productIds.length) {
      return res
        .status(400)
        .json({ error: "Cart items must contain unique product IDs" });
    }

    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, price, stock")
      .in("id", productIds);

    if (productsError)
      return res.status(500).json({ error: productsError.message });

    const productsById = new Map(
      products.map(product => [product.id, product]),
    );

    cartItems = items
      .map(item => {
        const productId = item.id || item.product_id;
        const product = productsById.get(productId);

        if (!product) return null;

        const quantity = Number(item.quantity);
        if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100 || quantity > Number(product.stock)) return null;
        return {
          product_id: productId,
          quantity,
          products: { price: product.price, stock: product.stock },
        };
      })
      .filter(Boolean);
  } else {
    const { data, error: cartError } = await supabase
      .from("cart_items")
      .select("quantity, product_id, products(price, stock)")
      .eq("profile_id", userId);

    if (cartError) return res.status(500).json({ error: cartError.message });
    cartItems = data || [];
  }

  if (cartItems.length === 0) {
    return res
      .status(400)
      .json({ error: "Cart is empty or could not be fetched" });
  }

  for (const item of cartItems) {
    if (Number(item.quantity) > Number(item.products?.stock ?? 0)) {
      return res.status(409).json({ error: "One or more products are no longer available in the requested quantity" });
    }
  }

  let calculatedTotal = deliveryFee;
  const orderItemsData = [];

  for (const item of cartItems) {
    const price = Number(item.products.price);
    calculatedTotal += price * item.quantity;

    orderItemsData.push({
      product_id: item.product_id,
      quantity: item.quantity,
      price_at_purchase: price,
    });
  }

  const orderInsert = {
    profile_id: userId,
    shipping_address: shipping_address.trim(),
    total_amount: calculatedTotal,
    status: "pending",
  };

  if (deliveryZoneId) {
    orderInsert.delivery_zone_id = deliveryZoneId;
  }

  const { data: newOrder, error: orderError } = await supabase
    .from("orders")
    .insert([orderInsert])
    .select()
    .single();

  if (orderError) return res.status(500).json({ error: orderError.message });

  const itemsToInsert = orderItemsData.map(item => ({
    order_id: newOrder.id,
    ...item,
  }));

  const { error: orderItemsError } = await supabase
    .from("order_items")
    .insert(itemsToInsert);

  if (orderItemsError) {
    return res.status(500).json({ error: orderItemsError.message });
  }

  // The database function locks product rows and prevents simultaneous checkouts
  // from taking stock below zero.
  const { error: stockError } = await supabase.rpc("decrement_stock", {
    items: orderItemsData.map(item => ({ id: item.product_id, quantity: item.quantity })),
  });
  if (stockError) {
    await supabase.from("order_items").delete().eq("order_id", newOrder.id);
    await supabase.from("orders").delete().eq("id", newOrder.id);
    return res.status(409).json({ error: "Stock changed before the order could be placed. Please review your cart." });
  }

  if (!Array.isArray(items) || items.length === 0) {
    const { error: clearCartError } = await supabase
      .from("cart_items")
      .delete()
      .eq("profile_id", userId);

    if (clearCartError) {
      return res.status(500).json({ error: clearCartError.message });
    }
  }

  res.status(201).json({
    message: "Order created successfully!",
    order: newOrder,
  });
};

exports.getMyOrders = async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: orders, error } = await supabase
      .from("orders")
      .select(
        `
          id, total_amount, status, shipping_address, created_at,
          order_items (quantity, price_at_purchase, products (name, images))
        `,
      )
      .eq("profile_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.status(200).json({ orders });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Retained for backwards compatibility. All checkout requests must use the
// secure implementation above, which derives the customer and totals server-side.
exports.checkout = exports.createOrder;
