'use client';

import { useState } from 'react';

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const generateBlueprint = async () => {
    if (!prompt) return;
    setLoading(true);
    setResponse('');
    
    try {
      const res = await fetch('/api/architect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      
      const data = await res.json();
      setResponse(data.result || data.error);
    } catch (error: any) {
      setResponse('Error connecting to the Architect Agent.');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8 mt-12">
        <h1 className="text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
          Operators OS
        </h1>
        <p className="text-lg text-gray-400">
          Describe the business workflow you want to automate. The Master Architect Agent will draft your digital workforce blueprint.
        </p>
        
        <div className="space-y-4">
          <textarea
            className="w-full h-40 p-5 bg-gray-900 border border-gray-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-100 placeholder-gray-600 text-lg shadow-inner"
            placeholder="e.g., Build me a lead generation, quote estimating, and automated follow-up system..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          
          <button
            onClick={generateBlueprint}
            disabled={loading}
            className="px-8 py-4 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold text-lg transition-all shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Consulting Architect Agent...' : 'Generate Agent Blueprint'}
          </button>
        </div>

        {response && (
          <div className="mt-12 p-8 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl">
            <h3 className="text-2xl font-bold mb-6 text-emerald-400 border-b border-gray-800 pb-4">Architect Blueprint:</h3>
            <pre className="whitespace-pre-wrap text-base text-gray-300 font-mono leading-relaxed">
              {response}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}