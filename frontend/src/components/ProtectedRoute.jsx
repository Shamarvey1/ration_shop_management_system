import { Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { API_URL } from "../constants/api";

function ProtectedRoute({ children }) {
  const tokenInStorage = () => {
    const token = localStorage.getItem("token");
    return token && token !== "undefined" && token !== "null";
  };

  const [checking, setChecking] = useState(!tokenInStorage());
  const [isAuthenticated, setIsAuthenticated] = useState(tokenInStorage());
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
        setChecking(true);
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

  if (checking && isAuthenticated) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "14px",
        color: "#4b5563",
      }}>
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;