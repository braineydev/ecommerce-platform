import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "../../../lib/supabase-server";

export async function GET() {
  const { error } = await createSupabaseAdminClient()
    .from("profiles")
    .select("id")
    .limit(1);
  if (error && !["42P01", "PGRST116"].includes(error.code)) {
    return NextResponse.json({ status: "Error connecting to Supabase" }, { status: 500 });
  }
  return NextResponse.json({ status: "Success", message: "Next.js API is connected to Supabase" });
}
