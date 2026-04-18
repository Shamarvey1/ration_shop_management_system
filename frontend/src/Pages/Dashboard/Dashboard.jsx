import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getSummaryReport,
  getProfitReport,
  getSalesTrend,
  getSalesReport,
} from "../../services/reportService";
import { getBills } from "../../services/billingService";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import {
  CircleDollarSign,
  ReceiptText,
  Boxes,
  BadgeIndianRupee,
  TrendingUp,
  AlertTriangle,
  Package,
} from "lucide-react";
import "./Dashboard.css";

const TREND_VIEW_STORAGE_KEY = "dashboardTrendView";

function Dashboard() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [profit, setProfit] = useState(null);
  const [bills, setBills] = useState([]);
  const [trend, setTrend] = useState([]);
  const [sales, setSales] = useState(null);
  const [trendView, setTrendView] = useState(() => {
    if (typeof window === "undefined") return "week";

    const savedView = window.localStorage.getItem(TREND_VIEW_STORAGE_KEY);

    return savedView === "day" || savedView === "week" ? savedView : "week";
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(TREND_VIEW_STORAGE_KEY, trendView);
    }
  }, [trendView]);

  const fetchData = async () => {
    try {
      const summaryData = await getSummaryReport();
      const profitData = await getProfitReport();
      const billData = await getBills();
      const trendData = await getSalesTrend("daily");
      const salesData = await getSalesReport();

      setSummary(summaryData || {});
      setProfit(profitData || {});
      setBills(billData || []);
      setTrend(trendData || []);
      setSales(salesData || null);
    } catch (err) {
      console.error("Dashboard Error:", err);
    }
  };

  if (!summary || !profit || !sales) {
    return (
      <div className="dashboard-page">
        <p className="dashboard-loading">Loading dashboard...</p>
      </div>
    );
  }

  const recentBills = bills.slice(0, 4);

  let chartData = (trend || []).map((item) => ({
    date: item._id,
    label: formatTrendLabel(item._id),
    day: getShortDay(item._id),
    shortDate: getShortDate(item._id),
    sales: item.totalSales,
  }));

  const totalSales = Number(summary.totalSales || 0);
  const totalProducts = Number(summary.totalProducts || 0);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  // Fill missing dates in the last 15 days
  chartData = fillMissingDates(chartData, today);
  const todayTransactions = bills.reduce((count, bill) => {
    if (!isSameLocalDate(bill.createdAt, today)) return count;

    return count + 1;
  }, 0);
  const todaySales = bills.reduce((sum, bill) => {
    if (!isSameLocalDate(bill.createdAt, today)) return sum;

    return sum + Number(bill.totalAmount || 0);
  }, 0);
  const yesterdayTransactions = bills.reduce((count, bill) => {
    if (!isSameLocalDate(bill.createdAt, yesterday)) return count;

    return count + 1;
  }, 0);
  const yesterdaySales = bills.reduce((sum, bill) => {
    if (!isSameLocalDate(bill.createdAt, yesterday)) return sum;

    return sum + Number(bill.totalAmount || 0);
  }, 0);
  const avgSale = todayTransactions > 0 ? todaySales / todayTransactions : 0;
  const yesterdayAvgSale =
    yesterdayTransactions > 0 ? yesterdaySales / yesterdayTransactions : 0;

  const trendComparisonText = "yesterday";
  const saleChange = getTrendPercent([
    { sales: yesterdaySales },
    { sales: todaySales },
  ]);
  const avgSaleChange = getTrendPercent([
    { sales: yesterdayAvgSale },
    { sales: avgSale },
  ]);
  const metricCards = [
    {
      title: "Today's Sales",
      value: formatCurrency(todaySales),
      icon: <CircleDollarSign size={18} />,
      iconClass: "mint",
      trend: saleChange,
      positive: saleChange >= 0,
      trendText: `compared to ${trendComparisonText}`,
    },
    {
      title: "Today's Transactions",
      value: todayTransactions,
      icon: <ReceiptText size={18} />,
      iconClass: "blue",
      subtitle: "Bills created today",
    },
    {
      title: "Products",
      value: totalProducts,
      icon: <Boxes size={18} />,
      iconClass: "violet",
      subtitle: `${summary.lowStockCount || 0} low stock items`,
    },
    {
      title: "Avg. Sale",
      value: formatCurrency(avgSale),
      icon: <BadgeIndianRupee size={18} />,
      iconClass: "amber",
      trend: avgSaleChange,
      positive: avgSaleChange >= 0,
      trendText: `compared to ${trendComparisonText}`,
    },
  ];

  const daySeries = chartData.slice(-15);
  const weekSeries = buildWeeklyTrendSeries(chartData).slice(-5);
  const trendSeries = trendView === "week" ? weekSeries : daySeries;
  const trendRangeLabel = trendView === "week" ? `Last ${trendSeries.length} weeks` : `Last ${trendSeries.length} days`;
  const trendXAxisKey = trendView === "week" ? "weekLabel" : "shortDate";
  const chartMax = Math.max(...trendSeries.map((item) => Number(item.sales || 0)), 0);
  const topProductsForView = getTopProductsForView(bills, trendView, today, 4);
  const topProductsLabel = trendView === "week" ? "This week" : "Today";

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <h1>Today's Overview</h1>
        <p>Welcome back. Here's what's happening in your store today.</p>
      </header>

      <section className="dashboard-metrics">
        {metricCards.map((card) => (
          <article key={card.title} className="metric-card">
            <div className="metric-top-row">
              <div>
                <p className="metric-title">{card.title}</p>
                <h2 className="metric-value">{card.value}</h2>
              </div>

              <div className={`metric-icon ${card.iconClass}`}>{card.icon}</div>
            </div>

            {typeof card.trend === "number" ? (
              <p className={`metric-subtext ${card.positive ? "positive" : "negative"}`}>
                {card.positive ? <TrendingUp size={14} /> : <AlertTriangle size={14} />}
                {Math.abs(card.trend).toFixed(1)}% {card.trendText}
              </p>
            ) : (
              <p className="metric-subtext neutral">{card.subtitle}</p>
            )}
          </article>
        ))}
      </section>

      <section className="dashboard-grid dashboard-grid-top">
        <article className="panel chart-panel">
          <div className="panel-header">
            <h3>Sales Overview</h3>
            <div className="chart-controls">
              <div className="trend-toggle" role="tablist" aria-label="Sales trend view">
                <button
                  type="button"
                  className={`trend-toggle-btn ${trendView === "day" ? "active" : ""}`}
                  onClick={() => setTrendView("day")}
                >
                  Day
                </button>
                <button
                  type="button"
                  className={`trend-toggle-btn ${trendView === "week" ? "active" : ""}`}
                  onClick={() => setTrendView("week")}
                >
                  Week
                </button>
              </div>
              <span className="pill">{trendRangeLabel}</span>
            </div>
          </div>

          {trendSeries.length > 0 ? (
            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendSeries} margin={{ top: 12, right: 10, left: -10, bottom: 4 }}>
                  <defs>
                    <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2E7D32" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#2E7D32" stopOpacity={0.04} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" vertical={false} />
                  <XAxis
                    dataKey={trendXAxisKey}
                    tick={{ fill: "#64748b", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#64748b", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={formatCompactCurrencyAxis}
                    domain={[0, Math.ceil(chartMax * 1.15) || 100]}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid #e2e8f0",
                      backgroundColor: "#ffffff",
                    }}
                    formatter={(value) => formatCurrency(value)}
                    labelFormatter={(label, payload) => payload?.[0]?.payload?.label || label}
                  />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    stroke="#2E7D32"
                    strokeWidth={3}
                    fill="url(#salesGradient)"
                    activeDot={{ r: 4, strokeWidth: 0, fill: "#1B5E28" }}
                    dot={{ r: 2, strokeWidth: 0, fill: "#2E7D32" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="empty-state">No trend data available.</p>
          )}
        </article>

        <article className="panel list-panel">
          <div className="panel-header">
            <h3>Top Products</h3>
            <span className="pill muted">{topProductsLabel}</span>
          </div>

          {topProductsForView.length > 0 ? (
            <div className="list-items">
              {topProductsForView.map((product, index) => (
                <div key={product.name + index} className="list-row">
                  <div className="list-row-left">
                    <span className="list-icon">
                      <Package size={16} />
                    </span>
                    <div>
                      <p className="list-title">{product.name}</p>
                      <p className="list-subtitle">{product.quantity} units</p>
                    </div>
                  </div>

                  <p className="list-amount">{product.quantity}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-state">No product sales data for {topProductsLabel.toLowerCase()}.</p>
          )}
        </article>
      </section>

      <section className="dashboard-grid dashboard-grid-bottom">
        <article className="panel list-panel">
          <div className="panel-header">
            <h3>Recent Transactions</h3>
            <button
              type="button"
              className="panel-link-btn"
              onClick={() => navigate("/billing")}
            >
              All Bills
            </button>
          </div>

          {recentBills.length > 0 ? (
            <div className="list-items">
              {recentBills.map((bill) => (
                <div key={bill._id} className="list-row">
                  <div>
                    <p className="list-title">{bill.customer?.name || bill.customerName || "Customer"}</p>
                    <p className="list-subtitle">{formatDateTime(bill.createdAt)}</p>
                  </div>

                  <div className="tx-right">
                    <p className="list-amount">{formatCurrency(bill.totalAmount)}</p>
                    <span className={`status-chip ${bill.remainingAmount > 0 ? "pending" : "complete"}`}>
                      {bill.remainingAmount > 0 ? "Pending" : "Completed"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-state">No recent bills.</p>
          )}
        </article>

        <article className="panel list-panel">
          <div className="panel-header">
            <h3>Inventory Alerts</h3>
            <span className="pill danger">{summary.lowStockCount || 0} items</span>
          </div>

          {summary.lowStockProducts?.length > 0 ? (
            <div className="alert-list">
              {summary.lowStockProducts.slice(0, 4).map((item, index) => (
                <div
                  key={item.name + index}
                  className={`alert-row ${item.quantity <= 2 ? "critical" : "low"}`}
                >
                  <div>
                    <p className="list-title">{item.name}</p>
                    <p className="list-subtitle">
                      {item.quantity} {item.unit} left
                    </p>
                  </div>
                  <button type="button" className="reorder-btn">
                    Reorder
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-state">No low stock items.</p>
          )}
        </article>
      </section>

    </div>
  );
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function formatDateTime(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatTrendLabel(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getShortDay(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value).slice(-2);
  }

  return new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
  }).format(date);
}

function getShortDate(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value).slice(5);
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
  }).format(date);
}

function formatCompactCurrencyAxis(value) {
  const number = Number(value || 0);

  if (number >= 10000000) return `Rs ${(number / 10000000).toFixed(1)}Cr`;
  if (number >= 100000) return `Rs ${(number / 100000).toFixed(1)}L`;
  if (number >= 1000) return `Rs ${(number / 1000).toFixed(0)}k`;
  return `Rs ${number}`;
}

function isSameLocalDate(value, targetDate) {
  if (!value || !targetDate) return false;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return false;

  return (
    date.getFullYear() === targetDate.getFullYear() &&
    date.getMonth() === targetDate.getMonth() &&
    date.getDate() === targetDate.getDate()
  );
}

function buildWeeklyTrendSeries(data) {
  if (!Array.isArray(data) || data.length === 0) return [];

  const weeklyMap = new Map();

  data.forEach((point) => {
    const date = new Date(point.date);

    if (Number.isNaN(date.getTime())) return;

    const weekStart = getWeekStartDate(date);
    const weekKey = weekStart.toISOString().slice(0, 10);

    if (!weeklyMap.has(weekKey)) {
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      weeklyMap.set(weekKey, {
        weekStart,
        weekEnd,
        weekLabel: getShortDate(weekStart),
        label: `${formatTrendLabel(weekStart)} to ${formatTrendLabel(weekEnd)}`,
        sales: 0,
      });
    }

    const weekEntry = weeklyMap.get(weekKey);
    weekEntry.sales += Number(point.sales || 0);
  });

  return Array.from(weeklyMap.values()).sort(
    (a, b) => a.weekStart.getTime() - b.weekStart.getTime()
  );
}

function getWeekStartDate(dateValue) {
  const date = new Date(dateValue);
  const day = (date.getDay() + 6) % 7;

  date.setDate(date.getDate() - day);
  date.setHours(0, 0, 0, 0);

  return date;
}

function isDateInCurrentWeek(value, referenceDate) {
  if (!value || !referenceDate) return false;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return false;

  const weekStart = getWeekStartDate(date);
  const referenceWeekStart = getWeekStartDate(referenceDate);

  return weekStart.getTime() === referenceWeekStart.getTime();
}

function getTopProductsForView(bills, trendView, referenceDate, limit = 5) {
  if (!Array.isArray(bills) || bills.length === 0) return [];

  const productMap = new Map();

  bills.forEach((bill) => {
    const isInScope =
      trendView === "week"
        ? isDateInCurrentWeek(bill.createdAt, referenceDate)
        : isSameLocalDate(bill.createdAt, referenceDate);

    if (!isInScope) return;

    const items = Array.isArray(bill.items) ? bill.items : [];

    items.forEach((item) => {
      const productName = item?.product?.name || "Unknown Product";
      const quantity = Number(item?.quantity || 0);

      if (quantity <= 0) return;

      productMap.set(productName, (productMap.get(productName) || 0) + quantity);
    });
  });

  return Array.from(productMap.entries())
    .map(([name, quantity]) => ({ name, quantity }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, limit);
}

function fillMissingDates(data, referenceDate) {
  if (!Array.isArray(data)) return [];

  // Create a map of existing dates for quick lookup
  const dateMap = new Map(data.map((item) => [item.date, item]));

  // Generate the last 15 days in local timezone
  const last15Days = [];
  for (let i = 14; i >= 0; i--) {
    const date = new Date(referenceDate);
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    
    // Format as YYYY-MM-DD in local timezone (not UTC)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    if (dateMap.has(dateStr)) {
      last15Days.push(dateMap.get(dateStr));
    } else {
      last15Days.push({
        date: dateStr,
        label: formatTrendLabel(dateStr),
        day: getShortDay(dateStr),
        shortDate: getShortDate(dateStr),
        sales: 0,
      });
    }
  }

  return last15Days;
}

function getTrendPercent(data) {
  if (!Array.isArray(data) || data.length < 2) return 0;

  const previous = Number(data[data.length - 2]?.sales || 0);
  const current = Number(data[data.length - 1]?.sales || 0);

  if (previous === 0) return current > 0 ? 100 : 0;

  return ((current - previous) / previous) * 100;
}

function getAverageSaleChange(data) {
  if (!Array.isArray(data) || data.length < 2) return 0;

  const previousPoints = data.slice(0, data.length - 1);
  const currentPoints = data.slice(1);

  const prevAvg =
    previousPoints.reduce((sum, point) => sum + Number(point.sales || 0), 0) /
    previousPoints.length;
  const currentAvg =
    currentPoints.reduce((sum, point) => sum + Number(point.sales || 0), 0) /
    currentPoints.length;

  if (prevAvg === 0) return currentAvg > 0 ? 100 : 0;

  return ((currentAvg - prevAvg) / prevAvg) * 100;
}

export default Dashboard;
