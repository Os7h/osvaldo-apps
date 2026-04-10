import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Package, ClipboardList, BarChart3, ArrowLeft } from "lucide-react";
import AboutThisApp from "@/components/shared/AboutThisApp";
import ResetDemoButton from "@/components/shared/ResetDemoButton";
import { PF_PREFIX, seedPourfect } from "@/lib/mock-db/seed/pourfect";

const aboutFeatures = [
  {
    icon: Package,
    title: "Weight Tracking",
    description: "Weigh bottles on a scale, record weights, and automatically calculate remaining liquid using the weight-to-liquid formula.",
  },
  {
    icon: ClipboardList,
    title: "Bottle Lifecycle",
    description: "Track every bottle from delivery (nueva) through active use (aktiv) to empty (leer) and archived (terminada).",
  },
  {
    icon: LayoutDashboard,
    title: "Inventory Snapshots",
    description: "Take periodic snapshots of your entire inventory to compare consumption over time.",
  },
  {
    icon: BarChart3,
    title: "CSV Reports",
    description: "Generate consumption reports by product, view bottle lifecycle stats, and export everything as CSV.",
  },
];

interface LayoutProps {
  children: ReactNode;
}

export default function PourfectLayout({ children }: LayoutProps) {
  const location = useLocation();
  const basePath = "/pourfect";

  const handleReset = () => {
    seedPourfect();
    window.location.reload();
  };

  const navItems = [
    { path: basePath, label: "Dashboard", icon: LayoutDashboard },
    { path: `${basePath}/products`, label: "Produkte", icon: Package },
    { path: `${basePath}/inventory`, label: "Inventar", icon: ClipboardList },
    { path: `${basePath}/reports`, label: "Berichte", icon: BarChart3 },
  ];

  const isActive = (path: string) => {
    if (path === basePath) {
      return location.pathname === basePath || location.pathname === `${basePath}/`;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary via-background to-muted">
      <nav className="bg-card border-b border-border shadow-sm">
        <div className="container mx-auto px-2 sm:px-4 py-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-base sm:text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent truncate">
              Pourfect
            </h1>
            <div className="flex items-center justify-between gap-2">
              <div className="flex gap-1 flex-1 sm:gap-2">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(buttonVariants({ variant: isActive(item.path) ? "default" : "ghost", size: "sm" }), "flex-1 sm:flex-none flex items-center justify-center gap-1")}
                  >
                    <item.icon className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="text-xs sm:text-sm truncate">{item.label}</span>
                  </Link>
                ))}
              </div>
              <div className="flex items-center gap-1">
                <ResetDemoButton appPrefix={PF_PREFIX} onReset={handleReset} />
                <AboutThisApp
                  appName="Pourfect"
                  tagline="Bar Spirits Weight Tracking System"
                  description="Pourfect digitalisiert die Spirituosen-Inventur: Flaschen wiegen, Restmenge berechnen, Verbrauch analysieren. Das Gewicht-zu-Flüssigkeit-System macht Schluss mit Schätzen und liefert exakte Bestandsdaten pro Flasche."
                  features={aboutFeatures}
                  techStack={["React 18", "TypeScript", "Tailwind CSS", "shadcn/ui", "Recharts", "localStorage"]}
                />
                <Link to="/" className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "shrink-0")}>
                    <ArrowLeft className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>
      <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">{children}</main>
    </div>
  );
}
