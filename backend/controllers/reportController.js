const Bill = require("../models/Bill");
const Product = require("../models/Product");



const getSummaryReport = async (req, res) => {
  try {
    // 🔹 1. Total Sales (sum of all bills)
    const totalSalesData = await Bill.aggregate([
      { $match: { user: req.user.id } },
      {
        $group: {
          _id: null,
          totalSales: { $sum: "$totalAmount" },
          totalBills: { $sum: 1 },
        },
      },
    ]);

    const totalSales = totalSalesData[0]?.totalSales || 0;
    const totalBills = totalSalesData[0]?.totalBills || 0;



    const totalProducts = await Product.countDocuments({
      user: req.user.id,
    });



    const lowStockProducts = await Product.find({
      user: req.user.id,
      quantity: { $lt: 10 },
    });

    const lowStockCount = lowStockProducts.length;


    res.status(200).json({
      totalSales,
      totalBills,
      totalProducts,
      lowStockCount,
    });

  } catch (error) {
    console.error("Report Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


module.exports = {
  getSummaryReport,
};