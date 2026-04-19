import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Box,
  ShoppingCart,
  Users,
  BarChart3,
  LogOut,
} from "lucide-react";
import "./Sidebar.css";

function Sidebar() {
  const navigate = useNavigate(); 

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <ShoppingCart size={28} className="sidebar-logo" />
        <h1 className="sidebar-title">RationShop Pro</h1>
      </div>

      <nav className="sidebar-nav">
        <ul className="sidebar-menu">
          <li>
            <NavLink
              to="/dashboard"
              className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
            >
              <LayoutDashboard size={20} className="sidebar-icon" />
              <span>Dashboard</span>
            </NavLink>
          </li>

          <li>
            <NavLink
              to="/billing"
              className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
            >
              <ShoppingCart size={20} className="sidebar-icon" />
              <span>Sales / Billing</span>
            </NavLink>
          </li>

          <li>
            <NavLink
              to="/products"
              className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
            >
              <Box size={20} className="sidebar-icon" />
              <span>Products</span>
            </NavLink>
          </li>

          <li>
            <NavLink
              to="/customers"
              className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
            >
              <Users size={20} className="sidebar-icon" />
              <span>Customers</span>
            </NavLink>
          </li>

          <li>
            <NavLink
              to="/reports"
              className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
            >
              <BarChart3 size={20} className="sidebar-icon" />
              <span>Reports</span>
            </NavLink>
          </li>
        </ul>
      </nav>

      <button onClick={handleLogout} className="sidebar-logout">
        <LogOut size={20} className="sidebar-icon" />
        <span>Logout</span>
      </button>
    </aside>
  );
}

export default Sidebar;