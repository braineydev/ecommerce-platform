const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const { createRateLimiter } = require("../middleware/securityMiddleware");

const productSearchLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 120,
  message: "Too many product requests. Please try again later.",
});

router.get("/categories", productController.getCategories);
router.get("/", productSearchLimiter, productController.getProducts);
router.get("/:id", productController.getProductById);

module.exports = router;
