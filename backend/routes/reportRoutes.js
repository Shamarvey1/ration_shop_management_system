const express = require("express");
const router = express.Router();

const { getSummaryReport,getSalesReport,getProfitReport } = require("../controllers/reportController");
const protect = require("../middleware/authMiddleware");


router.get("/summary", protect, getSummaryReport);
router.get("/sales", protect, getSalesReport);
router.get("/profit", protect, getProfitReport);


module.exports = router;