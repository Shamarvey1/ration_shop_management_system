import { useEffect, useState } from "react";
import {
  getSummaryReport,
  getSalesReport,
  getProfitReport,
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
} from "recharts";
import "./Reports.css";

function Reports() {
  const [report, setReport] = useState(null);
  const [sales, setSales] = useState(null);
  const [profit, setProfit] = useState(null);

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    const summaryData = await getSummaryReport();
    const salesData = await getSalesReport();
    const profitData = await getProfitReport();

    setReport(summaryData);
    setSales(salesData);
    setProfit(profitData);
  };

  if (!report || !sales || !profit) return <p>Loading...</p>;

  const salesTrendData = [
    { name: "Sales", value: report.totalSales },
  ];

  const topProductsData = sales.topProducts.map((p) => ({
    name: p.name,
    quantity: p.quantity,
  }));

  return (
    <div className="reports-container">
      <h2>Reports Dashboard</h2>

      <div className="cards">
        <div className="card">
          <h3>Total Sales</h3>
          <p>₹{report.totalSales}</p>
        </div>

        <div className="card">
          <h3>Total Bills</h3>
          <p>{report.totalBills}</p>
        </div>

        <div className="card">
          <h3>Total Products</h3>
          <p>{report.totalProducts}</p>
        </div>

        <div className="card">
          <h3>Low Stock</h3>
          <p>{report.lowStockCount}</p>
        </div>

        <div className="card">
          <h3>Total Profit</h3>
          <p>₹{profit.totalProfit}</p>
        </div>
      </div>

      {/* 🟡 SALES ANALYTICS */}
      <div className="cards" style={{ marginTop: "20px" }}>
        <div className="card">
          <h3>Total Transactions</h3>
          <p>{sales.totalTransactions}</p>
        </div>
      </div>

      <div style={{ marginTop: "30px" }}>
        <h3>Sales Overview</h3>
        <LineChart width={400} height={250} data={salesTrendData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="value" />
        </LineChart>
      </div>

      {/* 📊 BAR CHART */}
      <div style={{ marginTop: "30px" }}>
        <h3>Top Products</h3>
        <BarChart width={400} height={250} data={topProductsData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="quantity" />
        </BarChart>
      </div>

      <div style={{ marginTop: "20px" }}>
        <h3>Top Selling Products</h3>

        {sales.topProducts.length > 0 ? (
          sales.topProducts.map((p, index) => (
            <p key={index}>
              {p.name} — {p.quantity} units
            </p>
          ))
        ) : (
          <p>No sales data</p>
        )}
      </div>
    </div>
  );
}

export default Reports;