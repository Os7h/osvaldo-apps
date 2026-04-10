import { Routes, Route } from "react-router-dom";
import AppThemeWrapper from "@/components/shared/AppThemeWrapper";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Scanner from "./pages/Scanner";
import Analytics from "./pages/Analytics";
import Transactions from "./pages/Transactions";
import Settings from "./pages/Settings";

export default function WeltInventarApp() {
  return (
    <AppThemeWrapper theme="weltinventar">
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/products" element={<Products />} />
        <Route path="/scanner" element={<Scanner />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </AppThemeWrapper>
  );
}
