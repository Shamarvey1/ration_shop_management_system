const Bill = require("../models/Bill");
const Product = require("../models/Product");
const mongoose = require("mongoose");

const getSummaryReport = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);

    const totalSalesData = await Bill.aggregate([
      { $match: { user: userId } }, 
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
      user: userId, 
    });

    const lowStockProducts = await Product.find({
      user: userId, 
      quantity: { $lt: 10 },
    }).select("name quantity unit");

    res.status(200).json({
      totalSales,
      totalBills,
      totalProducts,
      lowStockCount: lowStockProducts.length,
      lowStockProducts,
    });

  } catch (error) {
    console.error("Report Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getSalesReport = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);

    const bills = await Bill.find({ user: userId }) 
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

    res.status(200).json({
      totalSales,
      totalTransactions,
      topProducts: topProducts.slice(0, 5),
    });

  } catch (error) {
    console.error("Sales Report Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


const getProfitReport = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);

    const bills = await Bill.find({ user: userId }) 
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

const getSalesTrend = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
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
          user: userId, 
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