import { useEffect, useState } from "react";
import {
  getCustomers,
  addCustomer,
  deleteCustomer,
  getCustomerDetails,
} from "../../services/customerService";
import "./Customers.css";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { Skeleton } from "../../components/Skeleton/Skeleton";

function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerDetails, setCustomerDetails] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const data = await getCustomers();
      setCustomers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Fetch error:", error);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleAddCustomer = async (e) => {
    e.preventDefault();

    await addCustomer({ name, phone, address });

    setName("");
    setPhone("");
    setAddress("");
    setShowModal(false);

    fetchCustomers();
  };

  const handleDelete = async (id) => {
    await deleteCustomer(id);
    fetchCustomers();
    setSelectedCustomer(null);
    setCustomerDetails(null);
  };

  const sortedCustomers = [...customers].sort((a, b) => b.debt - a.debt);
  const filteredCustomers = sortedCustomers.filter((customer) =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const downloadExcel = () => {
    const data = customers.map((c) => ({
      Name: c.name,
      Phone: c.phone,
      Address: c.address || "N/A",
      Debt: c.debt || 0,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Customers");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const fileData = new Blob([excelBuffer], {
      type:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(fileData, "customers.xlsx");
  };

  return (
    <div className="customers-container">
      <div className="customers-header">
        <div>
          <h2>Customers</h2>
          <p>Manage customer information and track credit</p>
        </div>
        <div className="customers-actions">
          <button className="btn-export" type="button" onClick={downloadExcel}>
            Export Excel
          </button>
          <button className="btn-add-customer" onClick={() => setShowModal(true)}>
            + Add Customer
          </button>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New Customer</h3>
              <button
                className="modal-close"
                onClick={() => setShowModal(false)}
              >
                ✕
              </button>
            </div>

            <p className="modal-description">
              Enter customer details to add them to your records.
            </p>

            <form onSubmit={handleAddCustomer} className="modal-form">
              <div className="form-group">
                <label>Customer Name</label>
                <input
                  type="text"
                  placeholder="Enter customer name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="text"
                  placeholder="+91 XXXXX XXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Address (Optional)</label>
                <input
                  type="text"
                  placeholder="Enter address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              <button type="submit" className="btn-add">
                Add Customer
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="customer-layout">
        <div className="customer-list">
          <div className="customer-search">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search customer by name..."
            />
          </div>

          <div className="customer-list-header">
            <span>Name</span>
            <span>Phone</span>
            <span>Pending Dues</span>
            <span>Profile</span>
          </div>

          <div className="customer-list-body">
            {loading ? (
              Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="customer-row">
                  <div
                    className="customer-row-main"
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr",
                      width: "100%",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <Skeleton width="110px" height="15px" />
                    <Skeleton width="100px" height="14px" />
                    <Skeleton width="60px" height="18px" borderRadius="10px" />
                  </div>
                  <Skeleton width="48px" height="28px" borderRadius="6px" />
                </div>
              ))
            ) : filteredCustomers.length > 0 ? (
              filteredCustomers.map((customer) => (
                <div
                  key={customer._id}
                  className={`customer-row ${
                    selectedCustomer?._id === customer._id ? "active" : ""
                  }`}
                >
                  <div
                    className="customer-row-main"
                    onClick={async () => {
                      setSelectedCustomer(customer);

                      const data = await getCustomerDetails(customer._id);
                      setCustomerDetails(data);
                    }}
                  >
                    <p>{customer.name}</p>
                    <p>{customer.phone}</p>
                    <p>₹{customer.debt || 0}</p>
                  </div>
                  <button
                    type="button"
                    className="view-button"
                    onClick={async () => {
                      setSelectedCustomer(customer);

                      const data = await getCustomerDetails(customer._id);
                      setCustomerDetails(data);
                    }}
                  >
                    View
                  </button>
                </div>
              ))
            ) : (
              <p className="no-results">No customer found</p>
            )}
          </div>
        </div>
        <div className="customer-profile">
          {loading ? (
            <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <Skeleton width="180px" height="26px" />
              <Skeleton width="140px" height="18px" />
              <Skeleton width="220px" height="14px" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "12px" }}>
                <Skeleton width="100%" height="80px" borderRadius="12px" />
                <Skeleton width="100%" height="80px" borderRadius="12px" />
              </div>
              <Skeleton width="100%" height="160px" borderRadius="12px" style={{ marginTop: "12px" }} />
            </div>
          ) : selectedCustomer ? (
            <>
              <div className="profile-main">
                <div>
                  <h2>Customer Profile</h2>
                  <h3>{selectedCustomer.name}</h3>
                  <p className="profile-phone">Phone: {selectedCustomer.phone}</p>
                  <p className="profile-address">Address: {selectedCustomer.address || customerDetails?.customer?.address || "N/A"}</p>

                  <div className="profile-stats">
                    <div className="stat-card">
                      <h4>Total Purchases</h4>
                      <p className="stat-value">
                        ₹{customerDetails?.totalPurchase || 0}
                      </p>
                      <p className="stat-label">{customerDetails?.totalBills || 0} transactions</p>
                    </div>

                    <div className="stat-card">
                      <h4>Pending Dues</h4>
                      <p className="stat-value pending">
                        ₹{selectedCustomer.debt || 0}
                      </p>
                      <p className="stat-label">
                        Credit limit: ₹5,000
                      </p>
                    </div>
                  </div>

                  <div className="purchase-history">
                    <div className="purchase-history-header">
                      <h4>Payment History</h4>
                      <p>{customerDetails?.totalBills || 0} transactions</p>
                    </div>

                    {customerDetails?.bills?.length > 0 ? (
                      <div className="history-table">
                        <div className="history-row history-title-row">
                          <span>Date</span>
                          <span>Amount</span>
                          <span>Paid</span>
                          <span>Remaining</span>
                        </div>
                        {customerDetails.bills
                          .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
                          .map((bill) => (
                          <div key={bill._id} className="history-row">
                            <span>{new Date(bill.createdAt).toLocaleDateString()}</span>
                            <span>₹{bill.totalAmount}</span>
                            <span>₹{bill.paidAmount}</span>
                            <span>₹{bill.remainingAmount}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p>No payment history yet</p>
                    )}
                  </div>
                </div>
              </div>

              <button
                className="btn-delete"
                onClick={() => handleDelete(selectedCustomer._id)}
              >
                Delete Customer
              </button>
            </>
          ) : (
            <p className="no-selection">Select a customer to view details</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Customers;