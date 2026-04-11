import { useEffect, useState } from "react";
import { createBill, getBills } from "../../services/billingService";
import { getProducts } from "../../services/productService";
import { getCustomers } from "../../services/customerService";

function Billing() {
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [bills, setBills] = useState([]);

  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [items, setItems] = useState([]);
  const [paidAmount, setPaidAmount] = useState("");
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

  const billData = {
    customer: selectedCustomer,
    items,
    paidAmount: Number(paidAmount),
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
  setBills(data); // ✅ correct place
};
  return (
    <div>
      <h2>Billing</h2>

      <form onSubmit={handleCreateBill}>
        <select
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

        {items.map((item, index) => {
          const product = products.find((p) => p._id === item.product);
          const subtotal = product ? product.price * item.quantity : 0;

          return (
            <div key={index} style={{ marginBottom: "10px" }}>
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

              <span style={{ marginLeft: "10px" }}>
                ₹{subtotal}
              </span>

              <button
                type="button"
                onClick={() => removeItem(index)}
                style={{ marginLeft: "10px" }}
              >
                ❌ Remove
              </button>
            </div>
          );
        })}

        <button type="button" onClick={addItem}>
          Add Product
        </button>

        <input
          type="number"
          placeholder="Paid Amount"
          value={paidAmount}
          onChange={(e) => setPaidAmount(e.target.value)}
        />


        <p><strong>Total:</strong> ₹{calculateTotal()}</p>
        <p><strong>Paid:</strong> ₹{paidAmount || 0}</p>
        <p>
          <strong>Remaining:</strong> ₹
          {calculateTotal() - (paidAmount || 0)}
        </p>

        <button type="submit">Create Bill</button>
      </form>

      {/* Bills */}
      <h3>All Bills</h3>
      {bills.map((bill) => (
        <div
          key={bill._id}
          style={{
            border: "1px solid gray",
            margin: "10px",
            padding: "10px",
          }}
        >
          <p><strong>Customer:</strong>{" "}{bill.customer?.name || bill.customerName}</p>

          {bill.items.map((item, i) => (
            <div key={i}>
              {item.product?.name} — {item.quantity} × ₹{item.price}
            </div>
          ))}

          <p>Total: ₹{bill.totalAmount}</p>
          <p>Paid: ₹{bill.paidAmount}</p>
          <p>Remaining: ₹{bill.remainingAmount}</p>
        </div>
      ))}
      
    </div>
    
  );
}

export default Billing;