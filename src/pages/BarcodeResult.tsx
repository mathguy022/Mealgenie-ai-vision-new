import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Zap, Utensils } from 'lucide-react';
import { fetchOpenFoodFactsProduct, OFFProductParsed } from '@/lib/openfoodfacts';
import { useEffect, useMemo, useState } from 'react';

const format = (n: number | null, digits = 1) => (n == null ? '—' : (Math.round(n * Math.pow(10, digits)) / Math.pow(10, digits)).toString());

const BarcodeResult = () => {
  const { barcode } = useParams<{ barcode: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<OFFProductParsed | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [servings, setServings] = useState<number>(1);

  useEffect(() => {
    let active = true;
    const run = async () => {
      if (!barcode) return;
      setLoading(true);
      setError(null);
      try {
        const data = await fetchOpenFoodFactsProduct(barcode);
        if (!active) return;
        if (!data) {
          setProduct(null);
        } else {
          setProduct(data);
        }
      } catch (e) {
        if (!active) return;
        setError(e instanceof Error ? e.message : 'Failed to fetch product');
      } finally {
        if (active) setLoading(false);
      }
    };
    run();
    return () => {
      active = false;
    };
  }, [barcode]);

  const scaled = useMemo(() => {
    const m = (x: number | null) => (x == null ? null : x * servings);
    return {
      energyKcal: m(product?.energyKcal ?? null),
      protein: m(product?.protein ?? null),
      carbs: m(product?.carbs ?? null),
      fat: m(product?.fat ?? null),
      fiber: m(product?.fiber ?? null),
      sodium: m(product?.sodium ?? null),
    };
  }, [product, servings]);

  const onAddToLog = () => {
    toast({ title: 'Added to Daily Log', description: `${servings} serving(s) of ${product?.productName ?? 'item'} added.` });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => navigate('/barcode-scanner')}>
              <ArrowLeft className="w-5 h-5 mr-2" />
              Scan Again
            </Button>
            <h1 className="text-lg font-bold">Barcode Result</h1>
            <div className="w-20" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
        {/* Scanned Code */}
        <Card>
          <CardHeader>
            <CardTitle>Scanned Barcode</CardTitle>
            <CardDescription>Nutrition lookup using Open Food Facts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-muted">
              <p className="text-sm text-muted-foreground mb-1">Barcode (UPC/EAN)</p>
              <p className="font-mono text-2xl">{barcode}</p>
            </div>
          </CardContent>
        </Card>

        {/* Loading / Error / Not found */}
        {loading && (
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle>Fetching nutrition…</CardTitle>
              <CardDescription>Contacting Open Food Facts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-24 rounded-lg bg-muted animate-pulse" />
            </CardContent>
          </Card>
        )}

        {!loading && (error || !product) && (
          <Card className="border-destructive/20">
            <CardHeader>
              <CardTitle>No nutrition data found</CardTitle>
              <CardDescription>Try snapping a food photo instead</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center py-10 border-2 border-dashed rounded-lg">
                <Zap className="w-12 h-12 mx-auto text-muted-foreground" />
                <p className="mt-3 text-sm text-muted-foreground">
                  No data found for this barcode. Try snapping a food photo instead.
                </p>
              </div>
              <Button onClick={() => navigate('/food-analyzer')} className="w-full gradient-primary text-white">
                Open Food Analyzer
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Nutrition card */}
        {!loading && product && (
          <Card className="border-primary/20">
            <CardHeader>
              <div className="flex items-center gap-4">
                {product.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={product.imageUrl} alt={product.productName ?? 'Product'} className="w-16 h-16 rounded object-cover" />
                )}
                <div>
                  <CardTitle>{product.productName || 'Unknown Product'}</CardTitle>
                  <CardDescription>
                    {product.brand ? `${product.brand} • ` : ''}Per {product.per}{product.servingSize ? ` • Serving: ${product.servingSize}` : ''}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground mb-1">Calories</p>
                  <p className="text-2xl font-semibold">{format(scaled.energyKcal, 0)} kcal</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground mb-1">Protein</p>
                  <p className="text-xl">{format(scaled.protein)} g</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground mb-1">Carbs</p>
                  <p className="text-xl">{format(scaled.carbs)} g</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground mb-1">Fat</p>
                  <p className="text-xl">{format(scaled.fat)} g</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground mb-1">Fiber</p>
                  <p className="text-xl">{format(scaled.fiber)} g</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground mb-1">Sodium</p>
                  <p className="text-xl">{format(scaled.sodium)} g</p>
                </div>
              </div>

              {/* Portion Controls */}
              <div className="grid sm:grid-cols-3 gap-3 items-end">
                <div className="sm:col-span-2">
                  <Label htmlFor="servings">Servings</Label>
                  <Input
                    id="servings"
                    type="number"
                    min={0.1}
                    step={0.1}
                    value={servings}
                    onChange={(e) => setServings(Math.max(0.1, Number(e.target.value) || 1))}
                  />
                </div>
                <Button className="w-full gradient-primary text-white" onClick={onAddToLog}>
                  <Utensils className="w-4 h-4 mr-2" /> Add to Meal Log
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Button onClick={() => navigate('/barcode-scanner')} className="w-full" variant="outline">
          Scan Another Item
        </Button>
      </main>
    </div>
  );
};

export default BarcodeResult;