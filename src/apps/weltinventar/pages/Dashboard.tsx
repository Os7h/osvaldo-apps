import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  Euro,
  AlertTriangle,
  TrendingUp,
  Plus,
  ScanBarcode,
  BarChart3,
  Brain,
} from "lucide-react";
import WeltInventarLayout from "../components/Layout";
import { supabase } from "../db";

interface DashboardStats {
  productCount: number;
  totalValue: number;
  lowStockCount: number;
  monthlyRevenue: number;
  lowStockItems: Array<{ name: string; current: number; min: number; productId: string }>;
  recentInsights: Array<{ id: string; title: string; confidence: number; status: string }>;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async () => {
    try {
      const { data: products } = await supabase.from("products").select().eq("is_active", true);
      const { data: stockEntries } = await supabase.from("stock_entries").select();
      const { data: allProducts } = await supabase.from("products").select();

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const { data: recentSales } = await supabase
        .from("transactions")
        .select()
        .eq("type", "sale")
        .gte("created_at", thirtyDaysAgo.toISOString());

      const { data: insights } = await supabase
        .from("ai_insights")
        .select()
        .eq("status", "active");

      const productList = (products as Record<string, unknown>[]) || [];
      const stockList = (stockEntries as Record<string, unknown>[]) || [];
      const allProductList = (allProducts as Record<string, unknown>[]) || [];

      // Calculate total inventory value
      let totalValue = 0;
      const lowStockItems: DashboardStats["lowStockItems"] = [];

      for (const stock of stockList) {
        const product = allProductList.find((p) => p.id === stock.product_id);
        if (product) {
          totalValue += (product.cost_price as number) * (stock.current_quantity as number);
          if ((stock.current_quantity as number) <= (stock.min_threshold as number)) {
            lowStockItems.push({
              name: product.name as string,
              current: stock.current_quantity as number,
              min: stock.min_threshold as number,
              productId: product.id as string,
            });
          }
        }
      }

      const salesList = (recentSales as Record<string, unknown>[]) || [];
      const monthlyRevenue = salesList.reduce(
        (sum, sale) => sum + ((sale.total_amount as number) || 0),
        0
      );

      const insightList = (insights as Record<string, unknown>[]) || [];

      setStats({
        productCount: productList.length,
        totalValue,
        lowStockCount: lowStockItems.length,
        monthlyRevenue,
        lowStockItems,
        recentInsights: insightList.map((i) => ({
          id: i.id as string,
          title: i.title as string,
          confidence: i.confidence as number,
          status: i.status as string,
        })),
      });
    } catch (err: unknown) {
      console.error("Dashboard laden fehlgeschlagen:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const statCards = [
    {
      title: "Gesamtprodukte",
      value: loading ? "..." : String(stats?.productCount ?? 0),
      description: "Aktive Artikel im Lager",
      icon: Package,
    },
    {
      title: "Gesamtwert",
      value: loading ? "..." : `€${(stats?.totalValue ?? 0).toFixed(0)}`,
      description: "Aktueller Lagerwert",
      icon: Euro,
    },
    {
      title: "Niedrige Bestände",
      value: loading ? "..." : String(stats?.lowStockCount ?? 0),
      description: "Artikel unter Mindestbestand",
      icon: AlertTriangle,
    },
    {
      title: "Umsatz (30 Tage)",
      value: loading ? "..." : `€${(stats?.monthlyRevenue ?? 0).toFixed(0)}`,
      description: "Verkäufe diesen Monat",
      icon: TrendingUp,
    },
  ];

  const quickActions = [
    {
      title: "Produkte verwalten",
      description: "Artikel hinzufügen und bearbeiten",
      icon: Plus,
      action: () => navigate("/weltinventar/products"),
    },
    {
      title: "Scanner öffnen",
      description: "Barcode scannen",
      icon: ScanBarcode,
      action: () => navigate("/weltinventar/scanner"),
    },
    {
      title: "Analytics ansehen",
      description: "Detaillierte Berichte",
      icon: BarChart3,
      action: () => navigate("/weltinventar/analytics"),
    },
    {
      title: "KI-Einblicke",
      description: "Nachfrageprognosen",
      icon: Brain,
      action: () => navigate("/weltinventar/analytics"),
    },
  ];

  return (
    <WeltInventarLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            Überblick über Ihr WeltInventar System
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Schnellaktionen</CardTitle>
            <CardDescription>Häufig verwendete Funktionen</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {quickActions.map((action) => (
                <Button
                  key={action.title}
                  variant="outline"
                  className="h-20 flex-col gap-2"
                  onClick={action.action}
                >
                  <action.icon className="h-6 w-6" />
                  <div className="text-center">
                    <div className="font-medium text-sm">{action.title}</div>
                    <div className="text-xs text-muted-foreground">{action.description}</div>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Low Stock Alerts */}
        {stats && stats.lowStockItems.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Niedrige Bestände
              </CardTitle>
              <CardDescription>
                Diese Artikel sind unter dem Mindestbestand
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.lowStockItems.map((item) => (
                  <div
                    key={item.productId}
                    className="flex items-center justify-between p-3 bg-destructive/5 border border-destructive/20 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Mindestbestand: {item.min}
                      </p>
                    </div>
                    <Badge variant="destructive">
                      {item.current} / {item.min}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* AI Insights Preview */}
        {stats && stats.recentInsights.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                KI-Einblicke
              </CardTitle>
              <CardDescription>Aktuelle Nachfrageprognosen</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.recentInsights.slice(0, 3).map((insight) => (
                  <div
                    key={insight.id}
                    className="flex items-center justify-between p-3 bg-primary/5 border border-primary/20 rounded-lg"
                  >
                    <p className="font-medium text-sm flex-1">{insight.title}</p>
                    <Badge variant="secondary">
                      {Math.round(insight.confidence * 100)}% Konfidenz
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </WeltInventarLayout>
  );
}
