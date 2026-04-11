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

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Failed to create bill");
  }

  return data;
};


export const getBills = async () => {
  try {
    const res = await fetch(`${API_URL}/bills`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Failed to fetch bills");
    }

    return data;

  } catch (error) {
    console.error("Get Bills Error:", error.message);
    return [];
  }
};

