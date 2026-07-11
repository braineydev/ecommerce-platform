const supabase = require("../config/supabase");

const getCookie = (req, name) => {
  const cookies = req.headers.cookie || "";
  const prefix = `${name}=`;
  const value = cookies.split(";").map(cookie => cookie.trim()).find(cookie => cookie.startsWith(prefix));
  return value ? decodeURIComponent(value.slice(prefix.length)) : null;
};

const requireAuth = async (req, res, next) => {
  const token = getCookie(req, "shark_session");
  if (!token) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return res.status(401).json({ error: "Unauthorized: Invalid token" });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
};

module.exports = requireAuth;
