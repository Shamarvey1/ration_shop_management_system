const API_URL = import.meta.env.VITE_API_URL;


export const getSummaryReport = async () => {
  const res = await fetch(`${API_URL}/reports/summary`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });

  return res.json();
};