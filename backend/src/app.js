require("dotenv").config();
const express = require("express");
const cors = require("cors");
const supabase = require("./config/supabase");
const productRoutes = require("./routes/productRoutes");
const authRoutes = require("./routes/authRoutes");
const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const userRoutes = require("./routes/userRoutes");
const wishlistRoutes = require("./routes/wishlistRoutes");
const customerRoutes = require("./routes/customerRoutes");
const adminRoutes = require("./routes/adminRoutes");
const {
  getAllowedOrigins,
  requireTrustedOrigin,
  setSecurityHeaders,
} = require("./middleware/securityMiddleware");

const app = express();

// Middleware
const allowedOrigins = getAllowedOrigins();

app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(setSecurityHeaders);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser requests; state-changing browser requests are checked
      // separately by requireTrustedOrigin.
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) return callback(null, true);

      return callback(
        new Error("CORS policy does not allow this origin."),
        false,
      );
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  }),
);
app.use(express.json({ limit: "100kb" }));
app.use(requireTrustedOrigin);
app.use("/api/products", productRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/users", userRoutes);
app.use("/api/wishlists", wishlistRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/admin", adminRoutes);

app.use((error, req, res, next) => {
  if (error) {
    const status = error.name === "MulterError" || error.message === "Only JPEG, PNG, and WebP images are allowed" ? 400 : 500;
    return res.status(status).json({ error: status === 400 ? error.message : "Unexpected server error" });
  }
  next();
});

// Health Check Endpoint
app.get("/api/health", async (req, res) => {
  // Quick ping to Supabase to verify connection
  const { data, error } = await supabase.from("profiles").select("id").limit(1);

  if (error) {
    // Accept table doesn't exist errors (42P01) or schema cache misses as valid connections
    const tableNotFoundErrors = ["42P01", "PGRST116"];
    const errorMessage = error.message || "";
    const isTableNotFound =
      tableNotFoundErrors.includes(error.code) ||
      errorMessage.includes("table") ||
      errorMessage.includes("schema cache");

    if (!isTableNotFound) {
      return res
        .status(500)
        .json({ status: "Error connecting to Supabase", error: error.message });
    }
  }

  res.status(200).json({
    status: "Success",
    message: "Backend is running and connected to Supabase!",
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
