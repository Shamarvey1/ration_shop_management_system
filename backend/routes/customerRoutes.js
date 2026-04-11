const express = require('express');
const router = express.Router();

const { addCustomer, getCustomers, deleteCustomer,getCustomerDetails } = require("../controllers/customerController");
const protect = require("../middleware/authMiddleware");

router.post("/",protect,addCustomer);
router.get("/",protect,getCustomers);
router.delete("/:id",protect,deleteCustomer);
router.get("/:id/details", protect, getCustomerDetails);

module.exports = router;