'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchAgents = async () => {
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      
      if (authError || !session) {
        router.push('/login');
        return;
      }

      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        setAgents(data);
      } else if (error) {
        console.error("Error fetching agents:", error);
      }
      setLoading(false);
    };
    
    fetchAgents();
  }, [router]);

  // Explicitly typed accumulator for grouping agents by batch_name
  const groupedAgents = agents.reduce((acc: Record<string, any[]>, agent: any) => {
    const batch = agent.batch_name || 'Default Workforce';
    if (!acc[batch]) acc[batch] = [];
    acc[batch].push(agent);
    return acc;
  }, {});

  return (
    <div className="flex flex-col min-h-screen max-w-5xl mx-auto p-6 bg-[#0B0D0F] text-white">
      <div className="flex justify-between items-center mb-10 mt-8">
        <div>
          <h1 className="text-3xl font-bold mb-1">Agent Command</h1>
          <p className="text-gray-400">Manage your deployed active agents.</p>
        </div>
        <Link 
          href="/" 
          className="px-6 py-3 bg-green-600 text-black font-bold rounded-xl hover:bg-green-500 transition-colors shadow-[0_0_15px_rgba(34,197,94,0.3)]"
        >
          + Deploy New Agent
        </Link>
      </div>

      {loading ? (
        <p className="text-gray-400 animate-pulse font-mono">Initializing Agent Command...</p>
      ) : agents.length === 0 ? (
        <div className="p-10 border border-gray-800 rounded-2xl bg-gray-900/50 text-center">
          <p className="text-gray-400 mb-4">No agents deployed yet.</p>
        </div>
      ) : (
        (Object.entries(groupedAgents) as [string, any[]][]).map(([batchName, batchAgents]) => (
          <div key={batchName} className="mb-12">
            <div className="flex items-center gap-4 mb-6">
              <h2 className="text-xl font-bold text-yellow-500 font-mono tracking-wider">MODULE: {batchName}</h2>
              <div className="flex-1 h-[1px] bg-gray-800"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {batchAgents.map((agent: any) => (
                <div 
                  key={agent.id} 
                  className="p-6 border border-gray-800 rounded-2xl bg-gray-950 hover:border-green-900/50 hover:shadow-[0_0_15px_rgba(34,197,94,0.1)] transition-all flex flex-col relative overflow-hidden"
                >
                  <div className="flex flex-col gap-2 mb-4">
                    <span className="self-start px-3 py-1 bg-gray-900 border border-gray-800 rounded-full text-[10px] font-bold text-yellow-500 uppercase tracking-wider line-clamp-1">
                      {agent.role}
                    </span>
                    <h3 className="text-xl font-bold text-gray-100">{agent.name}</h3>
                  </div>
                  
                  <p className="text-gray-400 text-sm mb-6 line-clamp-3 flex-1 leading-relaxed">
                    {agent.system_prompt}
                  </p>
                  
                  <Link 
                    href={`/agent/${agent.id}`}
                    className="w-full block py-3 bg-white text-black text-center font-bold rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    Initialize Interface
                  </Link>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}