// OpenRouter API client configured to use Google Gemini via OpenRouter
// Handles text and image processing using OpenRouter's API
import { parseFoodAnalysisResponse, type FoodAnalysis } from '@/lib/food-analysis-parser';

const API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const API_URL = 'https://openrouter.ai/api/v1/chat/completions';
// Use Gemini 2.5 Flash via OpenRouter
const GEMINI_MODEL = 'google/gemini-2.5-flash';

// Error class for OpenRouter API errors
export class OpenRouterError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OpenRouterError';
  }
}

// Main OpenRouter client class
export class OpenRouterClient {
  private initialized = false;

  constructor() {
    this.initialize();
  }

  // Chat with multi-turn messages
  async chat(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    options?: { model?: string }
  ): Promise<string> {
    this.checkInitialization();

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'MealGenie AI'
        },
        body: JSON.stringify({
          model: options?.model || GEMINI_MODEL,
          messages
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new OpenRouterError(errorData.error?.message || `API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content || '';
      if (!content) {
        console.warn('OpenRouter chat: empty content in response', data);
      }
      return content;
    } catch (error: unknown) {
      console.error('Error during OpenRouter chat:', error);
      const message = error instanceof Error ? error.message : 'Failed to complete chat request';
      throw new OpenRouterError(message);
    }
  }

  // Initialize the client with API key
  private initialize() {
    if (!API_KEY) {
      console.error('OpenRouter API key is missing. Please add it to your .env file as VITE_OPENROUTER_API_KEY');
      return;
    }

    this.initialized = true;
  }

  // Check if the client is properly initialized
  private checkInitialization() {
    if (!this.initialized) {
      throw new OpenRouterError('OpenRouter API client is not initialized. Check your API key.');
    }
  }

  // Generate text from a prompt using Gemini via OpenRouter
  async generateText(prompt: string): Promise<string> {
    this.checkInitialization();
    
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'MealGenie AI'
        },
        body: JSON.stringify({
          model: GEMINI_MODEL,
          messages: [
            { role: 'user', content: prompt }
          ]
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new OpenRouterError(errorData.error?.message || `API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content || '';
      if (!content) {
        console.warn('OpenRouter generateText: empty content in response', data);
      }
      return content;
    } catch (error: unknown) {
      console.error('Error generating text with OpenRouter:', error);
      const message = error instanceof Error ? error.message : 'Failed to generate text';
      throw new OpenRouterError(message);
    }
  }

  // Process an image with text prompt using Gemini via OpenRouter
  async processImage(imageData: File | Blob, prompt: string): Promise<string> {
    this.checkInitialization();
    
    try {
      // Convert image to base64
      const base64Image = await this.fileToBase64(imageData);
      
      console.log('Sending image to OpenRouter API...');
      
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'MealGenie AI'
        },
        body: JSON.stringify({
          model: GEMINI_MODEL,
          messages: [
            { 
              role: 'user', 
              content: [
                { type: 'text', text: prompt },
                { 
                  type: 'image_url', 
                  image_url: {
                    url: `data:${imageData.type || 'image/jpeg'};base64,${base64Image}`
                  }
                }
              ]
            }
          ]
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new OpenRouterError(errorData.error?.message || `API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content || '';
      if (!content) {
        console.warn('OpenRouter processImage: empty content in response', data);
      }
      return content;
    } catch (error: unknown) {
      console.error('Error processing image with OpenRouter:', error);
      const message = error instanceof Error ? error.message : 'Failed to process image';
      throw new OpenRouterError(message);
    }
  }

  // Analyze a food image and return structured food analysis using Gemini via OpenRouter
  async analyzeFoodImage(imageData: File | Blob): Promise<FoodAnalysis | null> {
    this.checkInitialization();
    const prompt = `You are a nutrition assistant.

Return ONLY a JSON object (no extra words), matching exactly this schema:
{
  "items": [
    {"name": string, "calories": number, "protein": number, "carbs": number, "fat": number, "quantity": string}
  ],
  "totalCalories": number,
  "totalProtein": number,
  "totalCarbs": number,
  "totalFat": number,
  "healthInsights": [string]
}

Rules:
- Use numbers only for nutrition fields (no units in values).
- Estimate portions in "quantity" as a short string (e.g., "1 cup", "150 g").
- Do not include any explanations or text outside the JSON.
- If unsure, make reasonable estimates.
Analyze the food in the image and follow the schema strictly.`;

    try {
      const text = await this.processImage(imageData, prompt);
      return parseFoodAnalysisResponse(text);
    } catch (err) {
      console.error('Error in analyzeFoodImage:', err);
      throw err;
    }
  }

  // Helper method to convert File/Blob to base64
  private fileToBase64(file: File | Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        // Extract the base64 data part
        const base64Data = result.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      reader.readAsDataURL(file);
    });
  }
}

// Create and export a singleton instance
export const openRouterClient = new OpenRouterClient();