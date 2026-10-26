import { Outlet } from "react-router-dom";
import Sidebar from "../Sidebar/Sidebar";
import AIChat from "../AIChat/AIChat";
import "./Layout.css";

function Layout() {
  return (
    <div className="layout-container">
      <Sidebar />
      <main className="layout-main">
        <div className="layout-content">
          <Outlet />
        </div>
      </main>
      {/* AI Assistant — floats on every page */}
      <AIChat />
    </div>
  );
}

export default Layout;