import { useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Scan } from 'lucide-react';
import FoodScannerLive from './FoodScannerLive';
import BarcodeScanner from './BarcodeScanner';

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export default function SmartFoodScanners() {
  const navigate = useNavigate();
  const q = useQuery();
  const mode = (q.get('mode') === 'barcode' ? 'barcode' : 'live') as 'live' | 'barcode';

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-sky-500 to-teal-500 flex items-center justify-center">
              <Scan className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">AI Smart Food Scanners</h1>
              <p className="text-xs text-muted-foreground">Live camera & barcode food analysis</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-5xl">
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Choose Mode</CardTitle>
            <CardDescription>Switch between Live Scan and Barcode Scan</CardDescription>
          </CardHeader>
        </Card>

        <Tabs defaultValue={mode} className="space-y-4">
          <TabsList className="w-full">
            <TabsTrigger value="live" className="flex-1">Live Scan</TabsTrigger>
            <TabsTrigger value="barcode" className="flex-1">Barcode Scan</TabsTrigger>
          </TabsList>

          <TabsContent value="live">
            <FoodScannerLive />
          </TabsContent>
          <TabsContent value="barcode">
            <BarcodeScanner />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}