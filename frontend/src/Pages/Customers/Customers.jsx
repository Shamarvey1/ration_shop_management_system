import { useEffect, useState } from "react";
import {
  getCustomers,
  addCustomer,
  deleteCustomer,
} from "../../services/customerService";
import "./Customers.css";

function Customers() {
  const [customers, setCustomers] = useState([]);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");


  const fetchCustomers = async () => {
    try {
      const data = await getCustomers();

      console.log("Customers API:", data);

      if (Array.isArray(data)) {
        setCustomers(data);
      } else {
        setCustomers([]);
      }
    } catch (error) {
      console.error("Fetch error:", error);
      setCustomers([]);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleAddCustomer = async (e) => {
    e.preventDefault();

    await addCustomer({
      name,
      phone,
      address,
    });

    setName("");
    setPhone("");
    setAddress("");

    fetchCustomers();
  };


  const handleDelete = async (id) => {
    await deleteCustomer(id);
    fetchCustomers();
  };

  return (
    <div className="customers-container">
      <h2>Customers</h2>

      <form onSubmit={handleAddCustomer} className="customer-form">
        <input
          type="text"
          placeholder="Customer name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <input
          type="text"
          placeholder="Phone number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />

        <input
          type="text"
          placeholder="Address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />

        <button type="submit">Add Customer</button>
      </form>


      <div className="customer-list">
        {Array.isArray(customers) && customers.length > 0 ? (
          customers.map((customer) => (
            <div key={customer._id} className="customer-card">
              <h4>{customer.name}</h4>
              <p>Phone: {customer.phone}</p>
              <p>Address: {customer.address || "N/A"}</p>

              <button onClick={() => handleDelete(customer._id)}>
                Delete
              </button>
            </div>
          ))
        ) : (
          <p>No customers found</p>
        )}
      </div>
    </div>
  );
}

export default Customers;