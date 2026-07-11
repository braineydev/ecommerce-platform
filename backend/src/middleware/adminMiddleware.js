const supabase = require("../config/supabase");

const requireAdmin = async (req, res, next) => {
  const userId = req.user?.id;
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (error || !profile) {
    return res.status(500).json({ error: "Error verifying admin status" });
  }

  if (profile.role !== "admin") {
    return res
      .status(403)
      .json({ error: "Forbidden: Admin access strictly required" });
  }

  next();
};

module.exports = requireAdmin;
