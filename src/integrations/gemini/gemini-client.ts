import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { FoodAnalysis, parseFoodAnalysisResponse } from '@/lib/food-analysis-parser';

// Initialize the Gemini API with the API key from environment variables
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

// Safety settings to filter out harmful content
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

// Error class for Gemini API errors
export class GeminiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GeminiError';
  }
}

// Main Gemini client class
export class GeminiClient {
  private genAI: GoogleGenerativeAI | null = null;
  private initialized = false;

  constructor() {
    this.initialize();
  }

  // Initialize the client with API key
  private initialize() {
    if (!apiKey) {
      console.error('Gemini API key is missing. Please add it to your .env file as VITE_GEMINI_API_KEY');
      return;
    }

    try {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize Gemini API:', error);
      throw new GeminiError('Failed to initialize Gemini API');
    }
  }

  // Check if the client is properly initialized
  private checkInitialization() {
    if (!this.initialized || !this.genAI) {
      throw new GeminiError('Gemini API client is not initialized. Check your API key.');
    }
  }

  // Generate text from a prompt
  async generateText(prompt: string): Promise<string> {
    this.checkInitialization();
    
    try {
      // Use Gemini 2.0 Flash model (more stable than 2.5)
      const model = this.genAI!.getGenerativeModel({ 
        model: "gemini-2.0-flash-exp",
        safetySettings,
      });
      
      const result = await model.generateContent(prompt);
      const response = result.response;
      return response.text();
    } catch (error: unknown) {
      console.error('Error generating text with Gemini:', error);
      const message = error instanceof Error ? error.message : 'Failed to generate text';
      throw new GeminiError(message);
    }
  }

  // Process an image with text prompt
  async processImage(imageData: File | Blob, prompt: string): Promise<string> {
    this.checkInitialization();
    
    try {
      console.log('Processing image with Gemini API, image type:', imageData.type);
      
      // Convert image to proper format for Gemini API
      const imageBytes = await this.fileToGenerativePart(imageData);
      
      // Use Gemini 2.0 Flash model for image processing (more stable than 2.5)
      const model = this.genAI!.getGenerativeModel({ 
        model: "gemini-2.0-flash-exp",
        safetySettings,
      });
      
      // Create proper content parts with both text and image
      const imagePart = {
        inlineData: {
          data: imageBytes.inlineData.data,
          mimeType: imageBytes.inlineData.mimeType || 'image/jpeg'
        }
      };
      
      console.log('Sending request to Gemini API with prompt:', prompt);
      const result = await model.generateContent([prompt, imagePart]);
      
      if (!result || !result.response) {
        throw new GeminiError('Empty response from Gemini API');
      }
      
      const response = result.response;
      console.log('Received response from Gemini API');
      return response.text();
    } catch (error: unknown) {
      console.error('Error processing image with Gemini:', error);
      const message = error instanceof Error ? error.message : 'Failed to process image';
      throw new GeminiError(message);
    }
  }

  // Process an image with text prompt and return structured food analysis
  async analyzeFoodImage(imageData: File | Blob): Promise<FoodAnalysis | null> {
    this.checkInitialization();
    
    try {
      console.log('Analyzing food image with Gemini API, image type:', imageData.type);
      
      // Convert image to proper format for Gemini API
      const imageBytes = await this.fileToGenerativePart(imageData);
      
      // Use Gemini 2.0 Flash model for image processing (more stable than 2.5)
      const model = this.genAI!.getGenerativeModel({ 
        model: "gemini-2.0-flash-exp",
        safetySettings,
      });
      
      // Create proper content parts with both text and image
      const imagePart = {
        inlineData: {
          data: imageBytes.inlineData.data,
          mimeType: imageBytes.inlineData.mimeType || 'image/jpeg'
        }
      };
      
      // Create a detailed prompt for food analysis
      const prompt = `You are an expert food nutritionist. Analyze this food image and provide a detailed JSON response with the following structure:
\`\`\`json
{
  "items": [
    {
      "name": "food name",
      "calories": number,
      "protein": number,
      "carbs": number,
      "fat": number,
      "quantity": "estimated quantity"
    }
  ],
  "totalCalories": number,
  "totalProtein": number,
  "totalCarbs": number,
  "totalFat": number,
  "healthInsights": ["insight 1", "insight 2"]
}
\`\`\`

Instructions:
1. Identify all food items in the image
2. Estimate portion sizes and quantities
3. Provide accurate nutritional information for each item
4. Calculate totals for all macronutrients
5. Include 2-3 health insights based on the meal composition
6. Respond ONLY with valid JSON in a code block. Do not include any other text.
7. If you cannot identify any food items, return an empty items array.`;
      
      console.log('Sending request to Gemini API for food analysis');
      const result = await model.generateContent([prompt, imagePart]);
      
      if (!result || !result.response) {
        throw new GeminiError('Empty response from Gemini API');
      }
      
      const response = result.response;
      const text = response.text();
      console.log('Received response from Gemini API for food analysis:', text);
      
      // Parse the response into a structured format
      return parseFoodAnalysisResponse(text);
    } catch (error: unknown) {
      console.error('Error analyzing food image with Gemini:', error);
      const message = error instanceof Error ? error.message : 'Failed to analyze food image';
      throw new GeminiError(message);
    }
  }

  // Helper method to convert File/Blob to format needed by Gemini API
  private async fileToGenerativePart(file: File | Blob): Promise<{ inlineData: { data: string; mimeType: string } }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        try {
          const result = reader.result as string;
          // Extract the base64 data part
          const base64Data = result.split(',')[1];
          const mimeType = file.type || 'image/jpeg';
          
          resolve({
            inlineData: {
              data: base64Data,
              mimeType
            }
          });
        } catch (error) {
          reject(new Error('Failed to process image data'));
        }
      };
      reader.onerror = () => {
        reject(new Error('Failed to read image file'));
      };
      reader.readAsDataURL(file);
    });
  }
}

// Create and export a singleton instance
export const geminiClient = new GeminiClient();