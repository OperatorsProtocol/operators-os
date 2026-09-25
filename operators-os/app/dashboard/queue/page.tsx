'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

// Define the shape of our queue items
type QueueItem = {
  id: string;
  client_name: string;
  client_email: string;
  agent_name: string;
  subject: string;
  body: string;
  status: string;
  created_at: string;
};

export default function ApprovalQueuePage() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Fetch pending drafts from Supabase
  const fetchQueue = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('review_queue')
      .select('*')
      .eq('status', 'PENDING_APPROVAL')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setQueue(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  // Handle the Approval & Email Dispatch
  const handleApprove = async (item: QueueItem) => {
    setProcessingId(item.id);
    try {
      const res = await fetch('/api/queue/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          queueId: item.id,
          finalSubject: item.subject, // In a future update, you can add text inputs to edit these first
          finalBody: item.body,
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert(`✅ Success! Email dispatched to ${item.client_email}`);
        // Remove the approved item from the UI list
        setQueue((prev) => prev.filter((q) => q.id !== item.id));
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to dispatch email.');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0D0F] text-white p-8">
      <div className="max-w-5xl mx-auto">
        
        <div className="flex items-center justify-between mb-8 border-b border-gray-800 pb-4">
          <div>
            <h1 className="text-3xl font-bold">Execution Review Queue</h1>
            <p className="text-gray-400 text-sm mt-1">Review AI-generated quotes before final dispatch.</p>
          </div>
          <button onClick={fetchQueue} className="px-4 py-2 bg-gray-900 border border-gray-700 text-xs font-bold rounded-xl hover:bg-gray-800">
            🔄 Refresh Queue
          </button>
        </div>

        {loading ? (
          <p className="text-gray-500 animate-pulse">Scanning for pending tasks...</p>
        ) : queue.length === 0 ? (
          <div className="p-12 border border-dashed border-gray-800 rounded-2xl text-center text-gray-500">
            No pending drafts. Your digital workforce is caught up.
          </div>
        ) : (
          <div className="space-y-6">
            {queue.map((item) => (
              <div key={item.id} className="bg-gray-900 border border-gray-700 rounded-2xl p-6 shadow-xl">
                
                {/* Header Information */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="px-2 py-1 bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 text-[10px] uppercase font-bold rounded">
                      Drafted by {item.agent_name}
                    </span>
                    <h2 className="text-lg font-bold mt-2">Target: {item.client_name}</h2>
                    <p className="text-sm font-mono text-gray-400">{item.client_email}</p>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(item.created_at).toLocaleString()}
                  </span>
                </div>

                {/* Email Draft Preview */}
                <div className="bg-gray-950 border border-gray-800 rounded-xl p-4 mb-4">
                  <p className="text-sm font-bold text-gray-300 border-b border-gray-800 pb-2 mb-2">
                    Subject: {item.subject}
                  </p>
                  <p className="text-sm text-gray-400 whitespace-pre-wrap font-mono">
                    {item.body}
                  </p>
                </div>

                {/* Action Toolbar */}
                <div className="flex justify-end gap-3">
                  <button className="px-5 py-2 bg-gray-800 text-gray-400 font-bold text-xs rounded-xl hover:bg-gray-700 hover:text-white transition-colors">
                    Reject & Delete
                  </button>
                  <button 
                    onClick={() => handleApprove(item)}
                    disabled={processingId === item.id}
                    className="px-6 py-2 bg-green-600 text-white font-bold text-xs rounded-xl hover:bg-green-500 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {processingId === item.id ? 'Dispatching...' : '✅ Approve & Send'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}