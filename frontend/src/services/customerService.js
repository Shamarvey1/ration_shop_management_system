const API_URL = import.meta.env.VITE_API_URL;

export const getCustomers = async () => {
  const res = await fetch(`${API_URL}/customers`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });

  return res.json();
};


export const addCustomer = async (customerData) => {
  const res = await fetch(`${API_URL}/customers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
    body: JSON.stringify(customerData),
  });

  return res.json();
};

export const deleteCustomer = async (id) => {
  const res = await fetch(`${API_URL}/customers/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });

  return res.json();
};

export const getCustomerDetails = async (id) => {
  const res = await fetch(`${API_URL}/customers/${id}/details`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });

  return res.json();
};
export const searchCustomers = async (query) => {
  try {
    const encodedQuery = encodeURIComponent(query.trim());
    const res = await fetch(
      `${API_URL}/customers?search=${encodedQuery}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message);
    }

    return data;
  } catch (error) {
    console.error("Search Customer Error:", error);
    return [];
  }
};