import { useEffect, useState } from "react";
import {
  getSummaryReport,
  getProfitReport,
  getSalesTrend,
} from "../../services/reportService";
import { getBills } from "../../services/billingService";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [profit, setProfit] = useState(null);
  const [bills, setBills] = useState([]);
  const [trend, setTrend] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const summaryData = await getSummaryReport();
      const profitData = await getProfitReport();
      const billData = await getBills();
      const trendData = await getSalesTrend("daily");

      setSummary(summaryData || {});
      setProfit(profitData || {});
      setBills(billData || []);
      setTrend(trendData || []);
    } catch (err) {
      console.error("Dashboard Error:", err);
    }
  };

  if (!summary || !profit) return <p>Loading...</p>;

  const recentBills = bills.slice(0, 5);

  const chartData = (trend || []).map((t) => ({
    date: t._id,
    sales: t.totalSales,
  }));

  return (
    <div style={{ padding: "20px" }}>
      <h2>Dashboard</h2>

      {/* 🟢 SUMMARY CARDS */}
      <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
        <div style={cardStyle}>
          <h4>Total Sales</h4>
          <p>₹{summary.totalSales || 0}</p>
        </div>

        <div style={cardStyle}>
          <h4>Total Profit</h4>
          <p>₹{profit.totalProfit || 0}</p>
        </div>

        <div style={cardStyle}>
          <h4>Total Products</h4>
          <p>{summary.totalProducts || 0}</p>
        </div>

        <div style={cardStyle}>
          <h4>Low Stock</h4>
          <p>{summary.lowStockCount || 0}</p>
        </div>
      </div>

      {/* 🔵 SALES TREND */}
      <div style={{ marginTop: "30px" }}>
        <h3>Sales Trend</h3>

        <LineChart width={500} height={250} data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="sales" />
        </LineChart>
      </div>

      {/* 🟡 RECENT BILLS */}
      <div style={{ marginTop: "30px" }}>
        <h3>Recent Transactions</h3>

        {recentBills.length > 0 ? (
          recentBills.map((bill) => (
            <div key={bill._id} style={billStyle}>
              <p><strong>Customer:</strong> {bill.customer?.name}</p>
              <p>Total: ₹{bill.totalAmount}</p>
              <p>Paid: ₹{bill.paidAmount}</p>
              <p>Remaining: ₹{bill.remainingAmount}</p>
            </div>
          ))
        ) : (
          <p>No recent bills</p>
        )}
      </div>

      {/* 🔴 LOW STOCK PRODUCTS */}
      <div style={{ marginTop: "30px" }}>
        <h3>Low Stock Products</h3>

        {summary.lowStockProducts?.length > 0 ? (
          summary.lowStockProducts.map((p, index) => (
            <p key={index}>
              {p.name} — {p.quantity} {p.unit}
            </p>
          ))
        ) : (
          <p>No low stock items 🎉</p>
        )}
      </div>
    </div>
  );
}

// 🎨 styles
const cardStyle = {
  border: "1px solid #ddd",
  padding: "15px",
  borderRadius: "8px",
  minWidth: "150px",
  textAlign: "center",
};

const billStyle = {
  border: "1px solid gray",
  margin: "10px 0",
  padding: "10px",
  borderRadius: "5px",
};

export default Dashboard;