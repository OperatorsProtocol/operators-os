'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useState } from 'react';

export default function AgentTestPage() {
  const [input, setInput] = useState('');
  
  // Vercel AI SDK 5.0 architecture uses a transport layer
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/agent',
    }),
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      sendMessage({ text: input }); // The new way to submit a message
      setInput(''); // Clear the text box manually
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-3xl mx-auto p-6 bg-[#0B0D0F] text-white">
      <h1 className="text-3xl font-bold mb-2">Operators OS</h1>
      <p className="text-gray-400 mb-8">Agent Engine: Gemini 3.6 Flash</p>
      
      {/* Chat History Window */}
      <div className="flex-1 overflow-y-auto space-y-6 mb-6 pr-2">
        {messages.map((message) => (
          <div 
            key={message.id} 
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`p-4 rounded-xl max-w-[80%] ${
              message.role === 'user' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-800 text-gray-100 border border-gray-700'
            }`}>
              <span className="font-bold text-xs uppercase opacity-50 block mb-1">
                {message.role === 'user' ? 'You' : 'Agent'}
              </span>
              
              {/* SDK 5.0 renders messages in 'parts' instead of plain text content */}
              {message.parts?.map((part, index) => (
                part.type === 'text' ? <span key={index}>{part.text}</span> : null
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Input Form */}
      <form onSubmit={onSubmit} className="flex gap-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Give the agent a task..."
          className="flex-1 p-4 rounded-xl bg-gray-900 border border-gray-700 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all disabled:opacity-50"
          disabled={status !== 'ready' && status !== 'error'}
        />
        <button 
          type="submit" 
          disabled={status !== 'ready' && status !== 'error'}
          className="px-8 py-4 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}