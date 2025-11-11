export type OFFNutriments = {
  [k: string]: any;
};

export interface OFFProductParsed {
  barcode: string;
  productName: string | null;
  brand?: string | null;
  imageUrl?: string | null;
  servingSize: string | null;
  per: 'serving' | '100g';
  energyKcal: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  fiber: number | null;
  sodium: number | null;
}

const safeNum = (v: any): number | null => {
  const n = typeof v === 'string' ? parseFloat(v) : typeof v === 'number' ? v : NaN;
  return Number.isFinite(n) ? n : null;
};

const kjToKcal = (kj: number | null): number | null => (kj == null ? null : Math.round((kj / 4.184) * 10) / 10);

export async function fetchOpenFoodFactsProduct(barcode: string): Promise<OFFProductParsed | null> {
  const code = barcode.trim();
  if (!code) return null;
  const url = `https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(code)}.json`;
  const resp = await fetch(url, { headers: { 'Accept': 'application/json' } });
  if (!resp.ok) throw new Error(`OFF request failed: ${resp.status}`);
  const data = await resp.json();
  if (!data || data.status !== 1 || !data.product) return null;

  const p = data.product as any;
  const n: OFFNutriments = p.nutriments || {};

  // Prefer per serving when available, otherwise per 100g
  const energyKcalServing = safeNum(n['energy-kcal_serving']) ?? kjToKcal(safeNum(n['energy_serving']));
  const energyKcal100g = safeNum(n['energy-kcal_100g']) ?? kjToKcal(safeNum(n['energy_100g']));

  const choose = <T>(serving: T | null, g100: T | null): { val: T | null; per: 'serving' | '100g' } => {
    if (serving != null) return { val: serving, per: 'serving' };
    return { val: g100, per: '100g' };
  };

  const energySel = choose<number | null>(energyKcalServing, energyKcal100g);
  const proteinSel = choose<number | null>(safeNum(n['proteins_serving']), safeNum(n['proteins_100g']));
  const carbsSel = choose<number | null>(safeNum(n['carbohydrates_serving']), safeNum(n['carbohydrates_100g']));
  const fatSel = choose<number | null>(safeNum(n['fat_serving']), safeNum(n['fat_100g']));
  const fiberSel = choose<number | null>(safeNum(n['fiber_serving']), safeNum(n['fiber_100g']));
  const sodiumSel = choose<number | null>(safeNum(n['sodium_serving']), safeNum(n['sodium_100g']));

  // If different metrics disagree on per basis, prefer the energy basis
  const per: 'serving' | '100g' = energySel.per;

  return {
    barcode: code,
    productName: p.product_name || p.generic_name || null,
    brand: p.brands || null,
    imageUrl: p.image_front_small_url || p.image_url || null,
    servingSize: p.serving_size || null,
    per,
    energyKcal: energySel.val,
    protein: proteinSel.val,
    carbs: carbsSel.val,
    fat: fatSel.val,
    fiber: fiberSel.val,
    sodium: sodiumSel.val,
  };
}

// Lightweight name search against OpenFoodFacts for generic foods.
// Returns nutrients per 100g when available.
export interface OFFFoodNameResult {
  productName: string | null;
  imageUrl?: string | null;
  energyKcalPer100g: number | null;
  proteinPer100g: number | null;
  carbsPer100g: number | null;
  fatPer100g: number | null;
  source?: string;
}

export async function searchOpenFoodFactsByName(query: string): Promise<OFFFoodNameResult | null> {
  const q = (query || '').trim();
  if (!q) return null;

  const url = new URL('https://world.openfoodfacts.org/cgi/search.pl');
  url.searchParams.set('action', 'process');
  url.searchParams.set('search_terms', q);
  url.searchParams.set('json', '1');
  // Fetch more candidates to increase chance of having nutriments
  url.searchParams.set('page_size', '10');
  // Ask for nutriments explicitly (still returns other fields)
  url.searchParams.set('fields', 'product_name,image_front_small_url,image_url,nutriments,nutrition_data_per');

  const resp = await fetch(url.toString(), { headers: { 'Accept': 'application/json' } });
  if (!resp.ok) return null;
  const data = await resp.json();
  const products = Array.isArray(data?.products) ? data.products : [];
  if (!products.length) return null;

  const calcFromMacros = (n: OFFNutriments): number | null => {
    const p = safeNum(n['proteins_100g']);
    const c = safeNum(n['carbohydrates_100g']);
    const f = safeNum(n['fat_100g']);
    if (p == null && c == null && f == null) return null;
    const kcal = (p ?? 0) * 4 + (c ?? 0) * 4 + (f ?? 0) * 9;
    return Number.isFinite(kcal) ? Math.round(kcal) : null;
  };

  // Pick the first product that has energy per 100g or enough macros to estimate
  const chosen = products.find((p: any) => {
    const n: OFFNutriments = p?.nutriments || {};
    const e = safeNum(n['energy-kcal_100g']) ?? kjToKcal(safeNum(n['energy_100g']));
    const fromMacros = calcFromMacros(n);
    return e != null || fromMacros != null;
  }) || products[0];

  const n: OFFNutriments = chosen?.nutriments || {};
  const energyKcal100g = safeNum(n['energy-kcal_100g']) ?? kjToKcal(safeNum(n['energy_100g'])) ?? calcFromMacros(n);
  const protein100g = safeNum(n['proteins_100g']);
  const carbs100g = safeNum(n['carbohydrates_100g']);
  const fat100g = safeNum(n['fat_100g']);

  return {
    productName: chosen?.product_name || chosen?.generic_name || q || null,
    imageUrl: chosen?.image_front_small_url || chosen?.image_url || null,
    energyKcalPer100g: energyKcal100g ?? null,
    proteinPer100g: protein100g ?? null,
    carbsPer100g: carbs100g ?? null,
    fatPer100g: fat100g ?? null,
    source: 'OpenFoodFacts',
  };
}