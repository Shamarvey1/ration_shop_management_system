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


  const updateItem = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  const handleCreateBill = async (e) => {
    e.preventDefault();

    const billData = {
      customer: selectedCustomer,
      items,
      paidAmount: Number(paidAmount),
    };

    await createBill(billData);


    setItems([]);
    setPaidAmount("");
    setSelectedCustomer("");

    fetchData();
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

        {items.map((item, index) => (
          <div key={index}>
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
              value={item.quantity}
              onChange={(e) =>
                updateItem(index, "quantity", Number(e.target.value))
              }
            />
          </div>
        ))}

        <button type="button" onClick={addItem}>
          Add Product
        </button>

        <input
          type="number"
          placeholder="Paid Amount"
          value={paidAmount}
          onChange={(e) => setPaidAmount(e.target.value)}
        />

        <button type="submit">Create Bill</button>
      </form>

      <h3>All Bills</h3>
      {bills.map((bill) => (
        <div key={bill._id} style={{ border: "1px solid gray", margin: "10px", padding: "10px" }}>
          <p><strong>Customer:</strong> {bill.customer?.name}</p>

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