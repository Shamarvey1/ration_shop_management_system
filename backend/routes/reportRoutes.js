const express = require("express");
const router = express.Router();

const {
	getSummaryReport,
	getSalesReport,
	getProfitReport,
	getSalesTrend,
	getReportInsights,
} = require("../controllers/reportController");
const protect = require("../middleware/authMiddleware");


router.get("/summary", protect, getSummaryReport);
router.get("/sales", protect, getSalesReport);
router.get("/profit", protect, getProfitReport);
router.get("/sales-trend", protect, getSalesTrend);
router.get("/insights", protect, getReportInsights);


module.exports = router;