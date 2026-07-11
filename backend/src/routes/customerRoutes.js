const express = require("express");
const router = express.Router();
const { getAllCustomers } = require("../controllers/customerController");
const requireAuth = require("../middleware/authMiddleware");
const requireAdmin = require("../middleware/adminMiddleware");

router.use(requireAuth, requireAdmin);

router.get("/", getAllCustomers);

module.exports = router;
