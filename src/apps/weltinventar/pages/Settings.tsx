import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings as SettingsIcon, Bell, Brain, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import WeltInventarLayout from "../components/Layout";

export default function Settings() {
  const { toast } = useToast();

  const [currency, setCurrency] = useState("EUR");
  const [timezone, setTimezone] = useState("Europe/Berlin");
  const [shopName, setShopName] = useState("Welt-Basar Bamberg");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [lowStockAlerts, setLowStockAlerts] = useState(true);
  const [aiInsightsEnabled, setAiInsightsEnabled] = useState(true);
  const [autoCategorize, setAutoCategorize] = useState(true);

  const handleSave = () => {
    toast({
      title: "Einstellungen gespeichert",
      description: "Ihre Änderungen wurden übernommen.",
    });
  };

  return (
    <WeltInventarLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Einstellungen</h1>
          <p className="text-muted-foreground">
            Konfiguration Ihres WeltInventar Systems
          </p>
        </div>

        <Tabs defaultValue="general" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">Allgemein</TabsTrigger>
            <TabsTrigger value="notifications">Benachrichtigungen</TabsTrigger>
            <TabsTrigger value="ai">KI-Features</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <SettingsIcon className="w-5 h-5" />
                  Allgemeine Einstellungen
                </CardTitle>
                <CardDescription>
                  Grundkonfiguration für Ihr Inventarsystem
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Geschäftsname</Label>
                  <Input
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Währung</Label>
                    <Select value={currency} onValueChange={(v) => v && setCurrency(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EUR">Euro (€)</SelectItem>
                        <SelectItem value="USD">US Dollar ($)</SelectItem>
                        <SelectItem value="GBP">Pfund (£)</SelectItem>
                        <SelectItem value="CHF">Schweizer Franken (CHF)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Zeitzone</Label>
                    <Select value={timezone} onValueChange={(v) => v && setTimezone(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Europe/Berlin">Berlin (CET)</SelectItem>
                        <SelectItem value="Europe/London">London (GMT)</SelectItem>
                        <SelectItem value="Europe/Zurich">Zürich (CET)</SelectItem>
                        <SelectItem value="America/New_York">New York (EST)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={handleSave}>Änderungen speichern</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Benachrichtigungen
                </CardTitle>
                <CardDescription>
                  Steuern Sie, wann Sie benachrichtigt werden
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Push-Benachrichtigungen</Label>
                    <p className="text-sm text-muted-foreground">
                      Wichtige Updates in Echtzeit erhalten
                    </p>
                  </div>
                  <Switch
                    checked={notificationsEnabled}
                    onCheckedChange={(checked) => {
                      setNotificationsEnabled(checked);
                      toast({
                        title: "Einstellung aktualisiert",
                        description: `Push-Benachrichtigungen ${checked ? "aktiviert" : "deaktiviert"}`,
                      });
                    }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Niedrige Bestände</Label>
                    <p className="text-sm text-muted-foreground">
                      Warnung bei Unterschreitung der Mindestbestände
                    </p>
                  </div>
                  <Switch
                    checked={lowStockAlerts}
                    onCheckedChange={(checked) => {
                      setLowStockAlerts(checked);
                      toast({
                        title: "Einstellung aktualisiert",
                        description: `Bestandswarnungen ${checked ? "aktiviert" : "deaktiviert"}`,
                      });
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ai">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  KI-Features
                </CardTitle>
                <CardDescription>
                  Konfiguration der künstlichen Intelligenz
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>KI-Einblicke</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatische Geschäftseinblicke und Prognosen
                    </p>
                  </div>
                  <Switch
                    checked={aiInsightsEnabled}
                    onCheckedChange={(checked) => {
                      setAiInsightsEnabled(checked);
                      toast({
                        title: "Einstellung aktualisiert",
                        description: `KI-Einblicke ${checked ? "aktiviert" : "deaktiviert"}`,
                      });
                    }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Automatische Kategorisierung</Label>
                    <p className="text-sm text-muted-foreground">
                      KI kategorisiert neue Produkte automatisch
                    </p>
                  </div>
                  <Switch
                    checked={autoCategorize}
                    onCheckedChange={(checked) => {
                      setAutoCategorize(checked);
                      toast({
                        title: "Einstellung aktualisiert",
                        description: `Auto-Kategorisierung ${checked ? "aktiviert" : "deaktiviert"}`,
                      });
                    }}
                  />
                </div>
                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-medium mb-2">KI-Nutzung (Demo)</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Insights generiert:</span>
                      <div className="font-medium">5</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Prognosegenauigkeit:</span>
                      <div className="font-medium">87%</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="w-5 h-5" />
                    System-Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Version:</span>
                      <Badge variant="outline">v1.0.0-demo</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Datenspeicher:</span>
                      <Badge variant="outline">localStorage (Demo)</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Region:</span>
                      <Badge variant="outline">EU (Frankfurt)</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Über WeltInventar</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Intelligente Inventarverwaltung speziell entwickelt für Gastronomen
                    und Einzelhändler mit globalen Produktsortimenten. Barcode-Scanning,
                    Multi-Channel-Tracking und KI-basierte Nachfrageprognosen in einer App.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">React 18</Badge>
                    <Badge variant="secondary">TypeScript</Badge>
                    <Badge variant="secondary">Recharts</Badge>
                    <Badge variant="secondary">shadcn/ui</Badge>
                    <Badge variant="secondary">localStorage</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </WeltInventarLayout>
  );
}
