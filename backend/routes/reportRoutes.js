const express = require("express");
const router = express.Router();

const { getSummaryReport } = require("../controllers/reportController");
const protect = require("../middleware/authMiddleware");


router.get("/summary", protect, getSummaryReport);


module.exports = router;