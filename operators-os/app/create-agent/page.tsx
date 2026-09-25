'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

// Available tools based on your backend engine capabilities
const AVAILABLE_TOOLS = [
  { id: 'fetchLeadData', name: 'CRM Integration', desc: 'Pull client data and history' },
  { id: 'calculateEstimate', name: 'Estimate Engine', desc: 'Compute material & labor quotes' },
  { id: 'scheduleDispatch', name: 'Dispatch Scheduler', desc: 'Book tech calendar slots' },
  { id: 'calculate', name: 'Math Evaluator', desc: 'Run general numerical logic' }
];

export default function CreateAgentPage() {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [batchName, setBatchName] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [status, setStatus] = useState('');
  const router = useRouter();

  const toggleTool = (toolId: string) => {
    setSelectedTools(prev => 
      prev.includes(toolId) 
        ? prev.filter(t => t !== toolId)
        : [...prev, toolId]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('Deploying to grid...');

    const { error } = await supabase
      .from('agents')
      .insert([
        { 
          name: name, 
          system_prompt: systemPrompt,
          role: role || 'agent_module',
          batch_name: batchName || 'Electrical Contractor OS',
          tools: selectedTools.length > 0 ? selectedTools : null
        }
      ]);

    if (error) {
      console.error(error);
      setStatus('Error saving agent.');
    } else {
      setStatus('Agent deployed successfully! Redirecting...');
      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0B0D0F] text-white p-8">
      <div className="max-w-[1200px] mx-auto">
        
        {/* Header with Return Button */}
        <div className="flex justify-between items-center mb-8 border-b border-gray-800 pb-6">
          <div>
            <h1 className="text-4xl font-bold">Deploy New Agent</h1>
            <p className="text-gray-400 mt-2">Configure a specialized AI worker and assign it to a module group.</p>
          </div>
          <button 
            onClick={() => router.push('/dashboard')}
            type="button"
            className="px-4 py-2 bg-gray-900 border border-gray-700 text-sm font-bold rounded-xl hover:bg-gray-800 transition-colors text-gray-300"
          >
            ← Cancel & Return
          </button>
        </div>
        
        <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Left Column: Core Identity */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#111418] p-6 rounded-2xl border border-gray-800">
                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">Agent Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Estimating Bot"
                  className="w-full p-4 rounded-xl bg-gray-900 border border-gray-700 text-white text-sm focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              <div className="bg-[#111418] p-6 rounded-2xl border border-gray-800">
                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">Module Group (Batch Name)</label>
                <input
                  value={batchName}
                  onChange={(e) => setBatchName(e.target.value)}
                  placeholder="e.g., Electrical Contractor OS"
                  className="w-full p-4 rounded-xl bg-gray-900 border border-gray-700 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="bg-[#111418] p-6 rounded-2xl border border-gray-800">
              <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">Operational Role ID</label>
              <input
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g., agent_estimator"
                className="w-full p-4 rounded-xl bg-gray-900 border border-gray-700 text-white text-sm focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>

            <div className="bg-[#111418] p-6 rounded-2xl border border-gray-800">
              <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">Core Directive (System Prompt)</label>
              <textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder="You are an expert operations assistant. Your job is to..."
                className="w-full p-4 rounded-xl bg-gray-900 border border-gray-700 text-white text-sm focus:outline-none focus:border-blue-500 min-h-[250px]"
                required
              />
            </div>
          </div>

          {/* Right Column: Visual Tool Selector & Submit */}
          <div className="space-y-6 flex flex-col">
            <div className="bg-[#111418] p-6 rounded-2xl border border-gray-800 flex-1">
              <label className="block text-xs font-bold text-gray-400 mb-4 uppercase">Select Integrated Tools</label>
              <div className="flex flex-col gap-3">
                {AVAILABLE_TOOLS.map(tool => {
                  const isSelected = selectedTools.includes(tool.id);
                  return (
                    <div 
                      key={tool.id}
                      onClick={() => toggleTool(tool.id)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        isSelected 
                          ? 'bg-blue-900/20 border-blue-500' 
                          : 'bg-gray-900 border-gray-700 hover:border-gray-500'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className={`text-sm font-bold ${isSelected ? 'text-blue-400' : 'text-gray-300'}`}>
                          {tool.name}
                        </span>
                        <div className={`w-4 h-4 rounded-full border ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-600'}`} />
                      </div>
                      <p className="text-xs text-gray-500 font-mono">{tool.id}</p>
                      <p className="text-xs text-gray-400 mt-2">{tool.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full py-5 bg-green-600 hover:bg-green-500 text-white font-bold rounded-2xl transition-colors shadow-[0_0_20px_rgba(22,163,74,0.3)] text-lg"
            >
              Deploy Agent to Grid
            </button>
            {status && <p className="text-center font-bold text-sm text-yellow-500">{status}</p>}
          </div>

        </form>
      </div>
    </div>
  );
}