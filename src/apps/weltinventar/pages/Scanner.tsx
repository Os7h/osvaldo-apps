import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ScanBarcode,
  Package,
  RotateCcw,
  Search,
  Camera,
  AlertTriangle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import WeltInventarLayout from "../components/Layout";
import { supabase } from "../db";

interface ScannedProduct {
  id: string;
  name: string;
  barcode: string;
  cost_price: number;
  sell_price: number;
  unit_type: string;
  category_id: string;
  description: string;
}

interface ScanEntry {
  barcode: string;
  product: ScannedProduct | null;
  timestamp: Date;
}

const EXAMPLE_BARCODES = [
  { barcode: "7312040017072", label: "Absolut Vodka" },
  { barcode: "5010327705064", label: "Hendrick's Gin" },
  { barcode: "4006712007012", label: "Augustiner Helles" },
  { barcode: "4260107220015", label: "Fritz-Kola" },
  { barcode: "8001440065015", label: "Chianti Classico" },
];

export default function Scanner() {
  const [barcodeInput, setBarcodeInput] = useState("");
  const [scannedProduct, setScannedProduct] = useState<ScannedProduct | null>(null);
  const [stockInfo, setStockInfo] = useState<Record<string, unknown> | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [scanHistory, setScanHistory] = useState<ScanEntry[]>([]);
  const { toast } = useToast();

  const lookupBarcode = useCallback(
    async (barcode: string) => {
      if (!barcode.trim()) return;

      try {
        const { data: products } = await supabase
          .from("products")
          .select()
          .eq("barcode", barcode.trim())
          .eq("is_active", true);

        const productList = products as ScannedProduct[] | null;
        const product = productList?.[0] ?? null;

        const entry: ScanEntry = {
          barcode: barcode.trim(),
          product,
          timestamp: new Date(),
        };
        setScanHistory((prev) => [entry, ...prev.slice(0, 9)]);

        if (product) {
          setScannedProduct(product);

          // Fetch stock info
          const { data: stocks } = await supabase
            .from("stock_entries")
            .select()
            .eq("product_id", product.id);
          const stockList = stocks as Record<string, unknown>[] | null;
          setStockInfo(stockList?.[0] ?? null);

          // Fetch category
          const { data: cats } = await supabase
            .from("categories")
            .select()
            .eq("id", product.category_id);
          const catList = cats as Record<string, unknown>[] | null;
          setCategoryName(
            catList?.[0]
              ? `${catList[0].icon} ${catList[0].name}`
              : "Unbekannt"
          );

          toast({
            title: "Produkt gefunden",
            description: product.name,
          });
        } else {
          setScannedProduct(null);
          setStockInfo(null);
          setCategoryName("");
          toast({
            title: "Nicht gefunden",
            description: `Kein Produkt mit Barcode ${barcode}`,
            variant: "destructive",
          });
        }
      } catch (err: unknown) {
        console.error("Scanner-Fehler:", err);
      }

      setBarcodeInput("");
    },
    [toast]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    lookupBarcode(barcodeInput);
  };

  const resetScanner = () => {
    setScannedProduct(null);
    setStockInfo(null);
    setCategoryName("");
    setBarcodeInput("");
  };

  const formatTime = (date: Date) =>
    date.toLocaleTimeString("de-DE", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

  const getUnitLabel = (unitType: string) => {
    if (unitType === "weight") return "g";
    if (unitType === "volume") return "ml";
    return "St.";
  };

  return (
    <WeltInventarLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Scanner</h1>
            <p className="text-muted-foreground">
              Barcode scannen, um Produkte schnell zu finden
            </p>
          </div>
          <Button onClick={resetScanner} variant="outline">
            <RotateCcw className="w-4 h-4 mr-2" />
            Zurücksetzen
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Scanner Section */}
          <div className="space-y-4">
            {/* Fake camera viewfinder */}
            <Card>
              <CardContent className="p-0">
                <div className="relative bg-black/90 rounded-t-lg aspect-video flex items-center justify-center">
                  <div className="absolute inset-4 border-2 border-dashed border-white/30 rounded-lg" />
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-0.5 bg-primary/60 animate-pulse" />
                  <div className="text-center z-10">
                    <Camera className="h-12 w-12 text-white/40 mx-auto mb-2" />
                    <p className="text-white/60 text-sm font-medium">
                      Demo-Modus
                    </p>
                    <p className="text-white/40 text-xs">
                      Barcode unten eingeben
                    </p>
                  </div>
                </div>
                <div className="p-4">
                  <form onSubmit={handleSubmit} className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Barcode eingeben (z.B. 7312040017072)"
                        value={barcodeInput}
                        onChange={(e) => setBarcodeInput(e.target.value)}
                        className="pl-10 font-mono"
                        autoFocus
                      />
                    </div>
                    <Button type="submit">
                      <ScanBarcode className="h-4 w-4 mr-2" />
                      Suchen
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>

            {/* Example Barcodes */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Beispiel-Barcodes</CardTitle>
                <CardDescription>Zum Testen anklicken</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {EXAMPLE_BARCODES.map((ex) => (
                    <Button
                      key={ex.barcode}
                      variant="outline"
                      size="sm"
                      className="font-mono text-xs"
                      onClick={() => lookupBarcode(ex.barcode)}
                    >
                      {ex.barcode}
                      <span className="ml-2 text-muted-foreground font-sans">
                        {ex.label}
                      </span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Scan History */}
            {scanHistory.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Letzte Scans</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {scanHistory.map((scan, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-muted/30 rounded-md"
                      >
                        <div className="flex items-center gap-2">
                          <ScanBarcode className="w-4 h-4 text-muted-foreground" />
                          <span className="font-mono text-xs">{scan.barcode}</span>
                          {scan.product ? (
                            <Badge variant="outline" className="text-xs">
                              <Package className="w-3 h-3 mr-1" />
                              {scan.product.name}
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">
                              Nicht gefunden
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatTime(scan.timestamp)}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Product Details */}
          <div>
            {scannedProduct ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Produkt gefunden
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold">{scannedProduct.name}</h3>
                    <p className="text-muted-foreground text-sm">
                      {scannedProduct.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Kategorie:</span>
                      <p className="font-medium">{categoryName}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Barcode:</span>
                      <p className="font-mono">{scannedProduct.barcode}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Einkaufspreis:</span>
                      <p className="font-medium">
                        €{scannedProduct.cost_price.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Verkaufspreis:</span>
                      <p className="font-medium">
                        €{scannedProduct.sell_price.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {stockInfo && (
                    <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                      <h4 className="font-medium text-sm">Bestandsinformationen</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Aktueller Bestand:</span>
                          <p className="font-medium">
                            {stockInfo.current_quantity as number}{" "}
                            {getUnitLabel(scannedProduct.unit_type)}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Mindestbestand:</span>
                          <p className="font-medium">
                            {stockInfo.min_threshold as number}{" "}
                            {getUnitLabel(scannedProduct.unit_type)}
                          </p>
                        </div>
                        <div className="col-span-2">
                          <span className="text-muted-foreground">Lagerort:</span>
                          <p className="font-medium">{stockInfo.location as string}</p>
                        </div>
                      </div>
                      {(stockInfo.current_quantity as number) <=
                        (stockInfo.min_threshold as number) && (
                        <div className="flex items-center gap-2 text-destructive text-sm mt-2">
                          <AlertTriangle className="h-4 w-4" />
                          <span>Unter Mindestbestand — Nachbestellen!</span>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center h-64">
                  <div className="text-center space-y-2">
                    <ScanBarcode className="w-12 h-12 mx-auto text-muted-foreground" />
                    <h3 className="text-lg font-semibold">Bereit zum Scannen</h3>
                    <p className="text-muted-foreground text-sm">
                      Geben Sie einen Barcode ein oder klicken Sie auf ein Beispiel
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </WeltInventarLayout>
  );
}
