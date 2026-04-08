import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Box,
  ShoppingCart,
  Users,
  BarChart3,
  LogOut,
} from "lucide-react";

function Sidebar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div style={{ width: "200px", background: "#eee" }}>
      <h3>Menu</h3>
      <ul>
        <li>
          <NavLink
            to="/dashboard"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            <LayoutDashboard size={16} style={{ marginRight: "8px" }} />
            Dashboard
          </NavLink>
        </li>

        <li>
          <NavLink
            to="/products"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            <Box size={16} style={{ marginRight: "8px" }} />
            Products
          </NavLink>
        </li>

        <li>
          <NavLink
            to="/billing"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            <ShoppingCart size={16} style={{ marginRight: "8px" }} />
            Billing
          </NavLink>
        </li>

        <li>
          <NavLink
            to="/customers"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            <Users size={16} style={{ marginRight: "8px" }} />
            Customers
          </NavLink>
        </li>

        <li>
          <NavLink
            to="/reports"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            <BarChart3 size={16} style={{ marginRight: "8px" }} />
            Reports
          </NavLink>
        </li>
      </ul>

      <button
        onClick={handleLogout}
        style={{
          marginTop: "20px",
          background: "red",
          color: "white",
          border: "none",
          padding: "10px",
          cursor: "pointer",
          borderRadius: "5px",
        }}
      >
        <LogOut size={16} style={{ marginRight: "8px" }} />
        Logout
      </button>
    </div>
  );
}

export default Sidebar;