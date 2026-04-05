import { NavLink, Outlet } from "react-router-dom";

function Layout() {
  return (
    <div style={{ display: "flex" }}>
      <div style={{ width: "200px", background: "#eee" }}>
        <h3>Menu</h3>
        <ul>
          <li>
            <NavLink
              to="/dashboard"
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              Dashboard
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/products"
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              Products
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/billing"
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              Billing
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/customers"
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              Customers
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/reports"
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              Reports
            </NavLink>
          </li>
        </ul>
      </div>
      <div style={{ marginLeft: "20px" }}>
        <h2>Navbar</h2>
        <Outlet />
      </div>
    </div>
  );
}

export default Layout;