import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Package,
  ScanBarcode,
  BarChart3,
  Receipt,
  Settings,
  ArrowLeft,
} from "lucide-react";
import AboutThisApp from "@/components/shared/AboutThisApp";
import ResetDemoButton from "@/components/shared/ResetDemoButton";
import { WI_PREFIX, seedWeltInventar } from "@/lib/mock-db/seed/weltinventar";

const aboutFeatures = [
  {
    icon: ScanBarcode,
    title: "Barcode Scanner",
    description: "Produkte per Barcode finden und Bestand verwalten. Demo-Modus mit Texteingabe.",
  },
  {
    icon: BarChart3,
    title: "KI-Einblicke",
    description: "Automatische Nachfrageprognosen und Bestandsempfehlungen.",
  },
  {
    icon: Receipt,
    title: "Multi-Channel-Verkauf",
    description: "Transaktionen über Laden, Online-Shop und Restaurant verfolgen.",
  },
  {
    icon: LayoutDashboard,
    title: "Analytics Dashboard",
    description: "Umsatzentwicklung, Top-Produkte und Kategorieauswertung mit Recharts.",
  },
];

const navItems = [
  { path: "", label: "Dashboard", icon: LayoutDashboard },
  { path: "/products", label: "Produkte", icon: Package },
  { path: "/scanner", label: "Scanner", icon: ScanBarcode },
  { path: "/analytics", label: "Analytik", icon: BarChart3 },
  { path: "/transactions", label: "Transaktionen", icon: Receipt },
  { path: "/settings", label: "Einstellungen", icon: Settings },
];

interface LayoutProps {
  children: ReactNode;
}

export default function WeltInventarLayout({ children }: LayoutProps) {
  const location = useLocation();
  const basePath = "/weltinventar";

  const handleReset = () => {
    seedWeltInventar();
    window.location.reload();
  };

  const isActive = (path: string) => {
    const fullPath = `${basePath}${path}`;
    if (path === "") {
      return location.pathname === basePath || location.pathname === `${basePath}/`;
    }
    return location.pathname === fullPath;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary via-background to-muted">
      <nav className="bg-card border-b border-border shadow-sm">
        <div className="container mx-auto px-2 sm:px-4 py-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-base sm:text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent truncate">
              WeltInventar
            </h1>
            <div className="flex items-center justify-between gap-2">
              <div className="flex gap-1 flex-1 sm:gap-2 overflow-x-auto">
                {navItems.map((item) => (
                  <Button
                    key={item.path}
                    variant={isActive(item.path) ? "default" : "ghost"}
                    size="sm"
                    asChild
                    className="flex-shrink-0"
                  >
                    <Link
                      to={`${basePath}${item.path}`}
                      className="flex items-center justify-center gap-1"
                    >
                      <item.icon className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="text-xs sm:text-sm truncate hidden sm:inline">
                        {item.label}
                      </span>
                    </Link>
                  </Button>
                ))}
              </div>
              <div className="flex items-center gap-1">
                <ResetDemoButton appPrefix={WI_PREFIX} onReset={handleReset} />
                <AboutThisApp
                  appName="WeltInventar"
                  tagline="KI-gestütztes Inventarsystem für Gastronomie & Handel"
                  description="WeltInventar ist ein intelligentes Inventarsystem für Restaurants, Bars und Einzelhändler mit globalen Produktsortimenten. Es kombiniert Barcode-Scanning, Multi-Channel-Transaktionsverfolgung und KI-basierte Nachfrageprognosen in einer modernen, responsiven Oberfläche."
                  features={aboutFeatures}
                  techStack={["React 18", "TypeScript", "Tailwind CSS", "shadcn/ui", "Recharts", "localStorage"]}
                />
                <Button variant="ghost" size="icon" asChild className="shrink-0">
                  <Link to="/">
                    <ArrowLeft className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>
      <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">{children}</main>
    </div>
  );
}
