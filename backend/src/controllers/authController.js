const supabase = require("../config/supabase");

const SESSION_COOKIE = "shark_session";
const isProduction = process.env.NODE_ENV === "production";

const normalizeEmail = email =>
  typeof email === "string" ? email.trim().toLowerCase() : "";
const normalizePhone = phone => (typeof phone === "string" ? phone.trim().replace(/[\s()-]/g, "") : "");
const isValidPhone = phone => /^\+[1-9]\d{7,14}$/.test(phone);

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

  if (!email && !phone) {
    return res.status(400).json({ error: "Enter an email address or phone number" });
  }
  if (!email) return res.status(400).json({ error: "Use phone verification to create a phone-only account" });
  if (!password) return res.status(400).json({ error: "Password is required for email registration" });
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

exports.requestPhoneOtp = async (req, res) => {
  const phone = normalizePhone(req.body.phone);
  const full_name = typeof req.body.full_name === "string" ? req.body.full_name.trim().slice(0, 100) : "";
  if (!isValidPhone(phone)) return res.status(400).json({ error: "Enter a valid phone number in international format, e.g. +2547..." });

  const { error } = await supabase.auth.signInWithOtp({
    phone,
    options: { shouldCreateUser: true, data: { full_name, phone } },
  });
  if (error) return res.status(400).json({ error: "Unable to send verification code" });
  return res.status(200).json({ message: "Verification code sent" });
};

exports.verifyPhoneOtp = async (req, res) => {
  const phone = normalizePhone(req.body.phone);
  const token = typeof req.body.token === "string" ? req.body.token.trim() : "";
  if (!isValidPhone(phone) || !/^\d{6}$/.test(token)) return res.status(400).json({ error: "Enter the phone number and six-digit code" });

  const { data, error } = await supabase.auth.verifyOtp({ phone, token, type: "sms" });
  if (error || !data.session) return res.status(400).json({ error: "The verification code is invalid or expired" });
  const user = await buildAuthenticatedUser(data.user);
  setSessionCookie(res, data.session);
  return res.status(200).json({ message: "Phone verified", user });
};

exports.startGoogleSignIn = async (req, res) => {
  const redirectTo = process.env.AUTH_CALLBACK_URL || `${process.env.FRONTEND_URL || "http://localhost:3000"}/auth/callback`;
  const { data, error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo } });
  if (error || !data?.url) return res.status(400).json({ error: "Google sign-in is not configured" });
  return res.status(200).json({ url: data.url });
};

exports.createSessionFromToken = async (req, res) => {
  const token = typeof req.body.access_token === "string" ? req.body.access_token : "";
  if (!token) return res.status(400).json({ error: "Missing access token" });
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return res.status(401).json({ error: "Invalid sign-in session" });
  setSessionCookie(res, { access_token: token, expires_at: req.body.expires_at });
  return res.status(200).json({ user: await buildAuthenticatedUser(data.user) });
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
