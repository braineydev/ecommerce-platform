const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");
const requireAuth = require("../middleware/authMiddleware");
const requireAdmin = require("../middleware/adminMiddleware");

router.use(requireAuth);

router.post("/submit", paymentController.submitPayment);
router.post("/verify", requireAdmin, paymentController.verifyPayment);

module.exports = router;
