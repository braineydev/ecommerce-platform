const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { createRateLimiter } = require("../middleware/securityMiddleware");

const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many authentication attempts. Please try again later.",
});

router.post("/signup", authLimiter, authController.signup);
router.post("/login", authLimiter, authController.login);
router.post("/phone-otp", authLimiter, authController.requestPhoneOtp);
router.post("/phone-otp/verify", authLimiter, authController.verifyPhoneOtp);
router.get("/social/google", authLimiter, authController.startGoogleSignIn);
router.post("/session", authLimiter, authController.createSessionFromToken);
router.get("/me", require("../middleware/authMiddleware"), authController.me);
router.post("/logout", authController.logout);

module.exports = router;
