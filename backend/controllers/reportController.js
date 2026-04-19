const Bill = require("../models/Bill");
const Product = require("../models/Product");
const Customer = require("../models/Customer");
const mongoose = require("mongoose");

const IST_OFFSET_MINUTES = 330;

function getISTDayBounds(baseDate = new Date()) {
  const utcMillis = baseDate.getTime();
  const istMillis = utcMillis + IST_OFFSET_MINUTES * 60 * 1000;
  const istDate = new Date(istMillis);

  const y = istDate.getUTCFullYear();
  const m = istDate.getUTCMonth();
  const d = istDate.getUTCDate();

  const startUTC = Date.UTC(y, m, d, 0, 0, 0) - IST_OFFSET_MINUTES * 60 * 1000;
  const endUTC = Date.UTC(y, m, d, 23, 59, 59, 999) - IST_OFFSET_MINUTES * 60 * 1000;

  return { start: new Date(startUTC), end: new Date(endUTC) };
}

function parseDateRange(from, to) {
  if (!from && !to) return null;

  const range = {};

  if (from) {
    const fromDate = new Date(from);
    if (!Number.isNaN(fromDate.getTime())) {
      fromDate.setHours(0, 0, 0, 0);
      range.$gte = fromDate;
    }
  }

  if (to) {
    const toDate = new Date(to);
    if (!Number.isNaN(toDate.getTime())) {
      toDate.setHours(23, 59, 59, 999);
      range.$lte = toDate;
    }
  }

  return Object.keys(range).length > 0 ? range : null;
}

function getGroupFormat(filter) {
  if (filter === "monthly") return "%Y-%m";
  if (filter === "yearly") return "%Y";
  return "%Y-%m-%d";
}

function getCurrentPreviousPeriodBounds(filter) {
  const now = new Date();

  if (filter === "yearly") {
    const year = now.getFullYear();
    return {
      currentStart: new Date(year, 0, 1),
      currentEnd: now,
      previousStart: new Date(year - 1, 0, 1),
      previousEnd: new Date(year - 1, now.getMonth(), now.getDate(), 23, 59, 59, 999),
    };
  }

  if (filter === "monthly") {
    const year = now.getFullYear();
    const month = now.getMonth();
    return {
      currentStart: new Date(year, month, 1),
      currentEnd: now,
      previousStart: new Date(year, month - 1, 1),
      previousEnd: new Date(year, month, 0, 23, 59, 59, 999),
    };
  }

  const todayBounds = getISTDayBounds(now);
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const yesterdayBounds = getISTDayBounds(yesterday);

  return {
    currentStart: todayBounds.start,
    currentEnd: todayBounds.end,
    previousStart: yesterdayBounds.start,
    previousEnd: yesterdayBounds.end,
  };
}

function getCurrentPeriodBounds(filter) {
  const now = new Date();

  if (filter === "yearly") {
    return {
      start: new Date(now.getFullYear(), 0, 1),
      end: now,
    };
  }

  if (filter === "monthly") {
    return {
      start: new Date(now.getFullYear(), now.getMonth(), 1),
      end: now,
    };
  }

  const todayBounds = getISTDayBounds(now);
  return {
    start: todayBounds.start,
    end: todayBounds.end,
  };
}

function isDateInRange(date, range) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return false;
  if (!range) return true;

  if (range.$gte && date < range.$gte) return false;
  if (range.$lte && date > range.$lte) return false;

  return true;
}

function sumSalesForRange(bills, start, end) {
  return bills.reduce((sum, bill) => {
    if (bill.createdAt >= start && bill.createdAt <= end) {
      return sum + Number(bill.totalAmount || 0);
    }

    return sum;
  }, 0);
}

function buildInsights(bills, products, customerDebtTotal, filter, periodRange, comparisonBills = bills, trendBills = bills) {
  const safeBills = Array.isArray(bills) ? bills : [];
  const safeComparisonBills = Array.isArray(comparisonBills) ? comparisonBills : safeBills;
  const safeTrendBills = Array.isArray(trendBills) ? trendBills : safeBills;
  const safeProducts = Array.isArray(products) ? products : [];

  let totalSales = 0;
  let totalPaid = 0;
  let totalProfit = 0;
  let totalQuantitySold = 0;

  const productMap = new Map();
  const categoryMap = new Map();

  const now = new Date();
  const last30Days = new Date(now);
  last30Days.setDate(now.getDate() - 30);
  const soldLast30ByProduct = new Map();

  let pending0to7 = 0;
  let pending8to30 = 0;
  let pending30Plus = 0;

  safeBills.forEach((bill) => {
    const billTotal = Number(bill.totalAmount || 0);
    totalSales += billTotal;
    totalPaid += Number(bill.paidAmount || 0);

    const currentBillPending = Number(bill.currentBillPending || 0);
    if (currentBillPending > 0) {
      const ageDays = Math.floor((now.getTime() - new Date(bill.createdAt).getTime()) / (24 * 60 * 60 * 1000));
      if (ageDays <= 7) pending0to7 += currentBillPending;
      else if (ageDays <= 30) pending8to30 += currentBillPending;
      else pending30Plus += currentBillPending;
    }

    const items = Array.isArray(bill.items) ? bill.items : [];

    items.forEach((item) => {
      const qty = Number(item.quantity || 0);
      if (qty <= 0) return;

      const salePrice = Number(item.price || 0);
      const salesValue = salePrice * qty;
      const productDoc = item.product || {};
      const purchasePrice = Number(productDoc.purchasePrice || 0);
      const profitValue = (salePrice - purchasePrice) * qty;
      const productName = productDoc.name || "Unknown";
      const categoryName = productDoc.category || "Other";
      const productId = String(productDoc._id || productName);

      totalProfit += profitValue;
      totalQuantitySold += qty;

      if (!productMap.has(productId)) {
        productMap.set(productId, {
          id: productId,
          name: productName,
          category: categoryName,
          quantity: 0,
          sales: 0,
          profit: 0,
        });
      }

      const productEntry = productMap.get(productId);
      productEntry.quantity += qty;
      productEntry.sales += salesValue;
      productEntry.profit += profitValue;

      if (!categoryMap.has(categoryName)) {
        categoryMap.set(categoryName, {
          name: categoryName,
          sales: 0,
          profit: 0,
          quantity: 0,
        });
      }

      const categoryEntry = categoryMap.get(categoryName);
      categoryEntry.sales += salesValue;
      categoryEntry.profit += profitValue;
      categoryEntry.quantity += qty;

      if (new Date(bill.createdAt) >= last30Days) {
        soldLast30ByProduct.set(productId, (soldLast30ByProduct.get(productId) || 0) + qty);
      }
    });
  });

  const productPerformance = Array.from(productMap.values()).map((item) => ({
    ...item,
    marginPercent: item.sales > 0 ? (item.profit / item.sales) * 100 : 0,
  }));

  const topProducts = [...productPerformance]
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10)
    .map(({ name, quantity, sales, profit, marginPercent }) => ({
      name,
      quantity,
      sales,
      profit,
      marginPercent,
    }));

  const topProfitableProducts = [...productPerformance]
    .sort((a, b) => b.profit - a.profit)
    .slice(0, 5)
    .map(({ name, sales, profit, marginPercent, quantity }) => ({
      name,
      sales,
      profit,
      marginPercent,
      quantity,
    }));

  const lowMarginProducts = [...productPerformance]
    .filter((item) => item.sales > 0)
    .sort((a, b) => a.marginPercent - b.marginPercent)
    .slice(0, 5)
    .map(({ name, sales, profit, marginPercent, quantity }) => ({
      name,
      sales,
      profit,
      marginPercent,
      quantity,
    }));

  const categoryPerformance = Array.from(categoryMap.values())
    .map((item) => ({
      ...item,
      marginPercent: item.sales > 0 ? (item.profit / item.sales) * 100 : 0,
    }))
    .sort((a, b) => b.sales - a.sales);

  const trendGroupFormat = getGroupFormat(filter);
  const trendMap = new Map();
  safeTrendBills.forEach((bill) => {
    const dt = new Date(bill.createdAt);
    if (Number.isNaN(dt.getTime())) return;

    const key =
      trendGroupFormat === "%Y"
        ? String(dt.getFullYear())
        : trendGroupFormat === "%Y-%m"
          ? `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`
          : `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;

    trendMap.set(key, (trendMap.get(key) || 0) + Number(bill.totalAmount || 0));
  });

  const salesTrend = Array.from(trendMap.entries())
    .map(([key, total]) => ({ _id: key, totalSales: total }))
    .sort((a, b) => (a._id < b._id ? -1 : 1));

  let comparison;
  if (periodRange) {
    const currentStart = periodRange.start;
    const currentEnd = periodRange.end;
    const duration = currentEnd.getTime() - currentStart.getTime();
    const previousEnd = new Date(currentStart.getTime() - 1);
    const previousStart = new Date(previousEnd.getTime() - duration);
    comparison = {
      currentSales: sumSalesForRange(safeComparisonBills, currentStart, currentEnd),
      previousSales: sumSalesForRange(safeComparisonBills, previousStart, previousEnd),
    };
  } else {
    const bounds = getCurrentPreviousPeriodBounds(filter);
    comparison = {
      currentSales: sumSalesForRange(safeComparisonBills, bounds.currentStart, bounds.currentEnd),
      previousSales: sumSalesForRange(safeComparisonBills, bounds.previousStart, bounds.previousEnd),
    };
  }

  comparison.growthPercent =
    comparison.previousSales > 0
      ? ((comparison.currentSales - comparison.previousSales) / comparison.previousSales) * 100
      : comparison.currentSales > 0
        ? 100
        : 0;

  const todayBounds = getISTDayBounds(new Date());
  const todaySales = sumSalesForRange(safeBills, todayBounds.start, todayBounds.end);
  const todayCollected = safeBills.reduce((sum, bill) => {
    const billDate = new Date(bill.createdAt);
    if (billDate >= todayBounds.start && billDate <= todayBounds.end) {
      return sum + Number(bill.paidAmount || 0);
    }

    return sum;
  }, 0);

  const averageDailySales = salesTrend.length > 0 ? totalSales / salesTrend.length : 0;
  const bestSalesPeriod = salesTrend.length > 0
    ? salesTrend.reduce((best, item) => (item.totalSales > best.totalSales ? item : best), salesTrend[0])
    : null;

  const inventoryRisk = safeProducts
    .map((product) => {
      const productId = String(product._id);
      const soldLast30 = Number(soldLast30ByProduct.get(productId) || 0);
      const dailyRunRate = soldLast30 / 30;
      const daysLeft = dailyRunRate > 0 ? Number(product.quantity || 0) / dailyRunRate : null;

      return {
        id: productId,
        name: product.name,
        category: product.category,
        quantity: Number(product.quantity || 0),
        unit: product.unit,
        soldLast30,
        dailyRunRate,
        daysLeft,
      };
    })
    .filter((item) => item.quantity <= 10 || (item.daysLeft !== null && item.daysLeft <= 7))
    .sort((a, b) => {
      const aRisk = a.daysLeft === null ? Number.POSITIVE_INFINITY : a.daysLeft;
      const bRisk = b.daysLeft === null ? Number.POSITIVE_INFINITY : b.daysLeft;
      return aRisk - bRisk;
    })
    .slice(0, 10);

  return {
    summary: {
      totalSales,
      totalTransactions: safeBills.length,
      totalPaid,
      totalProfit,
      grossMarginPercent: totalSales > 0 ? (totalProfit / totalSales) * 100 : 0,
      totalQuantitySold,
      averageDailySales,
      bestSalesPeriod,
    },
    collections: {
      totalPendingAmount: customerDebtTotal,
      collectedToday: todayCollected,
      todaySales,
      collectionRatePercent: totalSales > 0 ? (totalPaid / totalSales) * 100 : 0,
    },
    duesAging: {
      zeroToSevenDays: pending0to7,
      eightToThirtyDays: pending8to30,
      aboveThirtyDays: pending30Plus,
    },
    comparison,
    salesTrend,
    topProducts,
    topProfitableProducts,
    lowMarginProducts,
    categoryPerformance,
    inventoryRisk,
  };
}

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

    const products = await Product.find({ user: userId }).lean();
    const customerDebtData = await Customer.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: null,
          totalPendingAmount: { $sum: "$debt" },
        },
      },
    ]);

    const customerDebtTotal = Number(customerDebtData[0]?.totalPendingAmount || 0);
    const insights = buildInsights(bills, products, customerDebtTotal, "daily", null);

    res.status(200).json({
      totalSales,
      totalTransactions,
      topProducts: topProducts.slice(0, 5),
      categoryPerformance: insights.categoryPerformance,
      topProfitableProducts: insights.topProfitableProducts,
      lowMarginProducts: insights.lowMarginProducts,
      collections: insights.collections,
      duesAging: insights.duesAging,
      comparison: insights.comparison,
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
    const { filter, from, to } = req.query;

    const groupFormat = getGroupFormat(filter);
    const dateRange = parseDateRange(from, to);

    const salesTrend = await Bill.aggregate([
      {
        $match: {
          user: userId,
          ...(dateRange ? { createdAt: dateRange } : {}),
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: groupFormat,
              date: "$createdAt",
              timezone: "Asia/Kolkata",
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

const getReportInsights = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const { filter = "daily", from, to } = req.query;

    const dateRange = parseDateRange(from, to);
    const allBills = await Bill.find({ user: userId })
      .populate("items.product")
      .lean();

    const effectiveRange = dateRange || (() => {
      const bounds = getCurrentPeriodBounds(filter);
      return { $gte: bounds.start, $lte: bounds.end };
    })();

    const scopedBills = allBills.filter((bill) => isDateInRange(new Date(bill.createdAt), effectiveRange));

    const products = await Product.find({ user: userId }).lean();

    const customerDebtData = await Customer.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: null,
          totalPendingAmount: { $sum: "$debt" },
        },
      },
    ]);

    const customerDebtTotal = Number(customerDebtData[0]?.totalPendingAmount || 0);
    const insights = buildInsights(
      scopedBills,
      products,
      customerDebtTotal,
      filter,
      dateRange
        ? {
            start: dateRange.$gte || new Date(0),
            end: dateRange.$lte || new Date(),
          }
        : null,
      allBills,
      dateRange ? scopedBills : allBills
    );

    res.status(200).json(insights);
  } catch (error) {
    console.error("Report Insights Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getSummaryReport,
  getSalesReport,
  getProfitReport,
  getSalesTrend,
  getReportInsights,
};