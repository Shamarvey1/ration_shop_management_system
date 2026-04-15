import { useEffect, useState } from "react";
import {
  createBill,
  getBills,
  getFilteredBills
} from "../../services/billingService";
import { getProducts } from "../../services/productService";
import { getCustomers } from "../../services/customerService";
import "./Billing.css";
import { ShoppingCart } from "lucide-react";

function Billing() {
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [bills, setBills] = useState([]);

  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [items, setItems] = useState([]);
  const [paidAmount, setPaidAmount] = useState("");
  const [showAddProductWarning, setShowAddProductWarning] = useState(false);

  const [filterCustomer, setFilterCustomer] = useState("");
  const [filterDate, setFilterDate] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const prod = await getProducts();
    const cust = await getCustomers();
    const billData = await getBills();

    setProducts(prod);
    setCustomers(cust);
    setBills(billData);
  };

  const addItem = () => {
    setShowAddProductWarning(false);
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

  const handleCreateBill = async (e) => {
    e.preventDefault();

    if (!selectedCustomer) {
      alert("Please select a customer");
      return;
    }

    if (items.length === 0) {
      alert("Add at least one product");
      return;
    }

    const numericPaidAmount = Number(paidAmount);
    if (Number.isNaN(numericPaidAmount) || numericPaidAmount < 0) {
      alert("Paid Amount must be 0 or greater");
      return;
    }

    const billData = {
      customer: selectedCustomer,
      items,
      paidAmount: numericPaidAmount,
    };

    try {
      await createBill(billData);

      setItems([]);
      setPaidAmount("");
      setSelectedCustomer("");

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

          <form className="billing-form" onSubmit={handleCreateBill}>
            <select
              className={selectedCustomer ? "billing-customer-select-selected" : ""}
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value)}
              required
            >
              <option value="">Select Customer</option>
              {customers.map((c) => ( 
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>

            <div className="billing-products-scroll">
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
              className={`billing-add-product-btn ${showAddProductWarning ? "billing-add-product-btn-warning" : ""}`}
            >
              Add Product
            </button>

            <input
              className={`billing-paid-amount-input ${items.length > 0 ? "billing-paid-input-active" : ""}`}
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

                if (items.length === 0) {
                  if (!showAddProductWarning) {
                    alert("Please add at least one product before entering Paid Amount.");
                  }
                  setShowAddProductWarning(true);
                  setPaidAmount("");
                  return;
                }

                setShowAddProductWarning(false);

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
            <select
              value={filterCustomer}
              onChange={(e) => setFilterCustomer(e.target.value)}
            >
              <option value="">Select Customer</option>
              {customers.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>

            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />

            <button onClick={handleFilter}>Search</button>

            <button
              onClick={() => {
                setFilterCustomer("");
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
                <p>
                  <strong>Customer:</strong>{" "}
                  {bill.customer?.name || bill.customerName}
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