import { Outlet } from "react-router-dom";
import Sidebar from "../Sidebar/Sidebar";

function Layout() {
  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        width: "100%",
        overflow: "hidden",
      }}
    >
      <Sidebar />
      <main
        style={{
          flex: 1,
          height: "100vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default Layout;