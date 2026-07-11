const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const uploadController = require("../controllers/uploadController");
const analyticsController = require("../controllers/analyticsController");
const requireAuth = require("../middleware/authMiddleware");
const requireAdmin = require("../middleware/adminMiddleware");

router.use(requireAuth, requireAdmin);

router.get("/me", (req, res) => {
  res.status(200).json({
    user: {
      ...req.user,
      role: "admin",
    },
  });
});

router.post("/products", adminController.addProduct);
router.put("/products/:product_id", adminController.updateProduct);
router.delete("/products/:product_id", adminController.deleteProduct);
router.get("/orders", adminController.getAllOrders);
router.put("/orders/:order_id/status", adminController.updateOrderStatus);

// Image upload route
router.post(
  "/upload-image",
  uploadController.upload,
  uploadController.uploadProductImage,
);

// Analytics route
router.get("/analytics", analyticsController.getDashboardStats);

module.exports = router;
