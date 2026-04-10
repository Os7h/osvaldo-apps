import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  Filter,
  Receipt,
  TrendingUp,
  TrendingDown,
  RotateCcw,
} from "lucide-react";
import WeltInventarLayout from "../components/Layout";
import { supabase } from "../db";

interface Transaction {
  id: string;
  product_id: string;
  type: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  channel: string;
  notes: string;
  created_at: string;
}

interface Product {
  id: string;
  name: string;
  unit_type: string;
}

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [channelFilter, setChannelFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const { data: txns } = await supabase
        .from("transactions")
        .select()
        .order("created_at", { ascending: false });
      const { data: prods } = await supabase.from("products").select();

      setTransactions((txns as Transaction[]) || []);
      setProducts((prods as Product[]) || []);
    } catch (err: unknown) {
      console.error("Transaktionen laden fehlgeschlagen:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getProduct = (productId: string) =>
    products.find((p) => p.id === productId);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((txn) => {
      const product = getProduct(txn.product_id);
      const matchesSearch =
        product?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        txn.notes?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === "all" || txn.type === typeFilter;
      const matchesChannel =
        channelFilter === "all" || txn.channel === channelFilter;
      return matchesSearch && matchesType && matchesChannel;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions, products, searchTerm, typeFilter, channelFilter]);

  const summaryStats = useMemo(() => {
    return filteredTransactions.reduce(
      (acc, txn) => {
        const amount = txn.total_amount || 0;
        switch (txn.type) {
          case "sale":
            acc.revenue += amount;
            break;
          case "purchase":
            acc.purchases += amount;
            break;
          case "return":
            acc.returns += amount;
            break;
          case "adjust":
            acc.adjustments += 1;
            break;
        }
        return acc;
      },
      { revenue: 0, purchases: 0, returns: 0, adjustments: 0 }
    );
  }, [filteredTransactions]);

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      sale: "Verkauf",
      purchase: "Einkauf",
      return: "Rückgabe",
      adjust: "Anpassung",
    };
    return labels[type] || type;
  };

  const getTypeVariant = (type: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      sale: "default",
      purchase: "secondary",
      return: "destructive",
      adjust: "outline",
    };
    return variants[type] || "outline";
  };

  const getChannelLabel = (channel: string) => {
    const labels: Record<string, string> = {
      store: "Laden",
      online: "Online",
      restaurant: "Restaurant",
    };
    return labels[channel] || channel;
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return "—";
    return `€${amount.toFixed(2)}`;
  };

  const getUnitLabel = (unitType: string) => {
    if (unitType === "weight") return "g";
    if (unitType === "volume") return "ml";
    return "St.";
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("de-DE", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <WeltInventarLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Transaktionen</h1>
          <p className="text-muted-foreground">
            Vollständige Übersicht aller Lagerbewegungen
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Umsatz</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(summaryStats.revenue)}
              </div>
              <p className="text-xs text-muted-foreground">Verkäufe</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Einkäufe</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(summaryStats.purchases)}
              </div>
              <p className="text-xs text-muted-foreground">Eingekauft</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rückgaben</CardTitle>
              <RotateCcw className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {formatCurrency(summaryStats.returns)}
              </div>
              <p className="text-xs text-muted-foreground">Retourniert</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Anpassungen</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summaryStats.adjustments}</div>
              <p className="text-xs text-muted-foreground">Korrekturen</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filter & Suche
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Produktname oder Notizen durchsuchen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={typeFilter} onValueChange={(v) => v && setTypeFilter(v)}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Alle Typen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Typen</SelectItem>
                  <SelectItem value="sale">Verkäufe</SelectItem>
                  <SelectItem value="purchase">Einkäufe</SelectItem>
                  <SelectItem value="return">Rückgaben</SelectItem>
                  <SelectItem value="adjust">Anpassungen</SelectItem>
                </SelectContent>
              </Select>
              <Select value={channelFilter} onValueChange={(v) => v && setChannelFilter(v)}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Alle Kanäle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Kanäle</SelectItem>
                  <SelectItem value="store">Laden</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="restaurant">Restaurant</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Transaktionshistorie</CardTitle>
            <CardDescription>
              {filteredTransactions.length} von {transactions.length} Transaktionen
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Lade Transaktionen...
              </div>
            ) : filteredTransactions.length > 0 ? (
              <div className="border rounded-md overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Datum</TableHead>
                      <TableHead>Typ</TableHead>
                      <TableHead>Produkt</TableHead>
                      <TableHead>Menge</TableHead>
                      <TableHead>Preis</TableHead>
                      <TableHead>Gesamt</TableHead>
                      <TableHead>Kanal</TableHead>
                      <TableHead>Notizen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.map((txn) => {
                      const product = getProduct(txn.product_id);
                      return (
                        <TableRow key={txn.id}>
                          <TableCell>
                            <div className="text-sm">{formatDate(txn.created_at)}</div>
                            <div className="text-xs text-muted-foreground">
                              {formatTime(txn.created_at)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getTypeVariant(txn.type)}>
                              {getTypeLabel(txn.type)}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium text-sm">
                            {product?.name || "Unbekannt"}
                          </TableCell>
                          <TableCell>
                            {txn.quantity}{" "}
                            {getUnitLabel(product?.unit_type || "count")}
                          </TableCell>
                          <TableCell>{formatCurrency(txn.unit_price)}</TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(txn.total_amount)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {getChannelLabel(txn.channel)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground max-w-32 truncate block">
                              {txn.notes || "—"}
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8">
                <Receipt className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  Keine Transaktionen gefunden
                </h3>
                <p className="text-muted-foreground">
                  {searchTerm || typeFilter !== "all" || channelFilter !== "all"
                    ? "Versuchen Sie, Ihre Filter anzupassen"
                    : "Transaktionen werden hier angezeigt, sobald sie erstellt wurden"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </WeltInventarLayout>
  );
}
