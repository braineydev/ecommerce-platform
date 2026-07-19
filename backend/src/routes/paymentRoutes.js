const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");
const requireAuth = require("../middleware/authMiddleware");
const requireAdmin = require("../middleware/adminMiddleware");
const { createRateLimiter } = require("../middleware/securityMiddleware");

router.use(requireAuth);

router.post(
  "/submit",
  createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: "Too many payment submissions. Please try again later.",
  }),
  paymentController.submitPayment,
);
router.post("/verify", requireAdmin, paymentController.verifyPayment);

module.exports = router;
