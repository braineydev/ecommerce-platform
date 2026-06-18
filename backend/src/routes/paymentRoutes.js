const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");
const requireAuth = require("../middleware/authMiddleware");

router.use(requireAuth);

router.post("/submit", paymentController.submitPayment);
router.post("/verify", paymentController.verifyPayment);

module.exports = router;
