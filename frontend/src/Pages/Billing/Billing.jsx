import { useEffect, useState } from "react";
import {
  createBill,
  getBills,
  getFilteredBills
} from "../../services/billingService";
import { getProducts } from "../../services/productService";
import { searchCustomers } from "../../services/customerService";
import "./Billing.css";
import { ShoppingCart } from "lucide-react";

function Billing() {
  const [products, setProducts] = useState([]);
  const [bills, setBills] = useState([]);

  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [showCustomerWarning, setShowCustomerWarning] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerResults, setShowCustomerResults] = useState(false);
  const [customerResults, setCustomerResults] = useState([]);
  const [isCustomerSearchLoading, setIsCustomerSearchLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [paidAmount, setPaidAmount] = useState("");
  const [showPaidAmountWarning, setShowPaidAmountWarning] = useState(false);
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
      alert("Paid Amount must be 0 or greater");
      return;
    }

    setShowPaidAmountWarning(false);

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
      setShowAddProductWarning(false);
      setShowAddProductButtonWarning(false);
      setSelectedCustomer("");
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
              className={`billing-paid-amount-input ${items.length > 0 && !showPaidAmountWarning ? "billing-paid-input-active" : ""} ${showPaidAmountWarning ? "billing-paid-amount-warning" : ""}`}
              type="number"
              min="0"
              required
              placeholder="Paid Amount"
              value={paidAmount}
              onChange={(e) => {
                const value = e.target.value;
                if (value === "") {
                  setPaidAmount("");
                  return;
                }

                setShowPaidAmountWarning(false);

                if (items.length === 0) {
                  if (!showAddProductWarning) {
                    alert("Please add at least one product before entering Paid Amount.");
                  }
                  setShowAddProductWarning(true);
                  setShowAddProductButtonWarning(true);
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
                  setPaidAmount("");
                  return;
                }

                setShowAddProductWarning(false);
                setShowAddProductButtonWarning(false);

                setPaidAmount(String(Math.max(0, Number(value))));
              }}
            />

            <div className="billing-summary-row">
              <p className="billing-summary-item">
                <span className="billing-summary-label">Total</span>
                <span className="billing-summary-value">₹{calculateTotal()}</span>
              </p>
              <p className="billing-summary-item">
                <span className="billing-summary-label">Paid</span>
                <span className="billing-summary-value">₹{paidAmount || 0}</span>
              </p>
              <p className="billing-summary-item billing-summary-remaining">
                <span className="billing-summary-label">Remaining</span>
                <span className="billing-summary-value">
                  ₹{calculateTotal() - (paidAmount || 0)}
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
            {bills.map((bill) => (
              <div key={bill._id} className="billing-card">
                <p className="billing-card-customer-row">
                  <span>
                    <strong>Customer:</strong>{" "}
                    {bill.customer?.name || bill.customerName}
                  </span>
                  <span className="billing-card-customer-phone">
                  Phone no: {bill.customer?.phone || ""}
                  </span>
                </p>

                {bill.items.map((item, i) => (
                  <div key={i}>
                    {item.product?.name} — {item.quantity} × ₹{item.price}
                  </div>
                ))}

                <p>Total: ₹{bill.totalAmount}</p>
                <p>Paid: ₹{bill.paidAmount}</p>
                <p>
                  Remaining: <span className="billing-remaining-value">₹{bill.remainingAmount}</span>
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default Billing;