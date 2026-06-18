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
const adminRoutes = require("./routes/adminRoutes");

const app = express();

// Middleware
app.use(
  cors({
    origin: ["http://localhost:3000"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  }),
);
app.use(express.json()); // Parses incoming JSON requests
app.use("/api/products", productRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/users", userRoutes);
app.use("/api/wishlists", wishlistRoutes);
app.use("/api/admin", adminRoutes);

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
