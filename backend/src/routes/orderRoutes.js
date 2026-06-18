const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const requireAuth = require("../middleware/authMiddleware");

router.use(requireAuth);

router.post("/checkout", orderController.createOrder);

module.exports = router;
