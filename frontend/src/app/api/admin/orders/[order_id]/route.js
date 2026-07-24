import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  getAuthenticatedUser,
  getUserRole,
} from "../../../../../lib/auth-route-utils";
import { createSupabaseAdminClient } from "../../../../../lib/supabase-server";

export async function PUT(request, { params }) {
  const body = await request.json().catch(() => ({}));
  const resolvedParams = await params;
  const cookieStore = await cookies();
  const supabase = createSupabaseAdminClient();
  const { user } = await getAuthenticatedUser(supabase, cookieStore);

  if (!user || getUserRole(user) !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { status } = body;
  const validStatuses = [
    "pending",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
  ];
  if (!validStatuses.includes(status)) {
    return NextResponse.json(
      { error: "Invalid status update" },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", resolvedParams.order_id)
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const order = Array.isArray(data) ? data[0] : data;
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json({ message: "Order status updated", order });
}
