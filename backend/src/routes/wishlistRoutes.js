const express = require("express");
const router = express.Router();
const wishlistController = require("../controllers/wishlistController");
const requireAuth = require("../middleware/authMiddleware");

// All wishlist actions require the user to be logged in
router.use(requireAuth);

router.get("/", wishlistController.getWishlist);
router.post("/add", wishlistController.addToWishlist);

// Notice the :product_id parameter in the URL path for deleting
router.delete("/remove/:product_id", wishlistController.removeFromWishlist);

module.exports = router;
