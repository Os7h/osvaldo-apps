import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { TrendingUp, Euro, Package, Brain } from "lucide-react";
import WeltInventarLayout from "../components/Layout";
import { supabase } from "../db";

type TimeRange = "30" | "60" | "90";

interface Transaction {
  id: string;
  product_id: string;
  type: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  channel: string;
  created_at: string;
}

interface Product {
  id: string;
  name: string;
  category_id: string;
  sell_price: number;
  cost_price: number;
}

interface Category {
  id: string;
  name: string;
  icon: string;
}

interface AiInsight {
  id: string;
  title: string;
  description: string;
  confidence: number;
  status: string;
}

const COLORS = ["#8b5cf6", "#f97316", "#06b6d4", "#22c55e", "#ec4899", "#eab308"];

export default function Analytics() {
  const [timeRange, setTimeRange] = useState<TimeRange>("30");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [insights, setInsights] = useState<AiInsight[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(timeRange));

      const { data: txns } = await supabase
        .from("transactions")
        .select()
        .gte("created_at", daysAgo.toISOString())
        .order("created_at");

      const { data: prods } = await supabase.from("products").select();
      const { data: cats } = await supabase.from("categories").select();
      const { data: ai } = await supabase.from("ai_insights").select().eq("status", "active");

      setTransactions((txns as Transaction[]) || []);
      setProducts((prods as Product[]) || []);
      setCategories((cats as Category[]) || []);
      setInsights((ai as AiInsight[]) || []);
    } catch (err: unknown) {
      console.error("Analytics laden fehlgeschlagen:", err);
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    setLoading(true);
    loadData();
  }, [loadData]);

  const sales = useMemo(
    () => transactions.filter((t) => t.type === "sale"),
    [transactions]
  );

  const totalRevenue = useMemo(
    () => sales.reduce((sum, s) => sum + (s.total_amount || 0), 0),
    [sales]
  );

  const totalTransactions = sales.length;
  const averageOrderValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

  // Sales over time chart data
  const salesChartData = useMemo(() => {
    const dailySales: Record<string, number> = {};
    sales.forEach((sale) => {
      const date = new Date(sale.created_at).toLocaleDateString("de-DE", {
        day: "2-digit",
        month: "2-digit",
      });
      dailySales[date] = (dailySales[date] || 0) + (sale.total_amount || 0);
    });
    return Object.entries(dailySales).map(([date, revenue]) => ({ date, revenue }));
  }, [sales]);

  // Category breakdown
  const categoryData = useMemo(() => {
    const categoryRevenue: Record<string, number> = {};
    sales.forEach((sale) => {
      const product = products.find((p) => p.id === sale.product_id);
      const category = product
        ? categories.find((c) => c.id === product.category_id)
        : null;
      const name = category ? category.name : "Sonstige";
      categoryRevenue[name] = (categoryRevenue[name] || 0) + (sale.total_amount || 0);
    });
    return Object.entries(categoryRevenue)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [sales, products, categories]);

  // Top products by revenue
  const topProducts = useMemo(() => {
    const productRevenue: Record<
      string,
      { name: string; revenue: number; quantity: number }
    > = {};
    sales.forEach((sale) => {
      const product = products.find((p) => p.id === sale.product_id);
      const name = product?.name || "Unbekannt";
      if (!productRevenue[name]) {
        productRevenue[name] = { name, revenue: 0, quantity: 0 };
      }
      productRevenue[name].revenue += sale.total_amount || 0;
      productRevenue[name].quantity += sale.quantity;
    });
    return Object.values(productRevenue)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);
  }, [sales, products]);

  const formatCurrency = (value: number) => `€${value.toFixed(2)}`;

  return (
    <WeltInventarLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
            <p className="text-muted-foreground">
              Umsatz, Produkte und KI-Einblicke
            </p>
          </div>
          <div className="flex gap-2">
            {(["30", "60", "90"] as TimeRange[]).map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? "default" : "outline"}
                size="sm"
                onClick={() => setTimeRange(range)}
              >
                {range} Tage
              </Button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">
            Lade Analytics...
          </div>
        ) : (
          <>
            {/* Key Metrics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Gesamtumsatz</CardTitle>
                  <Euro className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
                  <p className="text-xs text-muted-foreground">
                    {totalTransactions} Verkäufe
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Ø Bestellwert
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(averageOrderValue)}
                  </div>
                  <p className="text-xs text-muted-foreground">Pro Transaktion</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Kategorien</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{categoryData.length}</div>
                  <p className="text-xs text-muted-foreground">Mit Umsatz</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">KI-Einblicke</CardTitle>
                  <Brain className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{insights.length}</div>
                  <p className="text-xs text-muted-foreground">Aktive Prognosen</p>
                </CardContent>
              </Card>
            </div>

            {/* AI Insights */}
            {insights.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-primary" />
                    KI-Nachfrageprognosen
                  </CardTitle>
                  <CardDescription>
                    Automatisch generierte Einblicke basierend auf historischen Daten
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {insights.map((insight) => (
                      <div
                        key={insight.id}
                        className="p-3 bg-primary/5 border border-primary/20 rounded-lg"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-medium text-sm">{insight.title}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {insight.description}
                            </p>
                          </div>
                          <Badge variant="secondary" className="shrink-0">
                            {Math.round(insight.confidence * 100)}%
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Charts */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Revenue Over Time */}
              <Card>
                <CardHeader>
                  <CardTitle>Umsatzentwicklung</CardTitle>
                  <CardDescription>Tägliche Verkäufe</CardDescription>
                </CardHeader>
                <CardContent>
                  {salesChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={salesChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" fontSize={12} />
                        <YAxis tickFormatter={(v) => `€${v}`} fontSize={12} />
                        <Tooltip
                          formatter={(value) => formatCurrency(value as number)}
                          labelFormatter={(label) => `Datum: ${label}`}
                        />
                        <Line
                          type="monotone"
                          dataKey="revenue"
                          stroke="#8b5cf6"
                          strokeWidth={2}
                          name="Umsatz"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      Keine Verkaufsdaten im Zeitraum
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Category Performance */}
              <Card>
                <CardHeader>
                  <CardTitle>Kategorie-Performance</CardTitle>
                  <CardDescription>Umsatz nach Kategorien</CardDescription>
                </CardHeader>
                <CardContent>
                  {categoryData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) =>
                            `${name} ${(percent * 100).toFixed(0)}%`
                          }
                          outerRadius={90}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {categoryData.map((_entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) => formatCurrency(value as number)}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      Keine Daten im Zeitraum
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Top Products */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Top-Produkte nach Umsatz</CardTitle>
                  <CardDescription>Meistverkaufte Artikel</CardDescription>
                </CardHeader>
                <CardContent>
                  {topProducts.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={topProducts}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="name"
                          angle={-30}
                          textAnchor="end"
                          height={80}
                          fontSize={11}
                        />
                        <YAxis tickFormatter={(v) => `€${v}`} fontSize={12} />
                        <Tooltip
                          formatter={(value, name) => [
                            name === "revenue"
                              ? formatCurrency(value as number)
                              : String(value),
                            name === "revenue" ? "Umsatz" : "Menge",
                          ]}
                        />
                        <Bar dataKey="revenue" fill="#8b5cf6" name="revenue" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      Keine Verkaufsdaten im Zeitraum
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </WeltInventarLayout>
  );
}
