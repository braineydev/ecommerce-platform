import { NextResponse } from "next/server";
import { clearSessionCookie } from "../../../../lib/auth-route-utils";

export async function POST() {
  const response = NextResponse.json(
    { message: "Logged out" },
    { status: 200 },
  );
  clearSessionCookie(response);
  return response;
}
