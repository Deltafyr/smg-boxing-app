import React, { useState } from 'react';
import { Send, Users } from 'lucide-react';
import { User } from '../../types';

interface ChatProps { currentUser: User | null; }

const Chat: React.FC<ChatProps> = ({ currentUser }) => {
  return (
    <div className="flex flex-col h-full pb-20 relative bg-slate-950">
      <div className="px-4 py-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-cyan-600 flex items-center justify-center"><Users className="text-white" size={20} /></div>
          <div><h2 className="font-bold text-white text-sm">Canal Général</h2><span className="text-[10px] text-green-400 font-mono">● Live</span></div>
        </div>
      </div>
      <div className="flex-1 p-4 overflow-y-auto"><p className="text-center text-xs text-slate-500">Module Chat en attente de connexion Firebase.</p></div>
    </div>
  );
};
export default Chat;
