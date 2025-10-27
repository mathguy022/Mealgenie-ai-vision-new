// OpenRouter API client for GPT-4o integration
// This client handles text and image processing using OpenRouter's API

const API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const API_URL = 'https://openrouter.ai/api/v1/chat/completions';

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

  // Generate text from a prompt using GPT-4o
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
          model: 'openai/gpt-4o',
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
      return data.choices[0]?.message?.content || '';
    } catch (error: unknown) {
      console.error('Error generating text with OpenRouter:', error);
      const message = error instanceof Error ? error.message : 'Failed to generate text';
      throw new OpenRouterError(message);
    }
  }

  // Process an image with text prompt using GPT-4o
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
          model: 'anthropic/claude-3-opus:beta',
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
      return data.choices[0]?.message?.content || '';
    } catch (error: unknown) {
      console.error('Error processing image with OpenRouter:', error);
      const message = error instanceof Error ? error.message : 'Failed to process image';
      throw new OpenRouterError(message);
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