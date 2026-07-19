const express = require("express");
const router = express.Router();
const cartController = require("../controllers/cartController");
const requireAuth = require("../middleware/authMiddleware");
const { createRateLimiter } = require("../middleware/securityMiddleware");

router.use(requireAuth);

router.get("/", cartController.getCart);
router.post(
  "/add",
  createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 60,
    message: "Too many cart updates. Please try again shortly.",
  }),
  cartController.addToCart,
);

module.exports = router;
