import { Routes, Route } from "react-router-dom";
import AppThemeWrapper from "@/components/shared/AppThemeWrapper";
import Index from "./pages/Index";
import OrderConfirmation from "./pages/OrderConfirmation";
import Backoffice from "./pages/Backoffice";

export default function PickupApp() {
  return (
    <AppThemeWrapper theme="pickup">
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/order/:id" element={<OrderConfirmation />} />
        <Route path="/backoffice" element={<Backoffice />} />
      </Routes>
    </AppThemeWrapper>
  );
}
