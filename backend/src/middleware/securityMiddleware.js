const TRUSTED_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

const getAllowedOrigins = () =>
  (process.env.FRONTEND_ORIGINS || "http://localhost:3000")
    .split(",")
    .map(origin => origin.trim())
    .filter(Boolean);

const setSecurityHeaders = (req, res, next) => {
  res.set({
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Cache-Control": "no-store",
  });
  next();
};

// Cookie-authenticated write requests must originate from the configured UI.
// This prevents another site from causing actions with a user's session cookie.
const requireTrustedOrigin = (req, res, next) => {
  if (TRUSTED_METHODS.has(req.method)) return next();

  const origin = req.get("origin");
  if (!origin || !getAllowedOrigins().includes(origin)) {
    return res.status(403).json({ error: "Untrusted request origin" });
  }
  next();
};

const createRateLimiter = ({ windowMs, max, message }) => {
  const requests = new Map();

  return (req, res, next) => {
    const now = Date.now();
    const key = `${req.ip}:${req.path}`;
    const entry = requests.get(key);
    const recent = entry && now - entry.startedAt < windowMs
      ? entry
      : { startedAt: now, count: 0 };

    recent.count += 1;
    requests.set(key, recent);
    if (recent.count > max) {
      res.set("Retry-After", String(Math.ceil((windowMs - (now - recent.startedAt)) / 1000)));
      return res.status(429).json({ error: message });
    }
    next();
  };
};

module.exports = {
  createRateLimiter,
  getAllowedOrigins,
  requireTrustedOrigin,
  setSecurityHeaders,
};
