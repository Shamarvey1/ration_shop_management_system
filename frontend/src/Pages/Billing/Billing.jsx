import { useEffect, useState } from "react";
import {
  createBill,
  getBills,
  getFilteredBills
} from "../../services/billingService";
import { getProducts } from "../../services/productService";
import { searchCustomers } from "../../services/customerService";
import "./Billing.css";
import { ShoppingCart, FileText } from "lucide-react";

function Billing() {
  const [products, setProducts] = useState([]);
  const [bills, setBills] = useState([]);

  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [selectedCustomerDebt, setSelectedCustomerDebt] = useState(0);
  const [showCustomerWarning, setShowCustomerWarning] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerResults, setShowCustomerResults] = useState(false);
  const [customerResults, setCustomerResults] = useState([]);
  const [isCustomerSearchLoading, setIsCustomerSearchLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [paidAmount, setPaidAmount] = useState("");
  const [showPaidAmountWarning, setShowPaidAmountWarning] = useState(false);
  const [showOverpaidWarning, setShowOverpaidWarning] = useState(false);
  const [showAddProductWarning, setShowAddProductWarning] = useState(false);
  const [showAddProductButtonWarning, setShowAddProductButtonWarning] = useState(false);

  const [filterCustomer, setFilterCustomer] = useState("");
  const [filterCustomerSearch, setFilterCustomerSearch] = useState("");
  const [showFilterCustomerResults, setShowFilterCustomerResults] = useState(false);
  const [filterCustomerResults, setFilterCustomerResults] = useState([]);
  const [isFilterCustomerSearchLoading, setIsFilterCustomerSearchLoading] = useState(false);
  const [filterDate, setFilterDate] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const prod = await getProducts();
    const billData = await getBills();

    setProducts(prod);
    setBills(billData);
  };

  const addItem = () => {
    setShowAddProductWarning(false);
    setShowAddProductButtonWarning(false);
    setItems([...items, { product: "", quantity: 1 }]);
  };

  const removeItem = (index) => {
    const updated = items.filter((_, i) => i !== index);
    setItems(updated);
  };

  const updateItem = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);

    if (field === "product" && value) {
      setShowAddProductWarning(false);
      setShowAddProductButtonWarning(false);
    }
  };

  const calculateTotal = () => {
    let total = 0;

    items.forEach((item) => {
      const product = products.find((p) => p._id === item.product);
      if (product) {
        total += product.price * item.quantity;
      }
    });

    return total;
  };

  const customerSearchQuery = customerSearch.trim();
  const filterCustomerSearchQuery = filterCustomerSearch.trim();

  useEffect(() => {
    let isCancelled = false;

    if (!customerSearchQuery) {
      setCustomerResults([]);
      setIsCustomerSearchLoading(false);
      return;
    }

    const timerId = setTimeout(async () => {
      setIsCustomerSearchLoading(true);
      const data = await searchCustomers(customerSearchQuery);

      if (!isCancelled) {
        setCustomerResults(Array.isArray(data) ? data : []);
        setIsCustomerSearchLoading(false);
      }
    }, 250);

    return () => {
      isCancelled = true;
      clearTimeout(timerId);
    };
  }, [customerSearchQuery]);

  useEffect(() => {
    let isCancelled = false;

    if (!filterCustomerSearchQuery) {
      setFilterCustomerResults([]);
      setIsFilterCustomerSearchLoading(false);
      return;
    }

    const timerId = setTimeout(async () => {
      setIsFilterCustomerSearchLoading(true);
      const data = await searchCustomers(filterCustomerSearchQuery);

      if (!isCancelled) {
        setFilterCustomerResults(Array.isArray(data) ? data : []);
        setIsFilterCustomerSearchLoading(false);
      }
    }, 250);

    return () => {
      isCancelled = true;
      clearTimeout(timerId);
    };
  }, [filterCustomerSearchQuery]);

  const handleCustomerPick = (customer) => {
    setSelectedCustomer(customer._id);
    setSelectedCustomerDebt(Number(customer.debt) || 0);
    setShowCustomerWarning(false);
    setCustomerSearch(`${customer.name} (${customer.phone || "No phone"})`);
    setShowCustomerResults(false);
  };

  const handleFilterCustomerPick = (customer) => {
    setFilterCustomer(customer._id);
    setFilterCustomerSearch(`${customer.name} (${customer.phone || "No phone"})`);
    setShowFilterCustomerResults(false);
  };

  const handleCreateBill = async (e) => {
    e.preventDefault();

    if (!selectedCustomer) {
      setShowCustomerWarning(true);
      setShowCustomerResults(true);
      alert("Please select a customer");
      return;
    }

    const hasProductRows = items.length > 0;
    const hasSelectedProduct = items.some((item) => item.product);

    if (!hasProductRows) {
      setShowPaidAmountWarning(false);
      setShowAddProductWarning(true);
      setShowAddProductButtonWarning(true);
      alert("Please add at least one product row");
      return;
    }

    if (!hasSelectedProduct) {
      setShowPaidAmountWarning(false);
      setShowAddProductWarning(true);
      setShowAddProductButtonWarning(false);
      alert("Please select at least one product");
      return;
    }

    setShowAddProductWarning(false);
    setShowAddProductButtonWarning(false);

    if (paidAmount.trim() === "") {
      setShowAddProductWarning(false);
      setShowPaidAmountWarning(true);
      alert("Please enter Paid Amount");
      return;
    }

    const numericPaidAmount = Number(paidAmount);
    if (Number.isNaN(numericPaidAmount) || numericPaidAmount < 0) {
      setShowPaidAmountWarning(true);
      setShowOverpaidWarning(false);
      alert("Paid Amount must be 0 or greater");
      return;
    }

    const totalDueAmount = selectedCustomerDebt + totalAmount;
    if (numericPaidAmount > totalDueAmount) {
      setShowPaidAmountWarning(false);
      setShowOverpaidWarning(true);
      alert(`Paid Amount cannot be greater than total due (₹${totalDueAmount}).`);
      return;
    }

    setShowPaidAmountWarning(false);
    setShowOverpaidWarning(false);

    const billData = {
      customer: selectedCustomer,
      items,
      paidAmount: numericPaidAmount,
    };

    try {
      await createBill(billData);

      setItems([]);
      setPaidAmount("");
      setShowPaidAmountWarning(false);
      setShowOverpaidWarning(false);
      setShowAddProductWarning(false);
      setShowAddProductButtonWarning(false);
      setSelectedCustomer("");
      setSelectedCustomerDebt(0);
      setShowCustomerWarning(false);
      setCustomerSearch("");
      setCustomerResults([]);

      fetchData();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleFilter = async () => {
    const data = await getFilteredBills(filterCustomer, filterDate);
    setBills(data);
  };

  const escapeHtml = (value) => {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  };

  const formatMoney = (value) => {
    return `₹${Number(value || 0).toFixed(2)}`;
  };

  const handleGenerateInvoice = (bill) => {
    const customerName = escapeHtml(bill.customer?.name || bill.customerName || "Customer");
    const customerPhone = escapeHtml(bill.customer?.phone || "-");
    const invoiceNumber = escapeHtml((bill._id || "").slice(-8).toUpperCase());
    const invoiceDate = new Date(bill.createdAt || Date.now()).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });

    const itemsRows = (bill.items || [])
      .map((item, index) => {
        const productName = escapeHtml(item.product?.name || "Item");
        const quantity = Number(item.quantity || 0);
        const price = Number(item.price || 0);
        const lineTotal = quantity * price;

        return `
          <tr>
            <td>${index + 1}</td>
            <td>${productName}</td>
            <td>${quantity}</td>
            <td>${formatMoney(price)}</td>
            <td>${formatMoney(lineTotal)}</td>
          </tr>
        `;
      })
      .join("");

    const currentBillPending = bill.currentBillPending ?? Math.max(0, Number(bill.totalAmount || 0) - Number(bill.paidAmount || 0));

    const invoiceHtml = `
      <!doctype html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Invoice ${invoiceNumber}</title>
          <style>
            * { box-sizing: border-box; }
            body {
              margin: 0;
              font-family: Arial, sans-serif;
              background: #fff;
              color: #111827;
              padding: 0;
            }
            .invoice {
              max-width: 880px;
              margin: 0 auto;
              background: #fff;
              border: 0;
              border-radius: 0;
              padding: 20px;
            }
            .header {
              display: flex;
              justify-content: space-between;
              gap: 12px;
              border-bottom: 1px solid #e5e7eb;
              padding-bottom: 12px;
              margin-bottom: 16px;
            }
            .title {
              margin: 0 0 4px;
              font-size: 24px;
              font-weight: 800;
            }
            .muted { color: #4b5563; margin: 2px 0; }
            .meta { text-align: right; }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 8px;
            }
            th, td {
              border: 1px solid #e5e7eb;
              padding: 10px;
              text-align: left;
              font-size: 14px;
            }
            th {
              background: #f3f4f6;
              font-weight: 700;
            }
            .totals {
              margin-top: 18px;
              display: grid;
              grid-template-columns: repeat(2, minmax(0, 1fr));
              gap: 10px;
            }
            .total-row {
              border: 1px solid #e5e7eb;
              border-radius: 10px;
              padding: 10px;
              display: flex;
              justify-content: space-between;
              gap: 12px;
            }
            .total-pending {
              color: #b91c1c;
              font-weight: 700;
            }
            @media print {
              body { background: #fff; padding: 0; }
              .invoice {
                border: 0;
                border-radius: 0;
                max-width: 100%;
                margin: 0;
                padding: 10mm;
              }
            }
          </style>
        </head>
        <body>
          <section class="invoice">
            <header class="header">
              <div>
                <h1 class="title">Invoice</h1>
                <p class="muted">Ration Management System</p>
                <p class="muted">Customer: ${customerName}</p>
                <p class="muted">Phone: ${customerPhone}</p>
              </div>
              <div class="meta">
                <p class="muted"><strong>Invoice No:</strong> ${invoiceNumber}</p>
                <p class="muted"><strong>Date:</strong> ${escapeHtml(invoiceDate)}</p>
              </div>
            </header>

            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${itemsRows || `<tr><td colspan="5">No items</td></tr>`}
              </tbody>
            </table>

            <div class="totals">
              <div class="total-row"><span>Total Bill</span><strong>${formatMoney(bill.totalAmount)}</strong></div>
              <div class="total-row"><span>Paid</span><strong>${formatMoney(bill.paidAmount)}</strong></div>
              <div class="total-row"><span>Previous Pending</span><strong>${formatMoney(bill.previousPending)}</strong></div>
              <div class="total-row"><span>Pending Paid</span><strong>${formatMoney(bill.pendingPaid)}</strong></div>
              <div class="total-row"><span>Current Bill Pending</span><strong>${formatMoney(currentBillPending)}</strong></div>
              <div class="total-row total-pending"><span>Total Pending</span><strong>${formatMoney(bill.remainingAmount)}</strong></div>
            </div>
          </section>
        </body>
      </html>
    `;

    const printFrame = document.createElement("iframe");
    printFrame.style.position = "fixed";
    printFrame.style.right = "0";
    printFrame.style.bottom = "0";
    printFrame.style.width = "0";
    printFrame.style.height = "0";
    printFrame.style.border = "0";
    printFrame.style.visibility = "hidden";
    document.body.appendChild(printFrame);

    const frameWindow = printFrame.contentWindow;

    if (!frameWindow) {
      document.body.removeChild(printFrame);
      alert("Unable to generate invoice right now. Please try again.");
      return;
    }

    const cleanup = () => {
      setTimeout(() => {
        if (document.body.contains(printFrame)) {
          document.body.removeChild(printFrame);
        }
      }, 250);
    };

    frameWindow.onafterprint = cleanup;
    frameWindow.document.open();
    frameWindow.document.write(invoiceHtml);
    frameWindow.document.close();

    setTimeout(() => {
      frameWindow.focus();
      frameWindow.print();
    }, 150);
  };

  const totalAmount = calculateTotal();
  const numericPaidAmount = Number(paidAmount) || 0;
  const totalDueAmount = selectedCustomerDebt + totalAmount;
  const isOverpaidAmount = paidAmount !== "" && numericPaidAmount > totalDueAmount;
  const previewPendingPaid = Math.min(
    selectedCustomerDebt,
    Math.max(0, numericPaidAmount - totalAmount)
  );

  return (
    <div className="billing-page">
      <div className="billing-header">
        <div>
          <h2 className="billing-title">Billing</h2>
          <p className="billing-description">
            Create bills, manage payments, and review all invoices in one place.
          </p>
        </div>
      </div>

      <div className="billing-panels">
        <section className="billing-section billing-form-section">
          <h3 className="billing-section-title">Create Bill</h3>

          <form className="billing-form" onSubmit={handleCreateBill} noValidate>
            <div className="billing-customer-search">
              <input
                className={`billing-customer-search-input ${selectedCustomer ? "billing-customer-select-selected" : ""} ${showCustomerWarning ? "billing-customer-search-warning" : ""}`}
                type="text"
                placeholder="Search Customer by name or phone"
                value={customerSearch}
                onChange={(e) => {
                  setCustomerSearch(e.target.value);
                  setSelectedCustomer("");
                  setSelectedCustomerDebt(0);
                  setShowCustomerWarning(false);
                  setShowCustomerResults(true);
                }}
                onFocus={() => {
                  setShowCustomerWarning(false);
                  setShowCustomerResults(true);
                }}
                onBlur={() => {
                  setTimeout(() => setShowCustomerResults(false), 150);
                }}
              />

              {showCustomerResults && customerSearchQuery && (
                <div className="billing-customer-results" role="listbox">
                  {isCustomerSearchLoading ? (
                    <p className="billing-customer-result-empty">Searching...</p>
                  ) : customerResults.length > 0 ? (
                    customerResults.map((customer) => (
                      <button
                        key={customer._id}
                        type="button"
                        className="billing-customer-result-item"
                        onMouseDown={() => handleCustomerPick(customer)}
                      >
                        <span className="billing-customer-result-name">{customer.name}</span>
                        <span className="billing-customer-result-phone">{customer.phone || "No phone"}</span>
                      </button>
                    ))
                  ) : (
                    <p className="billing-customer-result-empty">No customer found</p>
                  )}
                </div>
              )}
            </div>

            <div className={`billing-products-scroll ${showAddProductButtonWarning ? "billing-products-scroll-warning" : ""}`}>
              {items.length === 0 && (
                <p className="billing-products-empty">
                  <span className="billing-products-empty-icon" aria-hidden="true">
                    <ShoppingCart size={16} strokeWidth={2.4} />
                  </span>
                  <span>No products added yet. Click Add Product to start building this bill.</span>
                </p>
              )}

              {items.map((item, index) => {
                const product = products.find((p) => p._id === item.product);
                const subtotal = product ? product.price * item.quantity : 0;

                return (
                  <div key={index} className="billing-item-row">
                    <select
                      className={showAddProductWarning && !item.product ? "billing-product-select-warning" : ""}
                      value={item.product}
                      onChange={(e) =>
                        updateItem(index, "product", e.target.value)
                      }
                    >
                      <option value="">Select Product</option>
                      {products.map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.name} (₹{p.price})
                        </option>
                      ))}
                    </select>

                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(
                          index,
                          "quantity",
                          Math.max(1, Number(e.target.value))
                        )
                      }
                    />

                    <span className="billing-subtotal">₹{subtotal}</span>

                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="billing-remove-btn"
                    >
                      Remove
                    </button>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={addItem}
              className={`billing-add-product-btn ${showAddProductButtonWarning ? "billing-add-product-btn-warning" : ""}`}
            >
              Add Product
            </button>

            <input
              className={`billing-paid-amount-input ${items.length > 0 && !showPaidAmountWarning && !showOverpaidWarning && !isOverpaidAmount ? "billing-paid-input-active" : ""} ${(showPaidAmountWarning || showOverpaidWarning || isOverpaidAmount) ? "billing-paid-amount-warning" : ""}`}
              type="number"
              min="0"
              required
              placeholder="Paid Amount"
              value={paidAmount}
              onChange={(e) => {
                const value = e.target.value;
                if (value === "") {
                  setPaidAmount("");
                  setShowOverpaidWarning(false);
                  return;
                }

                setShowPaidAmountWarning(false);
                setShowOverpaidWarning(false);

                if (items.length === 0) {
                  if (!showAddProductWarning) {
                    alert("Please add at least one product before entering Paid Amount.");
                  }
                  setShowAddProductWarning(true);
                  setShowAddProductButtonWarning(true);
                  setShowOverpaidWarning(false);
                  setPaidAmount("");
                  return;
                }

                const hasSelectedProduct = items.some((item) => item.product);
                if (!hasSelectedProduct) {
                  if (!showAddProductWarning) {
                    alert("Please select at least one product before entering Paid Amount.");
                  }
                  setShowAddProductWarning(true);
                  setShowAddProductButtonWarning(false);
                  setShowOverpaidWarning(false);
                  setPaidAmount("");
                  return;
                }

                setShowAddProductWarning(false);
                setShowAddProductButtonWarning(false);

                const nextPaidAmount = Math.max(0, Number(value));
                setPaidAmount(String(nextPaidAmount));

                const nextTotalDueAmount = selectedCustomerDebt + totalAmount;
                setShowOverpaidWarning(nextPaidAmount > nextTotalDueAmount);
              }}
            />

            <div className="billing-summary-row">
              <p className="billing-summary-item">
                <span className="billing-summary-label">Total Bill</span>
                <span className="billing-summary-value">₹{totalAmount}</span>
              </p>
              <p className={`billing-summary-item ${selectedCustomerDebt > 0 ? "billing-summary-item-pending-active" : ""}`}>
                <span className="billing-summary-label">Pending</span>
                <span className={`billing-summary-value ${selectedCustomerDebt > 0 ? "billing-value-pending" : ""}`}>
                  ₹{selectedCustomerDebt}
                </span>
              </p>
              <p className={`billing-summary-item ${previewPendingPaid > 0 ? "billing-summary-item-paid-active" : ""}`}>
                <span className="billing-summary-label">Pending Paid</span>
                <span className={`billing-summary-value ${previewPendingPaid > 0 ? "billing-value-paid" : ""}`}>
                  ₹{previewPendingPaid}
                </span>
              </p>
            </div>

            <button type="submit" className="billing-create-btn">Create Bill</button>
          </form>
        </section>

        <section className="billing-section billing-list-section">
          <h3 className="billing-section-title">All Bills</h3>

          <div className="billing-filter-bar">
            <div className="billing-customer-search billing-filter-customer-search">
              <input
                className="billing-customer-search-input"
                type="text"
                placeholder="customer by name or phone"
                value={filterCustomerSearch}
                onChange={(e) => {
                  setFilterCustomerSearch(e.target.value);
                  setFilterCustomer("");
                  setShowFilterCustomerResults(true);
                }}
                onFocus={() => setShowFilterCustomerResults(true)}
                onBlur={() => {
                  setTimeout(() => setShowFilterCustomerResults(false), 150);
                }}
              />

              {showFilterCustomerResults && filterCustomerSearchQuery && (
                <div className="billing-customer-results" role="listbox">
                  {isFilterCustomerSearchLoading ? (
                    <p className="billing-customer-result-empty">Searching...</p>
                  ) : filterCustomerResults.length > 0 ? (
                    filterCustomerResults.map((customer) => (
                      <button
                        key={customer._id}
                        type="button"
                        className="billing-customer-result-item"
                        onMouseDown={() => handleFilterCustomerPick(customer)}
                      >
                        <span className="billing-customer-result-name">{customer.name}</span>
                        <span className="billing-customer-result-phone">{customer.phone || "No phone"}</span>
                      </button>
                    ))
                  ) : (
                    <p className="billing-customer-result-empty">No customer found</p>
                  )}
                </div>
              )}
            </div>

            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />

            <button onClick={handleFilter}>Search</button>

            <button
              onClick={() => {
                setFilterCustomer("");
                setFilterCustomerSearch("");
                setFilterCustomerResults([]);
                setShowFilterCustomerResults(false);
                setFilterDate("");
                fetchData();
              }}
            >
              Reset
            </button>
          </div>

          <div className="billing-list">
            {bills.map((bill) => {
              const isPaid = bill.remainingAmount === 0;
              return (
              <div key={bill._id} className="billing-card">
                <div className="billing-card-top">
                  <div className="billing-card-header">
                    <div>
                      <div className="billing-card-invoice-id">Invoice #{(bill._id || "").slice(-6).toUpperCase()}</div>
                      <p className="billing-card-customer-name">{bill.customer?.name || bill.customerName}</p>
                      <p className="billing-card-meta">Phone: {bill.customer?.phone || "-"}</p>
                    </div>
                    <div className="billing-card-status-section">
                      <div className={`billing-status-badge ${isPaid ? "billing-status-paid" : "billing-status-pending"}`}>
                        {isPaid ? "✓ Paid" : "⚠ Pending"}
                      </div>
                      <div className="billing-card-date">
                        Date: {new Date(bill.createdAt || Date.now()).toLocaleDateString("en-IN", { dateStyle: "short" })}
                      </div>
                    </div>
                  </div>

                  <div className="billing-card-items">
                    {bill.items.map((item, i) => (
                      <div key={i} className="billing-card-item-row">
                        <span className="billing-item-name">{item.product?.name || "Item"}</span>
                        <span className="billing-item-detail">{item.quantity} × ₹{item.price}</span>
                        <span className="billing-item-total">₹{item.quantity * item.price}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="billing-card-summary">
                  <div className="billing-summary-grid">
                    <div className="billing-summary-cell">
                      <span className="billing-cell-label">Total Bill</span>
                      <span className="billing-cell-value">₹{bill.totalAmount}</span>
                    </div>
                    <div className="billing-summary-cell">
                      <span className="billing-cell-label">Paid</span>
                      <span className="billing-cell-value billing-value-paid">₹{bill.paidAmount}</span>
                    </div>
                    <div className={`billing-summary-cell ${isPaid ? "billing-summary-cell-complete" : "billing-summary-cell-highlight"}`}>
                      <span className="billing-cell-label">Total Due</span>
                      <span className={`billing-cell-value ${isPaid ? "" : "billing-remaining-value"}`}>₹{bill.remainingAmount}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="billing-invoice-btn"
                  onClick={() => handleGenerateInvoice(bill)}
                >
                  <FileText size={18} style={{ marginRight: "8px", display: "inline" }} />
                  Generate Invoice
                </button>
              </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}

export default Billing;