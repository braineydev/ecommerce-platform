import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { buildAuthenticatedUser } from "../../../../lib/auth-route-utils";
import { createSupabaseAdminClient } from "../../../../lib/supabase-server";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("shark_session")?.value;
  const supabase = createSupabaseAdminClient();

  if (!token) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);
  if (error || !user) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  return NextResponse.json({
    user: await buildAuthenticatedUser(supabase, user),
  });
}
