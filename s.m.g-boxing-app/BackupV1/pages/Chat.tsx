
import React, { useState, useEffect, useRef } from 'react';
import { Send, Users, Trash2 } from 'lucide-react';
import { INITIAL_MESSAGES } from '../constants';
import { ChatMessage, User } from '../types';

interface ChatProps {
  currentUser: User | null;
}

const Chat: React.FC<ChatProps> = ({ currentUser }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Charger les messages depuis le localStorage ou utiliser les initiaux
    const stored = localStorage.getItem('smg_chat_messages');
    if (stored) {
      setMessages(JSON.parse(stored));
    } else {
      setMessages(INITIAL_MESSAGES);
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !currentUser) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      senderId: currentUser.id,
      senderName: currentUser.name,
      text: inputText,
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      isMe: true 
    };

    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    localStorage.setItem('smg_chat_messages', JSON.stringify(updatedMessages));
    setInputText('');
  };

  const clearChat = () => {
    if (confirm('Effacer tout l\'historique du chat ? (Admin)')) {
      setMessages([]);
      localStorage.removeItem('smg_chat_messages');
    }
  };

  return (
    <div className="flex flex-col h-full pb-20 relative bg-slate-950">
      {/* Header - Sticky Top */}
      <div className="px-4 py-3 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 flex items-center justify-between sticky top-0 z-20 shadow-lg shadow-black/20">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-600 to-blue-700 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Users className="text-white" size={20} />
          </div>
          <div>
            <h2 className="font-bold text-white leading-none text-sm">Canal Général</h2>
            <span className="text-[10px] text-green-400 font-mono animate-pulse">● Live</span>
          </div>
        </div>
        {currentUser?.role === 'Admin' && (
          <button onClick={clearChat} className="text-slate-600 hover:text-rose-500 transition-colors">
            <Trash2 size={16} />
          </button>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 p-4 space-y-6 overflow-y-auto">
        {messages.map((msg) => {
           const isMe = msg.senderId === currentUser?.id;
           return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-fade-in`}>
              <div className={`max-w-[85%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                {!isMe && (
                  <span className="text-[10px] text-cyan-500 font-bold mb-1 ml-2 uppercase tracking-tighter">
                    {msg.senderName}
                  </span>
                )}
                <div 
                  className={`px-4 py-2.5 rounded-2xl text-sm relative leading-relaxed ${
                    isMe 
                      ? 'bg-gradient-to-br from-cyan-600 to-blue-700 text-white rounded-tr-none shadow-lg shadow-cyan-900/20' 
                      : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'
                  }`}
                >
                  {msg.text}
                </div>
                <span className="text-[8px] text-slate-600 mt-1 px-1 font-mono uppercase">{msg.timestamp}</span>
              </div>
            </div>
           );
        })}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 sticky bottom-0 z-20">
        <form onSubmit={handleSend} className="flex gap-2 max-w-lg mx-auto">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Message en tant que ${currentUser?.name.split(' ')[0]}...`}
            className="flex-1 bg-slate-950 border border-slate-700 rounded-full px-5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition-all placeholder:text-slate-600"
          />
          <button 
            type="submit" 
            className="w-10 h-10 rounded-full bg-cyan-600 hover:bg-cyan-500 flex items-center justify-center text-white shadow-lg shadow-cyan-500/30 transition-transform active:scale-90"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat;
