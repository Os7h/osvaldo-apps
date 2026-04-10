import type { LucideIcon } from "lucide-react";
import { Info, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface AboutThisAppProps {
  appName: string;
  tagline: string;
  description: string;
  features: Feature[];
  techStack: string[];
}

export default function AboutThisApp({
  appName,
  tagline,
  description,
  features,
  techStack,
}: AboutThisAppProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium shrink-0 h-9 w-9 hover:bg-accent hover:text-accent-foreground">
        <Info className="h-5 w-5" />
      </SheetTrigger>
      <SheetContent className="overflow-y-auto bg-background border-border">
        <SheetHeader>
          <SheetTitle className="text-2xl font-bold">{appName}</SheetTitle>
          <p className="text-sm text-muted-foreground italic">{tagline}</p>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <p className="text-sm leading-relaxed">{description}</p>

          <Separator />

          <div>
            <h3 className="text-sm font-semibold mb-3 uppercase tracking-wider text-muted-foreground">
              Features
            </h3>
            <div className="space-y-3">
              {features.map((f) => (
                <div key={f.title} className="flex gap-3">
                  <div className="mt-0.5 shrink-0 rounded-md bg-primary/10 p-1.5">
                    <f.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{f.title}</p>
                    <p className="text-xs text-muted-foreground">{f.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-sm font-semibold mb-3 uppercase tracking-wider text-muted-foreground">
              Tech Stack
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {techStack.map((t) => (
                <Badge key={t} variant="secondary" className="text-xs">
                  {t}
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
            <p className="text-xs text-muted-foreground leading-relaxed">
              This is an interactive portfolio demo. All data is stored in your browser's
              localStorage — no backend required. Feel free to add, edit, and delete
              anything. Use the Reset Demo button to restore the original data.
            </p>
          </div>

          <Link to="/" onClick={() => setOpen(false)}>
            <Button variant="outline" className="w-full gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Portfolio
            </Button>
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
}
