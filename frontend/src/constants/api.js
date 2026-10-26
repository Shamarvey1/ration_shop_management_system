export const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV
    ? "http://localhost:5001/api"
    : "https://ration-shop-management-system-g0pm.onrender.com/api");

export default API_URL;
