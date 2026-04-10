import { Link } from "react-router-dom";
import { Wine, Package, Scale, ShoppingCart, ArrowRight } from "lucide-react";

const apps = [
  {
    slug: "glasmeister",
    name: "GlasMeister",
    tagline: "Bar Glass Inventory",
    description:
      "Track glass counts per shift, manage storage refills, and get automatic reorder alerts. Built for real bar operations with a three-section workflow: shift counting, storage management, and delivery intake.",
    icon: Wine,
    color: "#ce5e2a",
    bg: "#10312e",
    features: ["Shift-End Inventory", "Storage Management", "Reorder Alerts", "Audit Trail"],
    tech: ["React", "TypeScript", "Tailwind CSS"],
  },
  {
    slug: "weltinventar",
    name: "WeltInventar",
    tagline: "AI-Powered Inventory",
    description:
      "Comprehensive inventory management with real-time barcode scanning, multi-channel sales tracking, AI demand predictions, and analytics dashboards with 30/60/90-day views.",
    icon: Package,
    color: "#F55202",
    bg: "#1a1148",
    features: ["Barcode Scanner", "AI Insights", "Sales Analytics", "Multi-Channel"],
    tech: ["React", "TypeScript", "html5-qrcode", "Recharts"],
  },
  {
    slug: "pourfect",
    name: "Pourfect",
    tagline: "Liquid Tracking by Weight",
    description:
      "Precision bottle inventory using weight-based liquid calculations. Track the exact ml remaining in every bottle, manage bottle lifecycles, take inventory snapshots, and export detailed reports.",
    icon: Scale,
    color: "#c9ab81",
    bg: "#0d0b08",
    features: ["Weight Tracking", "Bottle Lifecycle", "Snapshots", "CSV Reports"],
    tech: ["React", "TypeScript", "QR Scanner", "Recharts"],
  },
  {
    slug: "pickup",
    name: "Wozi Pickup",
    tagline: "Food Ordering System",
    description:
      "Customer-facing food ordering with dynamic menus, complex modifier systems (sauces, dressings, add-ons), Happy Hour auto-pricing, pickup time slot calculation, and an admin backoffice.",
    icon: ShoppingCart,
    color: "#22ee22",
    bg: "#000000",
    features: ["Smart Menu", "Happy Hour", "Order Modifiers", "Admin Backoffice"],
    tech: ["React", "TypeScript", "Tailwind CSS"],
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <header className="relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background:
              "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(232,99,61,0.15) 0%, transparent 70%)",
          }}
        />
        <div className="relative mx-auto max-w-5xl px-6 pt-20 pb-16 text-center">
          <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Portfolio
          </p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            Apps I've Built
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            Interactive demos of real restaurant & bar management tools.
            Every feature works — try them out.
          </p>
        </div>
      </header>

      {/* App Grid */}
      <main className="mx-auto max-w-5xl px-6 pb-24">
        <div className="grid gap-6 md:grid-cols-2">
          {apps.map((app) => (
            <Link
              key={app.slug}
              to={`/${app.slug}`}
              className="group relative overflow-hidden rounded-2xl border border-border/50 transition-all hover:border-primary/30 hover:shadow-lg"
            >
              {/* Card header with app color */}
              <div
                className="flex items-center gap-4 p-6 pb-4"
                style={{ background: `linear-gradient(135deg, ${app.bg} 0%, ${app.bg}ee 100%)` }}
              >
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-xl"
                  style={{ background: `${app.color}22` }}
                >
                  <app.icon className="h-6 w-6" style={{ color: app.color }} />
                </div>
                <div>
                  <h2 className="text-xl font-bold" style={{ color: "#f0e8d8" }}>
                    {app.name}
                  </h2>
                  <p className="text-sm" style={{ color: `${app.color}cc` }}>
                    {app.tagline}
                  </p>
                </div>
                <ArrowRight
                  className="ml-auto h-5 w-5 opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-1"
                  style={{ color: app.color }}
                />
              </div>

              {/* Card body */}
              <div className="bg-card p-6 pt-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {app.description}
                </p>

                {/* Feature pills */}
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {app.features.map((f) => (
                    <span
                      key={f}
                      className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                      style={{
                        background: `${app.color}12`,
                        color: app.color,
                        border: `1px solid ${app.color}25`,
                      }}
                    >
                      {f}
                    </span>
                  ))}
                </div>

                {/* Tech stack */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {app.tech.map((t) => (
                    <span
                      key={t}
                      className="rounded px-2 py-0.5 text-xs text-muted-foreground bg-muted"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 text-center text-sm text-muted-foreground">
        <p>Built with React, TypeScript & Tailwind CSS</p>
        <p className="mt-1 text-xs opacity-60">All demos run locally in your browser — no backend needed</p>
      </footer>
    </div>
  );
}
