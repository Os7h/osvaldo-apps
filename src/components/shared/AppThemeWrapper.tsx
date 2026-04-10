import type { ReactNode } from "react";

interface AppThemeWrapperProps {
  theme: "glasmeister" | "weltinventar" | "pourfect" | "pickup";
  children: ReactNode;
}

export default function AppThemeWrapper({ theme, children }: AppThemeWrapperProps) {
  return (
    <div data-theme={theme} className="min-h-screen bg-background text-foreground">
      {children}
    </div>
  );
}
