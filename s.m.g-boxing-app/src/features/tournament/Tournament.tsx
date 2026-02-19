import React, { useState } from 'react';
import { User } from '../../types';
import FuturisticCard from '../../components/ui/FuturisticCard';
import { Trophy, Users } from 'lucide-react';

interface TournamentProps { currentUser: User; }

const Tournament: React.FC<TournamentProps> = ({ currentUser }) => {
  const = useState<'GESTION' | 'TIMELINE' | 'PALMARES' | 'PLANNING'>('TIMELINE');

  return (
    <div className="p-4 pb-24 h-full flex flex-col max-w-lg mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase">Arena</h2>
      </div>
      <div className="flex space-x-1 mb-6 bg-slate-950/50 p-1 rounded-2xl border border-slate-800 overflow-x-auto">
        <button onClick={() => setActiveTab('TIMELINE')} className="flex-1 min-w-[80px] py-2.5 text-[9px] font-black rounded-xl bg-cyan-600 text-white">TIMELINE</button>
      </div>
      {activeTab === 'TIMELINE' && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-600 opacity-30"><Trophy size={64} className="mb-4" /><p className="font-black italic uppercase tracking-widest">Arena Vide</p></div>
      )}
    </div>
  );
};
export default Tournament;
