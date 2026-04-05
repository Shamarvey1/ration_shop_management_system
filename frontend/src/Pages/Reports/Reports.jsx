import { useEffect, useState } from "react";
import { getSummaryReport } from "../../services/reportService";
import "./Reports.css";

function Reports() {
  const [report, setReport] = useState(null);

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    const data = await getSummaryReport();
    console.log("Report Data:", data);
    setReport(data);
  };

  if (!report) return <p>Loading...</p>;

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

      </div>
    </div>
  );
}

export default Reports;