import React, { useState, useEffect, useRef } from 'react';
import { Send, Users } from 'lucide-react';
import { INITIAL_MESSAGES, CURRENT_USER_ID } from '../constants';
import { ChatMessage } from '../types';

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      senderId: CURRENT_USER_ID,
      senderName: 'Moi',
      text: inputText,
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      isMe: true
    };

    setMessages([...messages, newMessage]);
    setInputText('');
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 pb-20">
      {/* Header */}
      <div className="px-4 py-3 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-600 to-blue-700 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Users className="text-white" size={20} />
          </div>
          <div>
            <h2 className="font-bold text-white leading-none">Club Général</h2>
            <span className="text-[10px] text-green-400 font-mono">● 12 en ligne</span>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}`}>
              {!msg.isMe && (
                <span className="text-[10px] text-slate-400 mb-1 ml-2">{msg.senderName}</span>
              )}
              <div 
                className={`px-4 py-2 rounded-2xl text-sm relative ${
                  msg.isMe 
                    ? 'bg-cyan-600 text-white rounded-tr-none shadow-[0_0_15px_-5px_rgba(8,145,178,0.5)]' 
                    : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'
                }`}
              >
                {msg.text}
              </div>
              <span className="text-[9px] text-slate-600 mt-1 px-1">{msg.timestamp}</span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-slate-900/90 border-t border-slate-800 sticky bottom-16">
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Écrire un message..."
            className="flex-1 bg-slate-950 border border-slate-700 rounded-full px-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
          />
          <button 
            type="submit" 
            className="w-10 h-10 rounded-full bg-cyan-600 hover:bg-cyan-500 flex items-center justify-center text-white shadow-lg shadow-cyan-500/30 transition-colors"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat;