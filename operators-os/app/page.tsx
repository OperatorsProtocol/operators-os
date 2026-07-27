'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import UpgradeButton from '../components/UpgradeButton';

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
  
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = '/login';
      } else {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_pro')
          .eq('id', session.user.id)
          .single();
          
        setUser({ ...session.user, is_pro: profile?.is_pro || false });
      }
    };
    checkUser();
  }, []);

  // EVERYONE can generate a blueprint (The Hook)
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
          // Default them to false so the user has to click to activate
          initialStatus[a.agent_id] = false; 
        });
        setActiveAgents(initialStatus);
      }
    } catch (error) {
      console.error('Error generating blueprint:', error);
    }
    
    setLoading(false);
  };

  // ONLY PRO USERS can activate agents
  const toggleAgent = (id: string) => {
    if (!user?.is_pro) {
      alert("Pro License Required ($49.99/mo) to activate and deploy live agents.");
      return;
    }
    setActiveAgents(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // ONLY PRO USERS can save architectures
  const saveBlueprintToDb = async () => {
    if (!blueprint || !user) return;
    
    if (!user?.is_pro) {
      alert("Pro License Required to secure architectures permanently.");
      return;
    }

    setIsSaving(true);
    setSaveStatus('Saving to database...');

    const { error } = await supabase
      .from('blueprints')
      .insert([
        {
          system_name: blueprint.system_name,
          architecture_type: blueprint.architecture_type,
          agents: blueprint.agents,
          user_id: user.id 
        }
      ]);

    if (error) {
      setSaveStatus(`Error: ${error.message}`);
      console.error(error);
    } else {
      setSaveStatus('Architecture secured permanently! 🚀');
    }
    setIsSaving(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  if (!user) return <div className="min-h-screen bg-black text-green-500 flex items-center justify-center font-mono">Initializing Operators OS...</div>;

  return (
    <div className="min-h-screen bg-black text-white p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8 mt-6">
        
        <div className="flex flex-wrap items-center justify-between border-b border-green-900/50 pb-6 gap-4">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-green-500">
              Operators OS
            </h1>
            <p className="text-gray-400 mt-1">Autonomous Agency Workforce Management</p>
          </div>
          
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-sm text-gray-500 font-mono">
              User: <span className="text-yellow-500">{user.email}</span>
            </span>
            
            <a href="/logs" className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-green-400 text-sm font-bold rounded-lg border border-green-900/50 transition-all flex items-center gap-2">
              View System Logs
            </a>

            <UpgradeButton userId={user.id} />

            <button onClick={handleLogout} className="px-4 py-2 bg-red-950/30 hover:bg-red-900/50 text-red-400 text-sm font-bold rounded-lg border border-red-900/30 transition-all">
              Sign Out
            </button>
            <span className="px-3 py-1 bg-green-500/10 text-green-500 border border-green-500/30 text-xs font-mono rounded-full tracking-widest shadow-[0_0_10px_rgba(34,197,94,0.2)]">
              {user.is_pro ? 'PRO ACTIVE' : 'FREE TIER'}
            </span>
          </div>
        </div>
        
        <div className="space-y-4">
          <textarea
            className="w-full h-32 p-5 bg-gray-950 border border-green-900/30 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:outline-none text-gray-100 placeholder-gray-700 text-lg shadow-inner"
            placeholder="e.g., Build an automated workflow for a trade contractor handling inbound leads, estimating, and invoices..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          
          <button
            onClick={generateBlueprint}
            disabled={loading}
            className="px-8 py-4 bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-black rounded-xl font-extrabold transition-all shadow-[0_0_15px_rgba(234,179,8,0.3)] disabled:opacity-50 text-lg uppercase tracking-wide"
          >
            {loading ? 'Designing Workforce...' : 'Deploy Digital Workforce'}
          </button>
        </div>

        {blueprint && (
          <div className="space-y-6 pt-6 border-t border-green-900/50 mt-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-white">{blueprint.system_name}</h2>
                <span className="text-sm text-yellow-500 font-mono tracking-widest uppercase">{blueprint.architecture_type}</span>
              </div>
              
              <div className="flex items-center gap-4">
                <span className="text-sm text-green-400 font-mono">{saveStatus}</span>
                <button
                  onClick={saveBlueprintToDb}
                  disabled={isSaving}
                  className="px-6 py-3 bg-green-600 hover:bg-green-500 text-black rounded-lg font-bold transition-all shadow-[0_0_15px_rgba(34,197,94,0.3)] disabled:opacity-50 uppercase tracking-wide"
                >
                  {isSaving ? 'Securing...' : 'Save Architecture'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {blueprint.agents.map((agent) => (
                <div 
                  key={agent.agent_id} 
                  className={`p-6 bg-gray-950 border rounded-2xl transition-all ${
                    activeAgents[agent.agent_id] ? 'border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.1)]' : 'border-gray-800 opacity-50'
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="text-xs font-mono text-yellow-500 font-semibold">{agent.agent_id}</span>
                      <h3 className="text-2xl font-bold text-gray-100 mt-1">{agent.name}</h3>
                    </div>
                    <button
                      onClick={() => toggleAgent(agent.agent_id)}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                        activeAgents[agent.agent_id] 
                          ? 'bg-green-500/20 text-green-400 border border-green-500/50' 
                          : 'bg-gray-900 text-gray-500 border border-gray-800'
                      }`}
                    >
                      {activeAgents[agent.agent_id] ? 'ACTIVE' : 'STANDBY'}
                    </button>
                  </div>

                  <p className="text-sm text-gray-400 mb-5 leading-relaxed">{agent.role}</p>

                  <div className="space-y-4 pt-4 border-t border-gray-900">
                    <div>
                      <span className="text-xs text-gray-600 uppercase tracking-widest font-bold">Integrated Tools:</span>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {agent.tools.map((tool, idx) => (
                          <span key={idx} className="px-3 py-1 bg-black text-yellow-500/80 rounded border border-yellow-900/30 text-xs font-mono">
                            {tool}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="text-xs text-gray-600 uppercase tracking-widest font-bold">Primary Output:</span>
                      <p className="text-sm text-green-500 font-mono mt-1 bg-black p-2 rounded border border-green-900/30">{agent.outputs}</p>
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