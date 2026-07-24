import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  getAuthenticatedUser,
  getUserRole,
} from "../../../../lib/auth-route-utils";
import { createSupabaseAdminClient } from "../../../../lib/supabase-server";

export async function GET() {
  const cookieStore = await cookies();
  const supabase = createSupabaseAdminClient();
  const { user } = await getAuthenticatedUser(supabase, cookieStore);

  if (!user || getUserRole(user) !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select("status, total_amount");

  if (ordersError) {
    return NextResponse.json({ error: ordersError.message }, { status: 500 });
  }

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

  if (stockError) {
    return NextResponse.json({ error: stockError.message }, { status: 500 });
  }

  return NextResponse.json({
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
}
