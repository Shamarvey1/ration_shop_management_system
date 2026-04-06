import { useEffect, useState } from "react";
import {
  getSummaryReport,
  getSalesReport,
} from "../../services/reportService";
import "./Reports.css";

function Reports() {
  const [report, setReport] = useState(null);
  const [sales, setSales] = useState(null);

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    const summaryData = await getSummaryReport();
    const salesData = await getSalesReport();

    console.log("Summary:", summaryData);
    console.log("Sales:", salesData);

    setReport(summaryData);
    setSales(salesData);
  };

  if (!report || !sales) return <p>Loading...</p>;

  return (
    <div className="reports-container">
      <h2>Reports Dashboard</h2>

      {/* 🟢 SUMMARY CARDS */}
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
      </div>

      {/* 🟡 SALES ANALYTICS */}
      <div className="cards" style={{ marginTop: "20px" }}>
        <div className="card">
          <h3>Total Transactions</h3>
          <p>{sales.totalTransactions}</p>
        </div>
      </div>

      {/* 🔵 TOP PRODUCTS */}
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