'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function LogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      const { data, error } = await supabase
        .from('agent_logs')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (data) setLogs(data);
      setLoading(false);
    };
    fetchLogs();
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-8 mt-12">
        <div className="border-b border-gray-800 pb-6 flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
              Live Agent Feed
            </h1>
            <p className="text-gray-400 mt-1">Real-time execution logs for your digital workforce.</p>
          </div>
          <a href="/" className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-bold transition-all border border-gray-700">
            Back to Dashboard
          </a>
        </div>

        {loading ? (
          <div className="text-gray-500 font-mono animate-pulse">Loading data core...</div>
        ) : (
          <div className="space-y-6">
            {logs.map((log) => (
              <div key={log.id} className="p-6 bg-gray-900 border border-gray-800 rounded-2xl shadow-lg">
                <div className="flex justify-between items-start mb-4">
                  <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono rounded-full uppercase font-bold">
                    {log.event_type}
                  </span>
                  <span className="text-xs text-gray-500 font-mono">
                    {new Date(log.created_at).toLocaleString()}
                  </span>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Incoming Payload</h3>
                    <pre className="p-4 bg-black/50 rounded-xl text-xs text-blue-300 font-mono overflow-x-auto border border-gray-800">
                      {JSON.stringify(log.input_payload, null, 2)}
                    </pre>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">AI Agent Output</h3>
                    <div className="p-4 bg-emerald-950/20 rounded-xl text-sm text-gray-200 border border-emerald-900/50 whitespace-pre-wrap leading-relaxed">
                      {log.agent_response}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {logs.length === 0 && (
              <div className="text-center p-12 border border-gray-800 rounded-2xl text-gray-500 font-mono">
                No agent executions found. Fire a webhook to see it live!
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}