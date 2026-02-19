import React, { useState, useEffect } from 'react';
import { AppRoute, Announcement, User, Poll } from '../types';
import FuturisticCard from '../components/ui/FuturisticCard';
import { Timer, Trophy, Calendar, AlertCircle, Megaphone } from 'lucide-react';

interface HomeProps {
  onNavigate: (route: AppRoute) => void;
  announcements: Announcement;
  currentUser: User | null;
}

const Home: React.FC<HomeProps> = ({ onNavigate, announcements, currentUser }) => {
  const [activePoll, setActivePoll] = useState<Poll | null>(null);

  return (
    <div className="p-4 space-y-6 pb-20 max-w-lg mx-auto">
      <div className="flex flex-col items-center justify-center py-6 space-y-4">
        <div className="relative w-32 h-32 flex items-center justify-center bg-slate-950 rounded-full border border-slate-800 shadow-2xl overflow-hidden">
            <img src="/logo.png?v=2" alt="SMG Boxing Club" className="w-full h-full object-contain p-2"/>
        </div>
        <div className="text-center space-y-1">
             <h1 className="text-3xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-white to-rose-500">S.M.G BOXING</h1>
             {currentUser && <p className="text-xs text-slate-300 font-mono mt-2">Connecté : <span className="text-cyan-400 font-black uppercase">{currentUser.name}</span></p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button onClick={() => onNavigate(AppRoute.TIMER)} className="group col-span-2">
          <FuturisticCard className="flex items-center space-x-4 px-6 py-5" borderColor="cyan">
             <div className="bg-cyan-500/10 p-3 rounded-xl border border-cyan-500/20"><Timer className="w-6 h-6 text-cyan-400" /></div>
             <div className="text-left"><span className="block font-bold text-lg text-slate-100">Mode Entraînement</span><span className="text-xs text-slate-500">Timer & Tabata</span></div>
          </FuturisticCard>
        </button>
        <button onClick={() => onNavigate(AppRoute.TOURNAMENT)} className="group">
          <FuturisticCard className="flex flex-col items-center justify-center py-6" borderColor="rose"><Trophy className="w-8 h-8 text-rose-500 mb-3" /><span className="font-semibold text-slate-200 text-sm">Tournois</span></FuturisticCard>
        </button>
        <button onClick={() => onNavigate(AppRoute.CALENDAR)} className="group">
          <FuturisticCard className="flex flex-col items-center justify-center py-6" borderColor="slate"><Calendar className="w-8 h-8 text-purple-400 mb-3" /><span className="font-semibold text-slate-200 text-sm">Agenda</span></FuturisticCard>
        </button>
      </div>
    </div>
  );
};
export default Home;
