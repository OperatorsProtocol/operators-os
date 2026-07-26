'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Agent {
  agent_id: string;
  name: string;
  role: string;
  tools: string[];
  outputs: string;
}

interface Blueprint {
  system_name: string;
  architecture_type: string;
  agents: Agent[];
}

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [blueprint, setBlueprint] = useState<Blueprint | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeAgents, setActiveAgents] = useState<{ [key: string]: boolean }>({});
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  
  // NEW: State to hold the logged-in user
  const [user, setUser] = useState<any>(null);

  // NEW: Check for an active session when the page loads
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // If they aren't logged in, kick them to the login screen
        window.location.href = '/login';
      } else {
        setUser(session.user);
      }
    };
    checkUser();
  }, []);

  const generateBlueprint = async () => {
    if (!prompt) return;
    setLoading(true);
    setBlueprint(null);
    setSaveStatus('');
    
    try {
      const res = await fetch('/api/architect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      
      const data = await res.json();
      if (data.result) {
        setBlueprint(data.result);
        const initialStatus: { [key: string]: boolean } = {};
        data.result.agents.forEach((a: Agent) => {
          initialStatus[a.agent_id] = true;
        });
        setActiveAgents(initialStatus);
      }
    } catch (error) {
      console.error('Error generating blueprint:', error);
    }
    
    setLoading(false);
  };

  const toggleAgent = (id: string) => {
    setActiveAgents(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const saveBlueprintToDb = async () => {
    if (!blueprint || !user) return;
    setIsSaving(true);
    setSaveStatus('Saving to database...');

    const { error } = await supabase
      .from('blueprints')
      .insert([
        {
          system_name: blueprint.system_name,
          architecture_type: blueprint.architecture_type,
          agents: blueprint.agents,
          user_id: user.id // NEW: Tag the blueprint with the user's unique ID!
        }
      ]);

    if (error) {
      setSaveStatus(`Error: ${error.message}`);
      console.error(error);
    } else {
      setSaveStatus('Blueprint saved permanently! 🚀');
    }
    setIsSaving(false);
  };

  // NEW: Logout function
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  if (!user) return <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">Loading Data Core...</div>;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-8 mt-12">
        
        {/* UPDATED HEADER WITH USER INFO */}
        <div className="flex items-center justify-between border-b border-gray-800 pb-6">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
              Operators OS
            </h1>
            <p className="text-gray-400 mt-1">Autonomous Agency Workforce Management</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500 font-mono">
              Logged in: <span className="text-blue-400">{user.email}</span>
            </span>
            <button 
              onClick={handleLogout}
              className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold rounded border border-gray-700 transition-all"
            >
              Sign Out
            </button>
            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono rounded-full">
              SYSTEM ONLINE
            </span>
          </div>
        </div>
        
        <div className="space-y-4">
          <textarea
            className="w-full h-32 p-4 bg-gray-900 border border-gray-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-100 placeholder-gray-600 text-base shadow-inner"
            placeholder="e.g., Build an automated workflow for a trade contractor handling inbound leads, estimating, and invoices..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          
          <button
            onClick={generateBlueprint}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold transition-all shadow-lg shadow-blue-900/20 disabled:opacity-50"
          >
            {loading ? 'Designing Workforce...' : 'Deploy Digital Workforce'}
          </button>
        </div>

        {blueprint && (
          <div className="space-y-6 pt-6 border-t border-gray-800 mt-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">{blueprint.system_name}</h2>
                <span className="text-xs text-gray-500 font-mono">{blueprint.architecture_type}</span>
              </div>
              
              <div className="flex items-center gap-4">
                <span className="text-sm text-emerald-400 font-mono">{saveStatus}</span>
                <button
                  onClick={saveBlueprintToDb}
                  disabled={isSaving}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold transition-all shadow-lg shadow-emerald-900/20 disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Architecture'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {blueprint.agents.map((agent) => (
                <div 
                  key={agent.agent_id} 
                  className={`p-6 bg-gray-900 border rounded-2xl transition-all ${
                    activeAgents[agent.agent_id] ? 'border-blue-500/50 shadow-lg shadow-blue-950/20' : 'border-gray-800 opacity-60'
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="text-xs font-mono text-blue-400 font-semibold">{agent.agent_id}</span>
                      <h3 className="text-xl font-bold text-gray-100">{agent.name}</h3>
                    </div>
                    <button
                      onClick={() => toggleAgent(agent.agent_id)}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                        activeAgents[agent.agent_id] 
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                          : 'bg-gray-800 text-gray-400 border border-gray-700'
                      }`}
                    >
                      {activeAgents[agent.agent_id] ? 'ACTIVE' : 'PAUSED'}
                    </button>
                  </div>

                  <p className="text-sm text-gray-400 mb-4">{agent.role}</p>

                  <div className="space-y-3 pt-3 border-t border-gray-800">
                    <div>
                      <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Integrated Tools:</span>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {agent.tools.map((tool, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-gray-800 text-gray-300 rounded text-xs border border-gray-700">
                            {tool}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Primary Output:</span>
                      <p className="text-xs text-emerald-400 font-mono mt-0.5">{agent.outputs}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}