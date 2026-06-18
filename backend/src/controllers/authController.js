const supabase = require("../config/supabase");

// User signup
exports.signup = async (req, res) => {
  const { email, password, full_name, phone } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
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

  if (error) return res.status(400).json({ error: error.message });

  res.status(201).json({
    message: "Signup successful!",
    user: data.user,
  });
};

// User login
exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) return res.status(401).json({ error: error.message });

  res.status(200).json({
    message: "Login successful!",
    session: data.session,
  });
};
