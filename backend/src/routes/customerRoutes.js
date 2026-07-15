const express = require("express");
const router = express.Router();
const {
  getAllCustomers,
  updateCustomer,
} = require("../controllers/customerController");
const requireAuth = require("../middleware/authMiddleware");
const requireAdmin = require("../middleware/adminMiddleware");

router.use(requireAuth, requireAdmin);

router.get("/", getAllCustomers);
router.put("/:customer_id", updateCustomer);

module.exports = router;
