const express = require("express");
const router = express.Router();

const { getSummaryReport,getSalesReport } = require("../controllers/reportController");
const protect = require("../middleware/authMiddleware");


router.get("/summary", protect, getSummaryReport);
router.get("/sales", protect, getSalesReport);


module.exports = router;