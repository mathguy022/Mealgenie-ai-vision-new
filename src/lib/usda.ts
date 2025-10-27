const USDA_API_KEY = import.meta.env.VITE_USDA_API_KEY as string | undefined;

export type USDAFood = {
  description: string;
  calories?: number | null;
  protein_g?: number | null;
  carbs_g?: number | null;
  fat_g?: number | null;
  source?: string;
};

// Lightweight USDA FoodData Central search for a common food name.
// Returns top match macros when possible. If no API key, returns null gracefully.
export async function searchUSDAFood(query: string): Promise<USDAFood | null> {
  if (!USDA_API_KEY) return null;
  try {
    const url = new URL('https://api.nal.usda.gov/fdc/v1/foods/search');
    url.searchParams.set('api_key', USDA_API_KEY);
    url.searchParams.set('query', query);
    url.searchParams.set('pageSize', '1');

    const res = await fetch(url.toString());
    if (!res.ok) return null;
    const data = await res.json();
    const food = data?.foods?.[0];
    if (!food) return null;

    const nutrients = (food.foodNutrients || []) as Array<{ nutrientName?: string; value?: number; unitName?: string }>;

    const getVal = (name: string) => {
      const n = nutrients.find(nu => (nu.nutrientName || '').toLowerCase().includes(name));
      return typeof n?.value === 'number' ? n.value : null;
    };

    const calories = getVal('energy') || getVal('calorie');
    const protein = getVal('protein');
    const carbs = getVal('carbohydrate');
    const fat = getVal('fat');

    return {
      description: food.description || query,
      calories: calories ?? null,
      protein_g: protein ?? null,
      carbs_g: carbs ?? null,
      fat_g: fat ?? null,
      source: 'USDA FDC',
    };
  } catch {
    return null;
  }
}