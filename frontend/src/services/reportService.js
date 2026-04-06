const API_URL = import.meta.env.VITE_API_URL;


export const getSummaryReport = async () => {
  try {
    const res = await fetch(`${API_URL}/reports/summary`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Failed to fetch summary report");
    }

    return data;

  } catch (error) {
    console.error("Summary Report Error:", error.message);
    return null;
  }
};


export const getSalesReport = async () => {
  try {
    const res = await fetch(`${API_URL}/reports/sales`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Failed to fetch sales report");
    }

    return data;

  } catch (error) {
    console.error("Sales Report Error:", error.message);
    return null;
  }
};
export const getProfitReport = async () => {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/reports/profit`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });

  return res.json();
};