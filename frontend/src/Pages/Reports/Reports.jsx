import { useEffect, useState } from "react";
import {
  getReportInsights,
} from "../../services/reportService";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
  ResponsiveContainer,
} from "recharts";

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

import "./Reports.css";

function Reports() {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filter, setFilter] = useState("daily");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    fetchReport();
  }, [filter, fromDate, toDate]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getReportInsights({
        filter,
        from: fromDate,
        to: toDate,
      });

      if (!data) {
        setError("Unable to load reports. Please try again.");
        setInsights(null);
        return;
      }

      setInsights(data);
    } catch (err) {
      console.error("Reports fetch error:", err);
      setError("Unable to load reports. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p className="reports-loading">Loading reports...</p>;
  if (error) return <p className="reports-error">{error}</p>;
  if (!insights) return <p className="reports-error">No report data available.</p>;

  const salesTrendData = (insights.salesTrend || []).map((item) => ({
    date: item._id,
    sales: item.totalSales,
  }));

  const topProductsChartData = (insights.topProducts || []).slice(0, 5).map((p) => ({
    name: p.name,
    quantity: p.quantity,
  }));

  const categoryChartData = (insights.categoryPerformance || []).map((category) => ({
    name: category.name,
    sales: category.sales,
  }));

  const categoryPieColors = [
    "#2E7D32",
    "#66BB6A",
    "#81C784",
    "#A5D6A7",
    "#43A047",
    "#388E3C",
    "#AED581",
    "#9CCC65",
  ];

  const formatCurrency = (value) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(value || 0));

  const formatPercent = (value) => `${Number(value || 0).toFixed(1)}%`;

  const downloadExcel = () => {
    if (!insights) {
      alert("Data not loaded yet");
      return;
    }

    const summaryData = [
      {
        "Total Sales": insights.summary?.totalSales || 0,
        "Total Transactions": insights.summary?.totalTransactions || 0,
        "Total Profit": insights.summary?.totalProfit || 0,
        "Gross Margin %": Number(insights.summary?.grossMarginPercent || 0).toFixed(2),
        "Total Pending": insights.collections?.totalPendingAmount || 0,
        "Collected Today": insights.collections?.collectedToday || 0,
        "Collection Rate %": Number(insights.collections?.collectionRatePercent || 0).toFixed(2),
      },
    ];

    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    const trendSheetData = (insights.salesTrend || []).map((t) => ({
      Date: t._id,
      Sales: t.totalSales,
    }));

    const trendSheet = XLSX.utils.json_to_sheet(trendSheetData);

    const productSheetData = (insights.topProducts || []).map((p) => ({
      Name: p.name,
      Quantity: p.quantity,
      Sales: p.sales,
      Profit: p.profit,
      "Margin %": Number(p.marginPercent || 0).toFixed(2),
    }));

    const productSheet = XLSX.utils.json_to_sheet(productSheetData);

    const categorySheetData = (insights.categoryPerformance || []).map((item) => ({
      Category: item.name,
      Sales: item.sales,
      Profit: item.profit,
      Quantity: item.quantity,
      "Margin %": Number(item.marginPercent || 0).toFixed(2),
    }));

    const agingSheetData = [
      {
        "0-7 Days": insights.duesAging?.zeroToSevenDays || 0,
        "8-30 Days": insights.duesAging?.eightToThirtyDays || 0,
        "30+ Days": insights.duesAging?.aboveThirtyDays || 0,
      },
    ];

    const categorySheet = XLSX.utils.json_to_sheet(categorySheetData);
    const agingSheet = XLSX.utils.json_to_sheet(agingSheetData);

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");
    XLSX.utils.book_append_sheet(workbook, trendSheet, "Sales Trend");
    XLSX.utils.book_append_sheet(workbook, productSheet, "Top Products");
    XLSX.utils.book_append_sheet(workbook, categorySheet, "Category Performance");
    XLSX.utils.book_append_sheet(workbook, agingSheet, "Dues Aging");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const fileData = new Blob([excelBuffer], {
      type:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(fileData, "reports.xlsx");
  };

  return (
    <div className="reports-page">
      <header className="reports-header">
        <div>
          <h2>Reports Dashboard</h2>
          <p>Analyze collections, profitability, stock risk, and category performance.</p>
        </div>

        <div className="reports-controls">
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="daily">Daily</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          <button type="button" className="reports-btn" onClick={downloadExcel}>
            Download Excel
          </button>
        </div>
      </header>

      <section className="reports-cards">
        <article className="reports-card"><p>Total Sales</p><h3>{formatCurrency(insights.summary?.totalSales)}</h3></article>
        <article className="reports-card"><p>Total Profit</p><h3>{formatCurrency(insights.summary?.totalProfit)}</h3></article>
        <article className="reports-card"><p>Gross Margin</p><h3>{formatPercent(insights.summary?.grossMarginPercent)}</h3></article>
        <article className="reports-card"><p>Transactions</p><h3>{insights.summary?.totalTransactions || 0}</h3></article>
        <article className="reports-card"><p>Total Pending</p><h3>{formatCurrency(insights.collections?.totalPendingAmount)}</h3></article>
        <article className="reports-card"><p>Collected Today</p><h3>{formatCurrency(insights.collections?.collectedToday)}</h3></article>
        <article className="reports-card"><p>Collection Rate</p><h3>{formatPercent(insights.collections?.collectionRatePercent)}</h3></article>
        <article className="reports-card"><p>Avg Daily Sales</p><h3>{formatCurrency(insights.summary?.averageDailySales)}</h3></article>
      </section>

      <section className="reports-grid reports-grid-top">
        <article className="reports-panel">
          <div className="reports-panel-header">
            <h3>Sales Trend</h3>
            <span className="reports-pill">
              {formatPercent(insights.comparison?.growthPercent)} vs previous
            </span>
          </div>
          <div className="reports-chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesTrendData} margin={{ top: 10, right: 12, left: 0, bottom: 2 }}>
                <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Line type="monotone" dataKey="sales" stroke="#2E7D32" strokeWidth={3} dot={{ r: 2 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="reports-panel">
          <div className="reports-panel-header"><h3>Sales by Category</h3></div>
          <div className="reports-chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 6, right: 6, left: 6, bottom: 6 }}>
                <Pie
                  data={categoryChartData}
                  dataKey="sales"
                  nameKey="name"
                  cx="50%"
                  cy="40%"
                  outerRadius={58}
                  innerRadius={29}
                  paddingAngle={2}
                >
                  {categoryChartData.map((entry, index) => (
                    <Cell
                      key={`category-slice-${entry.name}`}
                      fill={categoryPieColors[index % categoryPieColors.length]}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend
                  verticalAlign="bottom"
                  height={22}
                  iconType="circle"
                  wrapperStyle={{ fontSize: "11px", color: "#334155", paddingTop: "2px" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </article>
      </section>

      <section className="reports-grid reports-grid-bottom">
        <article className="reports-panel">
          <div className="reports-panel-header"><h3>Top Profitable Products</h3></div>
          <div className="reports-list">
            {(insights.topProfitableProducts || []).map((item) => (
              <div key={item.name} className="reports-row">
                <div>
                  <p className="reports-title">{item.name}</p>
                  <p className="reports-subtitle">Margin {formatPercent(item.marginPercent)}</p>
                </div>
                <p className="reports-amount">{formatCurrency(item.profit)}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="reports-panel">
          <div className="reports-panel-header"><h3>Low Margin Products</h3></div>
          <div className="reports-list">
            {(insights.lowMarginProducts || []).map((item) => (
              <div key={item.name} className="reports-row">
                <div>
                  <p className="reports-title">{item.name}</p>
                  <p className="reports-subtitle">Profit {formatCurrency(item.profit)}</p>
                </div>
                <p className="reports-amount">{formatPercent(item.marginPercent)}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="reports-panel">
          <div className="reports-panel-header"><h3>Dues Aging</h3></div>
          <div className="reports-list">
            <div className="reports-row"><p className="reports-title">0-7 days</p><p className="reports-amount">{formatCurrency(insights.duesAging?.zeroToSevenDays)}</p></div>
            <div className="reports-row"><p className="reports-title">8-30 days</p><p className="reports-amount">{formatCurrency(insights.duesAging?.eightToThirtyDays)}</p></div>
            <div className="reports-row"><p className="reports-title">30+ days</p><p className="reports-amount">{formatCurrency(insights.duesAging?.aboveThirtyDays)}</p></div>
          </div>
        </article>

        <article className="reports-panel">
          <div className="reports-panel-header"><h3>Inventory Stockout Risk</h3></div>
          <div className="reports-list">
            {(insights.inventoryRisk || []).slice(0, 6).map((item) => (
              <div key={item.id} className="reports-row">
                <div>
                  <p className="reports-title">{item.name}</p>
                  <p className="reports-subtitle">{item.quantity} {item.unit} left</p>
                </div>
                <p className="reports-amount">
                  {item.daysLeft === null ? "-" : `${Math.max(0, item.daysLeft).toFixed(1)}d`}
                </p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="reports-grid-single">
        <article className="reports-panel">
          <div className="reports-panel-header"><h3>Top Products by Quantity</h3></div>
          <div className="reports-chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topProductsChartData}
                layout="vertical"
                margin={{ top: 4, right: 18, left: 8, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" vertical={false} />
                <XAxis type="number" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={110}
                  tick={{ fill: "#64748b", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip />
                <Bar dataKey="quantity" fill="#2E7D32" radius={[0, 8, 8, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
      </section>
    </div>
  );
}

export default Reports;