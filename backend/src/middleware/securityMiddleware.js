const TRUSTED_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

const getAllowedOrigins = () =>
  (
    process.env.FRONTEND_ORIGINS ||
    process.env.FRONTEND_URL ||
    "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001"
  )
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
  // HSTS is meaningful only over HTTPS; sending it during local development can
  // make a browser refuse the local HTTP application.
  if (process.env.NODE_ENV === "production") {
    res.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  next();
};

// Cookie-authenticated write requests must originate from the configured UI.
// This prevents another site from causing actions with a user's session cookie.
const requireTrustedOrigin = (req, res, next) => {
  if (TRUSTED_METHODS.has(req.method)) return next();

  const origin = req.get("origin");
  if (!origin) {
    // Some proxy setups may forward requests without the original Origin header.
    // We already validate browser origins in CORS, so allow missing Origin here.
    return next();
  }

  if (!getAllowedOrigins().includes(origin)) {
    return res.status(403).json({ error: "Untrusted request origin" });
  }
  next();
};

const createRateLimiter = ({ windowMs, max, message }) => {
  const requests = new Map();

  return (req, res, next) => {
    const now = Date.now();
    // Keep this in-memory guard bounded during long-running processes so a
    // stream of unique addresses cannot grow the map indefinitely.
    if (requests.size > 5000) {
      for (const [existingKey, existingEntry] of requests) {
        if (now - existingEntry.startedAt >= windowMs)
          requests.delete(existingKey);
      }
    }
    const key = `${req.ip}:${req.baseUrl}${req.path}`;
    const entry = requests.get(key);
    const recent =
      entry && now - entry.startedAt < windowMs
        ? entry
        : { startedAt: now, count: 0 };

    recent.count += 1;
    requests.set(key, recent);
    if (recent.count > max) {
      res.set(
        "Retry-After",
        String(Math.ceil((windowMs - (now - recent.startedAt)) / 1000)),
      );
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
