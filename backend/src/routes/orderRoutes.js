const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const adminController = require("../controllers/adminController");
const requireAuth = require("../middleware/authMiddleware");
const requireAdmin = require("../middleware/adminMiddleware");

router.use(requireAuth);

router.get("/", requireAdmin, adminController.getAllOrders);
router.get("/my-orders", orderController.getMyOrders);
router.post("/", orderController.createOrder);

module.exports = router;
