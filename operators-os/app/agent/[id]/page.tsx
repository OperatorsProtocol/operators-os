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

  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editPrompt, setEditPrompt] = useState('');

  // Fetch the agent details for the UI header and editor
  useEffect(() => {
    const fetchAgentData = async () => {
      const { data } = await supabase.from('agents').select('name, role, system_prompt').eq('id', id).single();
      if (data) {
        setAgentName(data.name);
        setAgentRole(data.role || '');
        setAgentPrompt(data.system_prompt || '');
        setEditName(data.name);
        setEditRole(data.role || '');
        setEditPrompt(data.system_prompt || '');
      }
    };
    fetchAgentData();
  }, [id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase
      .from('agents')
      .update({ name: editName, role: editRole, system_prompt: editPrompt })
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
    if (window.confirm('Are you sure you want to permanently delete this agent? This action cannot be undone.')) {
      const { error } = await supabase.from('agents').delete().eq('id', id);
      if (!error) {
        router.push('/dashboard');
      } else {
        alert('Failed to delete agent.');
      }
    }
  };

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: `/api/agent?id=${id}`, 
    }),
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      sendMessage({ text: input });
      setInput('');
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[#0B0D0F] text-white p-6 overflow-hidden">
      {/* Header & Configuration Toggle */}
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

      {/* Inline Edit & Delete Panel */}
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
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full p-3 rounded-xl bg-gray-900 border border-gray-700 text-white text-sm focus:outline-none focus:border-yellow-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Operational Role</label>
              <input
                value={editRole}
                onChange={(e) => setEditRole(e.target.value)}
                className="w-full p-3 rounded-xl bg-gray-900 border border-gray-700 text-white text-sm focus:outline-none focus:border-yellow-500"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">System Prompt / Directive</label>
            <textarea
              value={editPrompt}
              onChange={(e) => setEditPrompt(e.target.value)}
              rows={3}
              className="w-full p-3 rounded-xl bg-gray-900 border border-gray-700 text-white text-sm focus:outline-none focus:border-yellow-500"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 bg-gray-900 text-gray-400 text-xs font-bold rounded-xl hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-yellow-500 text-black text-xs font-bold rounded-xl hover:bg-yellow-400 transition-colors"
            >
              Save Changes
            </button>
          </div>
        </form>
      )}
      
      {/* Chat Log Window (Full Width) */}
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

      {/* Chat Input Form (Full Width) */}
      <form onSubmit={onSubmit} className="flex gap-3 max-w-5xl mx-auto w-full shrink-0 mb-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Give the agent a task..."
          className="flex-1 p-4 rounded-xl bg-gray-900 border border-gray-700 text-white focus:outline-none focus:border-blue-500"
          disabled={status !== 'ready' && status !== 'error'}
        />
        <button type="submit" className="px-8 py-4 bg-white text-black font-bold rounded-xl disabled:opacity-50 hover:bg-gray-200 transition-colors">
          Send
        </button>
      </form>
    </div>
  );
}