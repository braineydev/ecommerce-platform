const supabase = require("../config/supabase");

exports.getDashboardStats = async (req, res) => {
  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select("status, total_amount");

  if (ordersError) return res.status(500).json({ error: ordersError.message });

  let totalRevenue = 0;
  let pendingCount = 0;
  let processingCount = 0;
  let shippedCount = 0;
  let deliveredCount = 0;

  orders.forEach(order => {
    if (order.status !== "cancelled") {
      totalRevenue += Number(order.total_amount);
    }

    if (order.status === "pending") pendingCount++;
    if (order.status === "processing") processingCount++;
    if (order.status === "shipped") shippedCount++;
    if (order.status === "delivered") deliveredCount++;
  });

  const { data: lowStock, error: stockError } = await supabase
    .from("products")
    .select("id, name, stock")
    .lt("stock", 15)
    .order("stock", { ascending: true });

  if (stockError) return res.status(500).json({ error: stockError.message });

  res.status(200).json({
    metrics: {
      totalRevenue,
      totalOrders: orders.length,
      pendingCount,
      processingCount,
      shippedCount,
      deliveredCount,
    },
    lowStockAlerts: lowStock,
  });
};
