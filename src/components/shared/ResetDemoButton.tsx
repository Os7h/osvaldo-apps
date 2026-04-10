import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { clearAppData } from "@/lib/mock-db";

interface ResetDemoButtonProps {
  appPrefix: string;
  onReset: () => void;
  variant?: "outline" | "ghost" | "secondary";
}

export default function ResetDemoButton({ appPrefix, onReset, variant = "outline" }: ResetDemoButtonProps) {
  const handleReset = () => {
    clearAppData(appPrefix);
    onReset();
  };

  return (
    <Button variant={variant} size="sm" onClick={handleReset} className="gap-2">
      <RotateCcw className="h-3.5 w-3.5" />
      Reset Demo
    </Button>
  );
}
