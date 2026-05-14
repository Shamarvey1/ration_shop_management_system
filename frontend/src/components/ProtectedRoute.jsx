import { Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

function ProtectedRoute({ children }) {
  const [checking, setChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const validate = async () => {
      const token = localStorage.getItem("token");
      if (!token || token === "undefined" || token === "null") {
        localStorage.removeItem("token");
        setIsAuthenticated(false);
        setChecking(false);
        return;
      }

      try {
        const API_URL = import.meta.env.VITE_API_URL || "https://ration-shop-management-system-g0pm.onrender.com/api";
        const res = await fetch(`${API_URL}/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem("token");
          setIsAuthenticated(false);
        }
      } catch (err) {
        localStorage.removeItem("token");
        setIsAuthenticated(false);
      } finally {
        setChecking(false);
      }
    };

    validate();
  }, [location.pathname]);

  if (checking) return null;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;