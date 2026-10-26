const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const { chatWithAgent } = require("../controllers/agentController");

router.post("/chat", protect, chatWithAgent);

module.exports = router;
