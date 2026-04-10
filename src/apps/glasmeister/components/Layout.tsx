import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ClipboardList, Package, Settings, ArrowLeft } from "lucide-react";
import AboutThisApp from "@/components/shared/AboutThisApp";
import ResetDemoButton from "@/components/shared/ResetDemoButton";
import { GM_PREFIX } from "@/lib/mock-db/seed/glasmeister";
import { seedGlasMeister } from "@/lib/mock-db/seed/glasmeister";

const aboutFeatures = [
  { icon: ClipboardList, title: "Shift-End Inventory", description: "Count glasses at bar end, auto-calculate what's missing vs. target." },
  { icon: Package, title: "Storage Management", description: "Refill bar from storage, withdraw for events, track reorder thresholds." },
  { icon: Settings, title: "Admin Delivery Intake", description: "Add new stock when deliveries arrive, see current storage levels." },
];

interface LayoutProps {
  children: ReactNode;
}

export default function GlasMeisterLayout({ children }: LayoutProps) {
  const location = useLocation();
  const basePath = "/glasmeister";

  const handleReset = () => {
    seedGlasMeister();
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary via-background to-muted">
      <nav className="bg-card border-b border-border shadow-sm">
        <div className="container mx-auto px-2 sm:px-4 py-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-base sm:text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent truncate">
              GlasMeister
            </h1>
            <div className="flex items-center justify-between gap-2">
              <div className="flex gap-1 flex-1 sm:gap-2">
                <Button
                  variant={location.pathname === basePath || location.pathname === `${basePath}/` ? "default" : "ghost"}
                  size="sm"
                  asChild
                  className="flex-1 sm:flex-none"
                >
                  <Link to={basePath} className="flex items-center justify-center gap-1">
                    <ClipboardList className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="text-xs sm:text-sm truncate">Schicht</span>
                  </Link>
                </Button>
                <Button
                  variant={location.pathname === `${basePath}/lager` ? "default" : "ghost"}
                  size="sm"
                  asChild
                  className="flex-1 sm:flex-none"
                >
                  <Link to={`${basePath}/lager`} className="flex items-center justify-center gap-1">
                    <Package className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="text-xs sm:text-sm truncate">Lager</span>
                  </Link>
                </Button>
                <Button
                  variant={location.pathname === `${basePath}/admin` ? "default" : "ghost"}
                  size="sm"
                  asChild
                  className="flex-1 sm:flex-none"
                >
                  <Link to={`${basePath}/admin`} className="flex items-center justify-center gap-1">
                    <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="text-xs sm:text-sm truncate">Admin</span>
                  </Link>
                </Button>
              </div>
              <div className="flex items-center gap-1">
                <ResetDemoButton appPrefix={GM_PREFIX} onReset={handleReset} />
                <AboutThisApp
                  appName="GlasMeister"
                  tagline="Bar Glass Inventory Tracker"
                  description="GlasMeister streamlines bar glass management with a three-section workflow that mirrors real operations: count glasses at shift end, refill from storage, and intake deliveries. The system auto-calculates missing quantities, tracks storage levels, and alerts when stock drops below reorder thresholds."
                  features={aboutFeatures}
                  techStack={["React 18", "TypeScript", "Tailwind CSS", "shadcn/ui", "localStorage"]}
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
