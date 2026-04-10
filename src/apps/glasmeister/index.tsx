import { Routes, Route } from "react-router-dom";
import AppThemeWrapper from "@/components/shared/AppThemeWrapper";
import Schichtende from "./pages/Schichtende";
import Lager from "./pages/Lager";
import Admin from "./pages/Admin";

export default function GlasMeisterApp() {
  return (
    <AppThemeWrapper theme="glasmeister">
      <Routes>
        <Route path="/" element={<Schichtende />} />
        <Route path="/lager" element={<Lager />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </AppThemeWrapper>
  );
}
