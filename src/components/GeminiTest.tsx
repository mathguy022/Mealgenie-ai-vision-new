import { useState } from 'react';
import { useGemini } from '../hooks/use-gemini';

export function GeminiTest() {
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const { generateText, processImage, isLoading, error } = useGemini({
    onError: (err) => console.error('Gemini error:', err)
  });

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    
    const response = await generateText(prompt);
    if (response) {
      setResult(response);
    }
  };

  const handleImageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || !file) return;
    
    const response = await processImage(file, prompt);
    if (response) {
      setResult(response);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Gemini API Test</h2>
      
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Text Generation</h3>
        <form onSubmit={handleTextSubmit} className="space-y-3">
          <div>
            <label htmlFor="prompt" className="block text-sm font-medium mb-1">
              Prompt
            </label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full p-2 border rounded-md"
              rows={3}
              placeholder="Enter your prompt here..."
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !prompt.trim()}
            className="px-4 py-2 bg-primary text-white rounded-md disabled:opacity-50"
          >
            {isLoading ? 'Generating...' : 'Generate Text'}
          </button>
        </form>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Image Processing</h3>
        <form onSubmit={handleImageSubmit} className="space-y-3">
          <div>
            <label htmlFor="image" className="block text-sm font-medium mb-1">
              Image
            </label>
            <input
              id="image"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full p-2 border rounded-md"
            />
          </div>
          <div>
            <label htmlFor="imagePrompt" className="block text-sm font-medium mb-1">
              Prompt
            </label>
            <textarea
              id="imagePrompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full p-2 border rounded-md"
              rows={3}
              placeholder="Enter your prompt about the image..."
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !prompt.trim() || !file}
            className="px-4 py-2 bg-primary text-white rounded-md disabled:opacity-50"
          >
            {isLoading ? 'Processing...' : 'Process Image'}
          </button>
        </form>
      </div>

      {error && (
        <div className="p-3 bg-red-100 border border-red-300 rounded-md mb-4">
          <p className="text-red-700">{error.message}</p>
        </div>
      )}

      {result && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Result</h3>
          <div className="p-4 bg-gray-100 rounded-md whitespace-pre-wrap">
            {result}
          </div>
        </div>
      )}
    </div>
  );
}