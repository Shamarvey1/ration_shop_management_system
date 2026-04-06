const Bill = require("../models/Bill");
const Product = require("../models/Product");



const getSummaryReport = async (req, res) => {
  try {
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
    console.log("Total Sales Data:", totalSalesData);

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

const getSalesReport = async (req, res) => {
  try {
    const bills = await Bill.find({ user: req.user.id })
      .populate("items.product");
    let totalSales = 0;
    const totalTransactions = bills.length;
    const productMap = {};

    for (let bill of bills) {
      totalSales += bill.totalAmount;

      for (let item of bill.items) {
        const productName = item.product?.name || "Unknown";

        if (!productMap[productName]) {
          productMap[productName] = 0;
        }

        productMap[productName] += item.quantity;
      }
    }
    const topProducts = Object.keys(productMap).map((name) => ({
      name,
      quantity: productMap[name],
    }));

    topProducts.sort((a, b) => b.quantity - a.quantity);

    const top3 = topProducts.slice(0, 3);

    res.status(200).json({
      totalSales,
      totalTransactions,
      topProducts: top3,
    });

  } catch (error) {
    console.error("Sales Report Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getProfitReport = async (req, res) => {
  try {
    const bills = await Bill.find({ user: req.user.id })
      .populate("items.product");

    let totalProfit = 0;

    for (let bill of bills) {
      for (let item of bill.items) {
        const sellingPrice = item.price;
        const purchasePrice = item.product?.purchasePrice || 0;
        const quantity = item.quantity;

        const profit = (sellingPrice - purchasePrice) * quantity;

        totalProfit += profit;
      }
    }

    res.status(200).json({
      totalProfit,
    });

  } catch (error) {
    console.error("Profit Report Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
const mongoose = require("mongoose");

const getSalesTrend = async (req, res) => {
  try {
    const { filter } = req.query;

    let groupFormat = "%Y-%m-%d";

    if (filter === "monthly") {
      groupFormat = "%Y-%m";
    } else if (filter === "yearly") {
      groupFormat = "%Y";
    }

    const salesTrend = await Bill.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(req.user.id), 
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: groupFormat,
              date: "$createdAt",
            },
          },
          totalSales: { $sum: "$totalAmount" },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);


    res.status(200).json(salesTrend);

  } catch (error) {
    console.error("Sales Trend Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
module.exports = {
  getSummaryReport,
  getSalesReport,
  getProfitReport,
    getSalesTrend,
};