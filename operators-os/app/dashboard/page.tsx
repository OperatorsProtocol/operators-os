'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const [groupedAgents, setGroupedAgents] = useState<Record<string, any[]>>({});
  const [activeTab, setActiveTab] = useState<string>('');
  
  // State for editing the group (batch) name
  const [editingTab, setEditingTab] = useState<string | null>(null);
  const [newTabName, setNewTabName] = useState<string>('');
  
  const router = useRouter();

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (data) {
      const grouped = data.reduce((acc, agent) => {
        const batch = agent.batch_name || 'Default Workforce';
        if (!acc[batch]) acc[batch] = [];
        acc[batch].push(agent);
        return acc;
      }, {});
      
      setGroupedAgents(grouped);
      
      // Auto-select the first tab if none is selected
      if (Object.keys(grouped).length > 0 && !activeTab) {
        setActiveTab(Object.keys(grouped)[0]);
      }
    }
  };

  const handleRenameGroup = async (oldName: string) => {
    if (!newTabName.trim() || newTabName === oldName) {
      setEditingTab(null);
      return;
    }

    // Update all agents that share this batch_name
    const { error } = await supabase
      .from('agents')
      .update({ batch_name: newTabName })
      .eq('batch_name', oldName);

    if (!error) {
      setActiveTab(newTabName);
      setEditingTab(null);
      fetchAgents(); // Refresh the grid
    } else {
      alert("Failed to rename group.");
    }
  };

  const handleClearDatabase = async () => {
    if (window.confirm("WARNING: This will permanently delete ALL agents from your database. Are you sure?")) {
      const { error } = await supabase.from('agents').delete().neq('id', '00000000-0000-0000-0000-000000000000'); 
      if (!error) {
        setGroupedAgents({});
        setActiveTab('');
      }
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#050505] text-white p-8 overflow-x-hidden">
      <div className="max-w-[1400px] mx-auto w-full">
        
        {/* Top Navigation & Controls */}
        <div className="flex justify-between items-end mb-10 border-b border-gray-900 pb-6">
          <div>
            <div className="flex items-center gap-4 mb-3">
              <button onClick={() => router.push('/')} className="text-gray-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-wider">
                ← Home
              </button>
            </div>
            <h1 className="text-4xl font-bold">Agent Command</h1>
            <p className="text-gray-400 mt-2">Manage, organize, and initialize your deployed AI workforce.</p>
          </div>
          
          <div className="flex gap-4">
            <button 
              onClick={handleClearDatabase}
              className="px-4 py-2 bg-transparent text-red-600 border border-red-900/50 hover:bg-red-950/30 font-bold rounded text-xs uppercase tracking-wider transition-colors"
            >
              Wipe Database
            </button>
            <button 
              onClick={() => router.push('/create-agent')} 
              className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded uppercase tracking-wider text-sm transition-colors"
            >
              + Deploy Single Agent
            </button>
          </div>
        </div>

        {Object.keys(groupedAgents).length === 0 ? (
          <div className="text-center py-20 border border-gray-900 rounded-xl bg-[#0a0a0a]">
            <p className="text-gray-500 mb-4 font-mono">No active operator systems found in grid.</p>
          </div>
        ) : (
          <>
            {/* Editable Organization Tabs */}
            <div className="flex gap-3 mb-10 overflow-x-auto pb-2 scrollbar-hide items-center">
              {Object.keys(groupedAgents).map((batchName) => (
                <div key={batchName} className="flex items-center">
                  {editingTab === batchName ? (
                    <div className="flex items-center bg-gray-900 rounded-lg p-1 border border-yellow-500/50">
                      <input 
                        autoFocus
                        value={newTabName}
                        onChange={(e) => setNewTabName(e.target.value)}
                        className="bg-transparent text-white text-sm font-bold px-3 py-1 outline-none"
                        onKeyDown={(e) => e.key === 'Enter' && handleRenameGroup(batchName)}
                      />
                      <button 
                        onClick={() => handleRenameGroup(batchName)}
                        className="px-3 py-1 bg-yellow-600 hover:bg-yellow-500 text-black text-xs font-bold rounded"
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <div className={`flex items-center rounded-lg transition-all ${
                      activeTab === batchName 
                        ? 'bg-[#1A1500] text-yellow-500 border border-yellow-900' 
                        : 'bg-gray-900 text-gray-500 border border-gray-800 hover:bg-gray-800 hover:text-gray-300'
                    }`}>
                      <button
                        onClick={() => setActiveTab(batchName)}
                        className="px-5 py-2.5 text-sm font-bold whitespace-nowrap"
                      >
                        {batchName} ({groupedAgents[batchName].length})
                      </button>
                      <button 
                        onClick={() => {
                          setEditingTab(batchName);
                          setNewTabName(batchName);
                        }}
                        className="pr-3 pl-1 text-gray-500 hover:text-white opacity-50 hover:opacity-100"
                        title="Rename Group"
                      >
                        ✎
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Blueprint Styled Cards Grid (Shows only active tab) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {groupedAgents[activeTab]?.map((agent, index) => {
                const agentId = agent.role || `agent_00${index + 1}`;
                const tools = agent.tools && agent.tools.length > 0 ? agent.tools : ['System Default Tool'];
                const primaryOutput = agent.primary_output || 'Executable Operations Output';

                return (
                  <div key={agent.id} className="bg-[#0B0C10] border border-[#1F2937] rounded-xl p-6 flex flex-col relative group hover:border-gray-600 transition-colors">
                    
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-[10px] font-mono font-bold text-yellow-600 uppercase tracking-widest">
                        {agentId}
                      </span>
                      <span className="text-[9px] font-bold text-gray-500 bg-gray-900 border border-gray-800 px-2 py-1 rounded uppercase tracking-widest">
                        Standby
                      </span>
                    </div>
                    
                    <h3 className="text-xl font-bold text-white mb-3">{agent.name}</h3>
                    <p className="text-gray-400 text-sm line-clamp-3 mb-8 min-h-[60px]">
                      {agent.system_prompt}
                    </p>

                    <div className="mb-8">
                      <span className="text-[10px] font-bold text-gray-700 uppercase tracking-widest mb-3 block">
                        Integrated Tools:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {tools.map((tool: string, idx: number) => (
                          <span key={idx} className="px-3 py-1 bg-[#1A1500] border border-yellow-900/30 rounded text-xs text-yellow-600 font-mono">
                            {tool}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mb-8 flex-1">
                      <span className="text-[10px] font-bold text-gray-700 uppercase tracking-widest mb-2 block">
                        Primary Output:
                      </span>
                      <p className="text-green-500 text-sm font-mono line-clamp-1">
                        {primaryOutput}
                      </p>
                    </div>

                    <button
                      onClick={() => router.push(`/agent/${agent.id}`)}
                      className="w-full py-3 bg-gray-900 border border-gray-700 text-gray-300 font-bold text-xs uppercase tracking-widest rounded hover:bg-white hover:text-black hover:border-white transition-all duration-300"
                    >
                      Initialize Interface
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}