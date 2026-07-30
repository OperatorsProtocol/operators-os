'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function CreateAgentPage() {
  const [name, setName] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [status, setStatus] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('Saving...');

    // Note: Once auth is fully hooked up, we will dynamically grab the logged-in user's ID.
    // For this test, we are just inserting the name and prompt.
    const { error } = await supabase
      .from('agents')
      .insert([
        { 
          name: name, 
          system_prompt: systemPrompt,
          role: 'worker' 
        }
      ]);

    if (error) {
      console.error(error);
      setStatus('Error saving agent.');
    } else {
      setStatus('Agent saved successfully!');
      setName('');
      setSystemPrompt('');
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto p-6 bg-[#0B0D0F] text-white justify-center">
      <h1 className="text-3xl font-bold mb-2">Create New Agent</h1>
      <p className="text-gray-400 mb-8">Deploy a custom AI worker to your Operators OS fleet.</p>
      
      <form onSubmit={handleSave} className="flex flex-col gap-6">
        <div>
          <label className="block text-sm font-bold text-gray-400 mb-2 uppercase">Agent Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Lead Qualification Bot"
            className="w-full p-4 rounded-xl bg-gray-900 border border-gray-700 text-white focus:outline-none focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-400 mb-2 uppercase">Core Directive (System Prompt)</label>
          <textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            placeholder="You are an expert sales assistant. Your job is to..."
            className="w-full p-4 rounded-xl bg-gray-900 border border-gray-700 text-white focus:outline-none focus:border-blue-500 min-h-[200px]"
            required
          />
        </div>

        <button 
          type="submit" 
          className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-500 transition-colors"
        >
          Deploy Agent
        </button>

        {status && <p className="text-center font-bold text-sm mt-4">{status}</p>}
      </form>
    </div>
  );
}