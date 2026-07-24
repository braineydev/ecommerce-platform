const SESSION_COOKIE = "shark_session";
const isProduction = process.env.NODE_ENV === "production";

export function normalizeEmail(email) {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}

export function normalizePhone(phone) {
  return typeof phone === "string" ? phone.trim().replace(/[\s()-]/g, "") : "";
}

export function isValidPhone(phone) {
  return /^\+[1-9]\d{7,14}$/.test(phone);
}

export function isStrongPassword(password) {
  return (
    typeof password === "string" &&
    password.length >= 12 &&
    password.length <= 128 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}

export function setSessionCookie(response, session) {
  if (!session?.access_token) return response;

  const now = Math.floor(Date.now() / 1000);
  const requestedExpiry = Number(session.expires_at);
  const expiresAt = Number.isFinite(requestedExpiry)
    ? Math.min(requestedExpiry, now + 24 * 60 * 60)
    : now + 60 * 60;
  const maxAge = Math.max(0, expiresAt - now) * 1000;

  response.cookies.set(SESSION_COOKIE, session.access_token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge,
    path: "/",
  });

  return response;
}

export function clearSessionCookie(response) {
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}

export async function buildAuthenticatedUser(supabase, authUser) {
  if (!authUser) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, phone, role")
    .eq("id", authUser.id)
    .maybeSingle();

  return {
    ...authUser,
    name:
      profile?.full_name || authUser.user_metadata?.full_name || authUser.email,
    full_name: profile?.full_name || authUser.user_metadata?.full_name || "",
    phone: profile?.phone || authUser.user_metadata?.phone || "",
    role: profile?.role || authUser.user_metadata?.role || "customer",
  };
}

export function getUserRole(user) {
  return (
    user?.role ||
    user?.app_metadata?.role ||
    user?.user_metadata?.role ||
    "customer"
  );
}

export async function getAuthenticatedUser(supabase, cookieStore) {
  const token = cookieStore.get("shark_session")?.value;
  if (!token) return { user: null, token: null };

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);
  if (error || !user) return { user: null, token: null };

  const authUser = await buildAuthenticatedUser(supabase, user);
  return { user: authUser, token };
}

export { SESSION_COOKIE };
