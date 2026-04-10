import { Routes, Route } from "react-router-dom";
import AppThemeWrapper from "@/components/shared/AppThemeWrapper";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Inventory from "./pages/Inventory";
import Reports from "./pages/Reports";

export default function PourfectApp() {
  return (
    <AppThemeWrapper theme="pourfect">
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/reports" element={<Reports />} />
      </Routes>
    </AppThemeWrapper>
  );
}
