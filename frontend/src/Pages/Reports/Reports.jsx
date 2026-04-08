import { useEffect, useState } from "react";
import {
  getSummaryReport,
  getSalesReport,
  getProfitReport,
  getSalesTrend,
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

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

import "./Reports.css";

function Reports() {
  const [report, setReport] = useState(null);
  const [sales, setSales] = useState(null);
  const [profit, setProfit] = useState(null);
  const [trend, setTrend] = useState([]);

  const [filter, setFilter] = useState("daily");

  useEffect(() => {
    fetchReport();
  }, [filter]);

  const fetchReport = async () => {
    const summaryData = await getSummaryReport();
    const salesData = await getSalesReport();
    const profitData = await getProfitReport();
    const trendData = await getSalesTrend(filter);

    setReport(summaryData);
    setSales(salesData);
    setProfit(profitData);
    setTrend(trendData);
  };

  if (!report || !sales || !profit) return <p>Loading...</p>;

  const salesTrendData = trend.map((item) => ({
    date: item._id,
    sales: item.totalSales,
  }));

  const topProductsChartData = sales.topProducts.map((p) => ({
    name: p.name,
    quantity: p.quantity,
  }));

  const downloadExcel = () => {
    if (!report || !sales || !profit) {
      alert("Data not loaded yet");
      return;
    }

    const summaryData = [
      {
        "Total Sales": report.totalSales,
        "Total Bills": report.totalBills,
        "Total Products": report.totalProducts,
        "Low Stock": report.lowStockCount,
        "Total Profit": profit.totalProfit,
      },
    ];

    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    const trendSheetData = trend.map((t) => ({
      Date: t._id,
      Sales: t.totalSales,
    }));

    const trendSheet = XLSX.utils.json_to_sheet(trendSheetData);


    const productSheetData = sales.topProducts.map((p) => ({
      Name: p.name,
      Quantity: p.quantity,
    }));

    const productSheet = XLSX.utils.json_to_sheet(productSheetData);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");
    XLSX.utils.book_append_sheet(workbook, trendSheet, "Sales Trend");
    XLSX.utils.book_append_sheet(workbook, productSheet, "Top Products");

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
    <div className="reports-container">
      <h2>Reports Dashboard</h2>


      <div style={{ marginBottom: "20px" }}>
        <label>Filter: </label>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="daily">Daily</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </select>

        <button
          onClick={downloadExcel}
          style={{
            marginLeft: "10px",
            padding: "6px 12px",
            backgroundColor: "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Download Excel
        </button>
      </div>

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

      <div className="cards" style={{ marginTop: "20px" }}>
        <div className="card">
          <h3>Total Transactions</h3>
          <p>{sales.totalTransactions}</p>
        </div>
      </div>

      <div style={{ marginTop: "30px" }}>
        <h3>Sales Trend ({filter})</h3>

        <LineChart width={500} height={250} data={salesTrendData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="sales" />
        </LineChart>
      </div>

      <div style={{ marginTop: "30px" }}>
        <h3>Top Products</h3>

        <BarChart width={500} height={250} data={topProductsChartData}>
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