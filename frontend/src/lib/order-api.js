export const orderSelect = `
  id, total_amount, status, shipping_address, created_at,
  order_items (quantity, price_at_purchase, products (name, images))
`;

/**
 * Builds trusted order lines from current product records. Never accept a
 * price or stock value supplied by the browser.
 */
export async function getOrderLines(supabase, userId, items) {
  if (!Array.isArray(items) || items.length === 0) {
    const { data, error } = await supabase
      .from("cart_items")
      .select("quantity, product_id, products(price, stock)")
      .eq("profile_id", userId);
    return { lines: data || [], error, usedCart: true };
  }

  const productIds = items.map(item => item?.id || item?.product_id).filter(Boolean);
  if (productIds.length === 0 || new Set(productIds).size !== productIds.length) {
    return { error: new Error("Cart items must contain unique product IDs") };
  }

  const { data: products, error } = await supabase
    .from("products")
    .select("id, price, stock")
    .in("id", productIds);
  if (error) return { error };

  const productsById = new Map((products || []).map(product => [product.id, product]));
  const lines = items.map(item => {
    const productId = item?.id || item?.product_id;
    const product = productsById.get(productId);
    const quantity = Number(item?.quantity);
    if (!product || !Number.isInteger(quantity) || quantity < 1 || quantity > 100 || quantity > Number(product.stock)) {
      return null;
    }
    return { product_id: productId, quantity, products: { price: product.price, stock: product.stock } };
  }).filter(Boolean);

  return { lines, usedCart: false };
}
