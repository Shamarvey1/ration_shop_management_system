import { Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { API_URL } from "../constants/api";

const isTokenValid = () => {
  const token = localStorage.getItem("token");
  if (!token || token === "undefined" || token === "null") return false;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;
    const payload = JSON.parse(atob(parts[1]));
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      localStorage.removeItem("token");
      return false;
    }
    return true;
  } catch {
    localStorage.removeItem("token");
    return false;
  }
};

function ProtectedRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(isTokenValid());
  const location = useLocation();

  useEffect(() => {
    const validate = async () => {
      if (!isTokenValid()) {
        localStorage.removeItem("token");
        setIsAuthenticated(false);
        return;
      }

      const token = localStorage.getItem("token");
      try {
        const res = await fetch(`${API_URL}/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          localStorage.removeItem("token");
          setIsAuthenticated(false);
        }
      } catch {
      }
    };

    validate();
  }, [location.pathname]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;