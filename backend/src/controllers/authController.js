const supabase = require("../config/supabase");

const SESSION_COOKIE = "shark_session";
const isProduction = process.env.NODE_ENV === "production";

const normalizeEmail = email =>
  typeof email === "string" ? email.trim().toLowerCase() : "";

const isStrongPassword = password =>
  typeof password === "string" &&
  password.length >= 12 &&
  password.length <= 128 &&
  /[a-z]/.test(password) &&
  /[A-Z]/.test(password) &&
  /\d/.test(password) &&
  /[^A-Za-z0-9]/.test(password);

const setSessionCookie = (res, session) => {
  if (!session?.access_token) return;
  const maxAge = Math.max(0, (session.expires_at || Math.floor(Date.now() / 1000) + 3600) - Math.floor(Date.now() / 1000)) * 1000;
  res.cookie(SESSION_COOKIE, session.access_token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict",
    maxAge,
    path: "/",
  });
};

const clearSessionCookie = res =>
  res.clearCookie(SESSION_COOKIE, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict",
    path: "/",
  });

const buildAuthenticatedUser = async authUser => {
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
};

// User signup
exports.signup = async (req, res) => {
  const { password } = req.body;
  const email = normalizeEmail(req.body.email);
  const full_name = typeof req.body.full_name === "string" ? req.body.full_name.trim().slice(0, 100) : "";
  const phone = typeof req.body.phone === "string" ? req.body.phone.trim().slice(0, 30) : "";

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ error: "Enter a valid email address" });
  if (!isStrongPassword(password)) {
    return res.status(400).json({ error: "Use 12+ characters with uppercase, lowercase, number, and symbol" });
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: full_name || "",
        phone: phone || "",
      },
    },
  });

  if (error) return res.status(400).json({ error: "Unable to create account" });

  const user = await buildAuthenticatedUser(data.user);
  setSessionCookie(res, data.session);

  res.status(201).json({
    message: "Signup successful!",
    user,
    requiresEmailConfirmation: !data.session,
  });
};

// User login
exports.login = async (req, res) => {
  const { password } = req.body;
  const email = normalizeEmail(req.body.email);

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const user = await buildAuthenticatedUser(data.user);
    setSessionCookie(res, data.session);

    return res.status(200).json({
      message: "Login successful!",
      user,
    });
  } catch (err) {
    console.error("Authentication service error");
    return res
      .status(500)
      .json({ error: "Authentication service unavailable" });
  }
};

exports.me = async (req, res) => {
  const user = await buildAuthenticatedUser(req.user);
  res.status(200).json({ user });
};

exports.logout = (req, res) => {
  clearSessionCookie(res);
  res.status(204).end();
};
