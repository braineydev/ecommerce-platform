const supabase = require("../config/supabase");

exports.createOrder = async (req, res) => {
  const userId = req.user.id;
  const { delivery_zone_id, items = [] } = req.body;
  const shipping_address =
    req.body.shipping_address || req.body.shippingAddress;

  if (!shipping_address) {
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

    if (productIds.length === 0) {
      return res
        .status(400)
        .json({ error: "Cart items are missing product IDs" });
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
          products: { price: product.price },
        };
      })
      .filter(Boolean);
  } else {
    const { data, error: cartError } = await supabase
      .from("cart_items")
      .select("quantity, product_id, products(price)")
      .eq("profile_id", userId);

    if (cartError) return res.status(500).json({ error: cartError.message });
    cartItems = data || [];
  }

  if (cartItems.length === 0) {
    return res
      .status(400)
      .json({ error: "Cart is empty or could not be fetched" });
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
    shipping_address,
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

// Checkout with Stock Decrement
exports.checkout = async (req, res) => {
  try {
    const { cartItems, total, userId } = req.body;

    // Validate input
    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      return res.status(400).json({ error: "Cart items are required" });
    }

    if (total === undefined || total === null) {
      return res.status(400).json({ error: "Total amount is required" });
    }

    // Create the order
    const orderInsert = {
      profile_id: userId,
      total_amount: total,
      status: "pending",
      shipping_address: req.body.shippingAddress || "To be confirmed",
    };

    // Validate stock availability before creating the order to avoid overselling
    const productIds = cartItems.map(i => i.id);
    const { data: productsList, error: productsFetchError } = await supabase
      .from("products")
      .select("id, stock")
      .in("id", productIds);

    if (productsFetchError) {
      throw new Error(
        `Failed to fetch product stock: ${productsFetchError.message}`,
      );
    }

    const stockById = new Map((productsList || []).map(p => [p.id, p.stock]));

    for (const item of cartItems) {
      const available = Number(stockById.get(item.id) ?? 0);
      if (available < item.quantity) {
        return res.status(400).json({
          error: `Insufficient stock for product ${item.id}. Available: ${available}, requested: ${item.quantity}`,
        });
      }
    }

    const { data: newOrder, error: orderError } = await supabase
      .from("orders")
      .insert([orderInsert])
      .select()
      .single();

    if (orderError) {
      throw new Error(`Failed to create order: ${orderError.message}`);
    }

    // Insert order items
    const orderItemsData = cartItems.map(item => ({
      order_id: newOrder.id,
      product_id: item.id,
      quantity: item.quantity,
      price_at_purchase: item.price,
    }));

    const { error: orderItemsError } = await supabase
      .from("order_items")
      .insert(orderItemsData);

    if (orderItemsError) {
      throw new Error(`Failed to add order items: ${orderItemsError.message}`);
    }

    // Attempt atomic stock decrement via Postgres RPC
    try {
      const { error: rpcError } = await supabase.rpc("decrement_stock", {
        items: cartItems,
      });

      if (rpcError) {
        // Roll back order_items and order if RPC failed
        console.error("decrement_stock RPC failed:", rpcError.message);
        await supabase.from("order_items").delete().eq("order_id", newOrder.id);
        await supabase.from("orders").delete().eq("id", newOrder.id);
        return res.status(400).json({ error: rpcError.message });
      }
    } catch (error) {
      console.error("Error calling decrement_stock RPC:", error);
      // Attempt rollback
      await supabase.from("order_items").delete().eq("order_id", newOrder.id);
      await supabase.from("orders").delete().eq("id", newOrder.id);
      return res.status(500).json({ error: "Failed to decrement stock" });
    }

    // Clear user's cart if it exists
    if (userId) {
      await supabase.from("cart_items").delete().eq("profile_id", userId);
    }

    res.status(201).json({
      message: "Order placed successfully!",
      orderId: newOrder.id,
      order: newOrder,
    });
  } catch (error) {
    console.error("Checkout error:", error);
    res.status(500).json({
      error: error.message || "Checkout failed",
    });
  }
};
