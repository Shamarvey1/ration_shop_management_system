import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "../components/Layout/Layout";
import ProtectedRoute from "../components/ProtectedRoute";
import Login from "../Pages/Login/Login";
import Signup from "../Pages/Signup/Signup";
import Dashboard from "../Pages/Dashboard/Dashboard";
import Products from "../Pages/Products/Products";
import Billing from "../Pages/Billing/Billing";
import Customers from "../Pages/Customers/Customers";
import Reports from "../Pages/Reports/Reports";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path='/signup' element={<Signup/>}></Route>

      <Route path='/' element={<ProtectedRoute><Layout/></ProtectedRoute>}>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="products" element={<Products />} />
        <Route path="billing" element={<Billing />} />
        <Route path="customers" element={<Customers />} />
        <Route path="reports" element={<Reports />} />
      </Route>
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  )
}

export default AppRoutes;