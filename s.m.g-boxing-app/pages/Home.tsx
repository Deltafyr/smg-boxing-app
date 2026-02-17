import React from 'react';
import { AppRoute } from '../types';
import FuturisticCard from '../components/ui/FuturisticCard';
import { Timer, Trophy, Calendar, AlertCircle } from 'lucide-react';

interface HomeProps {
  onNavigate: (route: AppRoute) => void;
}

const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  return (
    <div className="p-4 space-y-6 pb-20">
      {/* Header / Logo Area */}
      <div className="flex flex-col items-center justify-center py-6 space-y-4">
        <div className="relative w-48 h-48 flex items-center justify-center filter drop-shadow-[0_0_15px_rgba(14,165,233,0.3)]">
           {/* Remplacement par l'image fournie */}
           <img 
             src="/logo.png" 
             alt="SMG Boxing Club" 
             className="w-full h-full object-contain hover:scale-105 transition-transform duration-500"
             onError={(e) => {
               // Fallback si l'image n'est pas chargée
               e.currentTarget.style.display = 'none';
               e.currentTarget.parentElement!.innerHTML = '<div class="text-center text-red-500">Logo missing</div>';
             }}
           />
        </div>
        <div className="text-center">
             <h1 className="text-2xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-white to-rose-500">
               S.M.G BOXING CLUB
             </h1>
             <p className="text-[10px] text-slate-400 tracking-[0.3em] uppercase mt-1">Excellence & Discipline</p>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-2 gap-4">
        <button onClick={() => onNavigate(AppRoute.TIMER)} className="group col-span-2">
          <FuturisticCard className="h-full flex flex-row items-center justify-between px-6 py-4 transition-transform group-active:scale-95 group-hover:border-cyan-500/50" borderColor="cyan">
             <div className="flex items-center space-x-4">
                <div className="bg-cyan-500/10 p-3 rounded-full">
                  <Timer className="w-6 h-6 text-cyan-400" />
                </div>
                <div className="text-left">
                  <span className="block font-bold text-lg text-slate-100">Mode Entraînement</span>
                  <span className="text-xs text-slate-500">Timer & Tabata</span>
                </div>
             </div>
             <div className="text-cyan-500">▶</div>
          </FuturisticCard>
        </button>

        <button onClick={() => onNavigate(AppRoute.TOURNAMENT)} className="group">
          <FuturisticCard className="h-full flex flex-col items-center justify-center py-6 transition-transform group-active:scale-95 group-hover:border-rose-500/50" borderColor="rose">
            <Trophy className="w-8 h-8 text-rose-500 mb-2" />
            <span className="font-semibold text-slate-200 text-sm">Tournois</span>
          </FuturisticCard>
        </button>

        <button onClick={() => onNavigate(AppRoute.CALENDAR)} className="group">
          <FuturisticCard className="h-full flex flex-col items-center justify-center py-6 transition-transform group-active:scale-95 hover:border-purple-500/50" borderColor="slate">
            <Calendar className="w-8 h-8 text-purple-400 mb-2" />
            <span className="font-semibold text-slate-200 text-sm">Agenda</span>
          </FuturisticCard>
        </button>
      </div>

      {/* Notification / Info Widget */}
      <FuturisticCard title="ACTUALITÉS">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
          <p className="text-xs text-slate-300 leading-relaxed">
            La salle sera fermée ce vendredi pour rénovation. Reprise des cours Lundi 18h.
            <br/>
            <span className="text-slate-500 mt-1 block">Il y a 2 heures</span>
          </p>
        </div>
      </FuturisticCard>
    </div>
  );
};

export default Home;