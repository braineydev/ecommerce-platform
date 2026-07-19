const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const adminController = require("../controllers/adminController");
const requireAuth = require("../middleware/authMiddleware");
const requireAdmin = require("../middleware/adminMiddleware");
const { createRateLimiter } = require("../middleware/securityMiddleware");

router.use(requireAuth);

router.get("/", requireAdmin, adminController.getAllOrders);
router.get("/my-orders", orderController.getMyOrders);
router.post(
  "/",
  createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: "Too many checkout attempts. Please try again later.",
  }),
  orderController.createOrder,
);

module.exports = router;
