'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams, useRouter } from 'next/navigation';

export default function DynamicAgentPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string; 
  
  const [agentName, setAgentName] = useState('Loading Engine...');
  const [agentRole, setAgentRole] = useState('');
  const [agentPrompt, setAgentPrompt] = useState('');
  const [input, setInput] = useState('');

  // Execution & Target Recipient State
  const [targetEmail, setTargetEmail] = useState('operatorsprotocol@gmail.com');
  const [isExecuting, setIsExecuting] = useState(false);

  // Expanded Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editBatch, setEditBatch] = useState('');
  const [editTools, setEditTools] = useState('');
  const [editPrompt, setEditPrompt] = useState('');

  useEffect(() => {
    const fetchAgentData = async () => {
      const { data } = await supabase.from('agents').select('*').eq('id', id).single();
      if (data) {
        setAgentName(data.name);
        setAgentRole(data.role || '');
        setAgentPrompt(data.system_prompt || '');
        
        setEditName(data.name);
        setEditRole(data.role || '');
        setEditBatch(data.batch_name || 'Default Workforce');
        setEditTools(data.tools ? data.tools.join(', ') : '');
        setEditPrompt(data.system_prompt || '');
      }
    };
    fetchAgentData();
  }, [id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const toolsArray = editTools.split(',').map(t => t.trim()).filter(Boolean);

    const { error } = await supabase
      .from('agents')
      .update({ 
        name: editName, 
        role: editRole, 
        batch_name: editBatch,
        tools: toolsArray.length > 0 ? toolsArray : null,
        system_prompt: editPrompt 
      })
      .eq('id', id);

    if (!error) {
      setAgentName(editName);
      setAgentRole(editRole);
      setAgentPrompt(editPrompt);
      setIsEditing(false);
    } else {
      alert('Failed to update agent settings.');
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to permanently delete this agent?')) {
      const { error } = await supabase.from('agents').delete().eq('id', id);
      if (!error) {
        router.push('/dashboard');
      }
    }
  };

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: `/api/agent?id=${id}`, 
    }),
  });

  const onSubmitChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      sendMessage({ text: input });
      setInput('');
    }
  };

  // Real-World Execution Handler (Dispatches live emails via /api/agent/execute)
  const handleExecuteTask = async () => {
    if (!input.trim()) {
      alert('Please enter a task prompt for the agent to execute.');
      return;
    }

    setIsExecuting(true);
    try {
      const res = await fetch('/api/agent/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskPrompt: input,
          recipientEmail: targetEmail,
          clientName: agentName,
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert(`🚀 Success! Agent generated and dispatched email to ${targetEmail}`);
        setInput('');
      } else {
        alert(`Execution Error: ${data.error}`);
      }
    } catch (error: any) {
      console.error('Execution error:', error);
      alert('Failed to execute agent action.');
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[#0B0D0F] text-white p-6 overflow-hidden">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6 border-b border-gray-800 pb-4 shrink-0">
        <div className="flex items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{agentName}</h1>
              <span className="px-3 py-1 bg-gray-900 border border-gray-800 rounded-full text-[10px] font-bold text-yellow-500 uppercase tracking-wider">
                {agentRole || 'Active Agent'}
              </span>
            </div>
            <p className="text-gray-400 text-xs mt-1">Status: Active & Online</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-gray-900 border border-gray-700 text-xs font-bold rounded-xl hover:bg-gray-800 transition-colors text-gray-300"
          >
            ← Back to Command
          </button>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-4 py-2 bg-gray-900 border border-gray-700 text-xs font-bold rounded-xl hover:bg-gray-800 transition-colors"
          >
            {isEditing ? 'Close Editor' : '⚙️ Customize Agent'}
          </button>
        </div>
      </div>

      {/* Expanded Inline Edit Panel */}
      {isEditing && (
        <form onSubmit={handleSave} className="mb-6 p-5 bg-gray-950 border border-yellow-500/30 rounded-2xl flex flex-col gap-4 shrink-0 shadow-2xl">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-yellow-500 uppercase tracking-wider">Agent Configuration Parameters</h3>
            <button
              type="button"
              onClick={handleDelete}
              className="px-4 py-1.5 bg-red-950 border border-red-800 text-red-400 text-xs font-bold rounded-xl hover:bg-red-900 transition-colors"
            >
              🗑️ Delete Agent
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Agent Name</label>
              <input value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full p-3 rounded-xl bg-gray-900 border border-gray-700 text-white text-sm focus:outline-none focus:border-yellow-500" />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Module Group (Batch Name)</label>
              <input value={editBatch} onChange={(e) => setEditBatch(e.target.value)} className="w-full p-3 rounded-xl bg-gray-900 border border-gray-700 text-white text-sm focus:outline-none focus:border-yellow-500" />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Operational Role</label>
              <input value={editRole} onChange={(e) => setEditRole(e.target.value)} className="w-full p-3 rounded-xl bg-gray-900 border border-gray-700 text-white text-sm focus:outline-none focus:border-yellow-500" />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Integrated Tools (Comma Separated)</label>
              <input value={editTools} onChange={(e) => setEditTools(e.target.value)} placeholder="calculateEstimate, fetchLeadData" className="w-full p-3 rounded-xl bg-gray-900 border border-gray-700 text-white text-sm focus:outline-none focus:border-yellow-500 font-mono" />
            </div>
          </div>
          
          <div>
            <label className="text-xs text-gray-400 block mb-1">System Prompt / Directive</label>
            <textarea value={editPrompt} onChange={(e) => setEditPrompt(e.target.value)} rows={3} className="w-full p-3 rounded-xl bg-gray-900 border border-gray-700 text-white text-sm focus:outline-none focus:border-yellow-500" />
          </div>
          
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 bg-gray-900 text-gray-400 text-xs font-bold rounded-xl hover:text-white">Cancel</button>
            <button type="submit" className="px-6 py-2 bg-yellow-500 text-black text-xs font-bold rounded-xl hover:bg-yellow-400 transition-colors">Save Changes</button>
          </div>
        </form>
      )}

      {/* Target Recipient Email Toolbar */}
      <div className="max-w-5xl mx-auto w-full mb-3 flex items-center justify-between bg-gray-900/80 border border-gray-800 p-3 rounded-xl">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Target Recipient Email:</span>
          <input
            type="email"
            value={targetEmail}
            onChange={(e) => setTargetEmail(e.target.value)}
            className="px-3 py-1 bg-gray-950 border border-gray-700 rounded-lg text-xs font-mono text-yellow-400 focus:outline-none focus:border-yellow-500"
          />
        </div>
        <span className="text-[11px] text-gray-500 italic">Connected to Resend Email Dispatch Engine</span>
      </div>
      
      {/* Chat Log Window */}
      <div className="flex-1 overflow-y-auto space-y-6 mb-6 pr-2 max-w-5xl mx-auto w-full">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`p-4 rounded-xl max-w-[80%] ${message.role === 'user' ? 'bg-blue-600' : 'bg-gray-800 border border-gray-700'}`}>
              <span className="font-bold text-xs uppercase opacity-50 block mb-1">
                {message.role === 'user' ? 'You' : 'Agent'}
              </span>
              {message.parts?.map((part, index) => (
                part.type === 'text' ? <span key={index}>{part.text}</span> : null
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Input Control Box */}
      <div className="max-w-5xl mx-auto w-full shrink-0 mb-2 flex flex-col gap-2">
        <form onSubmit={onSubmitChat} className="flex gap-3 w-full">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Give the agent a task (e.g., 'Draft a $1,200 quote for a panel upgrade')..."
            className="flex-1 p-4 rounded-xl bg-gray-900 border border-gray-700 text-white focus:outline-none focus:border-blue-500 text-sm"
            disabled={status !== 'ready' && status !== 'error'}
          />
          
          {/* Chat Mode Button */}
          <button 
            type="submit" 
            className="px-6 py-4 bg-gray-800 border border-gray-700 text-gray-200 font-bold text-xs rounded-xl hover:bg-gray-700 transition-colors"
          >
            Chat
          </button>

          {/* Real-World Action Execution Button */}
          <button
            type="button"
            onClick={handleExecuteTask}
            disabled={isExecuting}
            className="px-8 py-4 bg-yellow-500 text-black font-bold text-xs rounded-xl disabled:opacity-50 hover:bg-yellow-400 transition-all shadow-lg flex items-center gap-2 shrink-0"
          >
            {isExecuting ? 'Executing Action...' : '🚀 Execute & Send Email'}
          </button>
        </form>
      </div>

    </div>
  );
}