const API_URL = import.meta.env.VITE_API_URL;

export const createBill = async (billData) => {
  const res = await fetch(`${API_URL}/bills`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
    body: JSON.stringify(billData),
  });

  return res.json();
};


export const getBills = async () => {
  const res = await fetch(`${API_URL}/bills`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });

  return res.json();
};