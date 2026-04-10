import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import { X, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Step {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface AppGuideProps {
  appName: string;
  tagline: string;
  intro: string;
  steps: Step[];
  storageKey: string;
}

export default function AppGuide({ appName, tagline, intro, steps, storageKey }: AppGuideProps) {
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(storageKey) === "1");
  const [collapsed, setCollapsed] = useState(false);

  if (dismissed) {
    return (
      <button
        onClick={() => { localStorage.removeItem(storageKey); setDismissed(false); }}
        className="w-full text-center py-2 text-xs text-muted-foreground hover:text-foreground transition-colors border-b border-border/50 bg-card/50"
      >
        Show guide
      </button>
    );
  }

  return (
    <div className="border-b border-border/50 bg-gradient-to-b from-primary/5 to-transparent">
      <div className="container mx-auto px-4 py-6">
        {/* Header row */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-bold">{appName}</h2>
              <span className="text-xs sm:text-sm text-primary font-medium px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 whitespace-nowrap">
                Interactive Demo
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1 italic">{tagline}</p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCollapsed(!collapsed)}
              className="h-7 w-7"
            >
              {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => { localStorage.setItem(storageKey, "1"); setDismissed(true); }}
              className="h-7 w-7"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {!collapsed && (
          <>
            {/* Intro text */}
            <p className="mt-3 text-sm leading-relaxed max-w-2xl">
              {intro}
            </p>

            {/* Steps */}
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {steps.map((step) => (
                <div
                  key={step.title}
                  className="flex gap-3 rounded-lg border border-border/50 bg-card/50 p-3"
                >
                  <div className="shrink-0 mt-0.5 rounded-md bg-primary/10 p-1.5">
                    <step.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{step.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer note */}
            <p className="mt-4 text-xs text-muted-foreground">
              Alles hier ist eine interaktive Demo — alle Daten werden lokal in deinem Browser gespeichert. Spiel ruhig damit herum, du kannst nichts kaputt machen!
            </p>
          </>
        )}
      </div>
    </div>
  );
}
