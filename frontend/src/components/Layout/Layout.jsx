import { Outlet } from "react-router-dom";
import Sidebar from "../Sidebar/Sidebar";

function Layout() {
  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <div style={{ marginLeft: "20px" }}>
        <h2>Navbar</h2>
        <Outlet />
      </div>
    </div>
  );
}

export default Layout;