import React from 'react';
import { AppRoute, Announcement, User } from '../types';
import FuturisticCard from '../components/ui/FuturisticCard';
import { Timer, Trophy, Calendar, AlertCircle, Megaphone } from 'lucide-react';

interface HomeProps {
  onNavigate: (route: AppRoute) => void;
  announcements: Announcement[];
  currentUser: User | null;
}

const Home: React.FC<HomeProps> = ({ onNavigate, announcements, currentUser }) => {
  // Use last announcement or default
  const defaultAnnouncement: Announcement = {
    id: 'default',
    title: 'Bienvenue',
    content: 'Bon entraînement à tous !',
    priority: 'Normal',
    date: new Date().toLocaleDateString(),
    author: 'S.M.G'
  };

  const latestAnnouncement = announcements.length > 0 
    ? announcements[announcements.length - 1] 
    : defaultAnnouncement;

  return (
    <div className="p-4 space-y-6 pb-20">
      {/* Header / Logo Area */}
      <div className="flex flex-col items-center justify-center py-6 space-y-4">
        <div className="relative group">
          {/* Animated Glow Effect */}
          <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500 via-blue-500 to-rose-500 rounded-full opacity-20 group-hover:opacity-40 blur-xl transition duration-1000 animate-pulse"></div>
          
          <div className="relative w-32 h-32 flex items-center justify-center bg-slate-950 rounded-full border border-slate-800 shadow-2xl overflow-hidden hover:scale-105 transition-transform duration-500">
             <img 
               src="/logo.png?v=2" 
               alt="SMG Boxing Club" 
               className="w-full h-full object-contain p-2"
               onError={(e) => {
                 // Fallback si l'image ne charge pas
                 e.currentTarget.style.display = 'none';
                 e.currentTarget.parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center bg-black"><span class="text-cyan-500 font-bold">SMG</span></div>';
               }}
             />
          </div>
        </div>
        
        <div className="text-center space-y-1">
             <h1 className="text-2xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-white to-rose-500 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">
               S.M.G BOXING
             </h1>
             {currentUser ? (
               <p className="text-sm text-slate-300 font-mono">
                 Bonjour, <span className="text-cyan-400 font-bold">{currentUser.name.split(' ')[0]}</span>
               </p>
             ) : (
               <p className="text-[10px] text-slate-400 tracking-[0.5em] uppercase font-mono">Club 01 • Excellence</p>
             )}
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-2 gap-4">
        <button onClick={() => onNavigate(AppRoute.TIMER)} className="group col-span-2">
          <FuturisticCard className="h-full flex flex-row items-center justify-between px-6 py-5 transition-all group-active:scale-[0.98] group-hover:border-cyan-500/50 group-hover:bg-slate-900/80" borderColor="cyan">
             <div className="flex items-center space-x-4">
                <div className="bg-cyan-500/10 p-3 rounded-xl border border-cyan-500/20 group-hover:bg-cyan-500/20 transition-colors">
                  <Timer className="w-6 h-6 text-cyan-400" />
                </div>
                <div className="text-left">
                  <span className="block font-bold text-lg text-slate-100">Mode Entraînement</span>
                  <span className="text-xs text-slate-500 group-hover:text-cyan-400/70 transition-colors">Timer & Tabata</span>
                </div>
             </div>
             <div className="text-cyan-500 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all">▶</div>
          </FuturisticCard>
        </button>

        <button onClick={() => onNavigate(AppRoute.TOURNAMENT)} className="group">
          <FuturisticCard className="h-full flex flex-col items-center justify-center py-6 transition-all group-active:scale-[0.98] group-hover:border-rose-500/50 group-hover:bg-slate-900/80" borderColor="rose">
            <Trophy className="w-8 h-8 text-rose-500 mb-3 drop-shadow-[0_0_8px_rgba(244,63,94,0.4)]" />
            <span className="font-semibold text-slate-200 text-sm">Tournois</span>
          </FuturisticCard>
        </button>

        <button onClick={() => onNavigate(AppRoute.CALENDAR)} className="group">
          <FuturisticCard className="h-full flex flex-col items-center justify-center py-6 transition-all group-active:scale-[0.98] hover:border-purple-500/50 group-hover:bg-slate-900/80" borderColor="slate">
            <Calendar className="w-8 h-8 text-purple-400 mb-3" />
            <span className="font-semibold text-slate-200 text-sm">Agenda</span>
          </FuturisticCard>
        </button>
      </div>

      {/* Notification / Info Widget (Dynamic) */}
      <FuturisticCard title="INFO CLUB" borderColor={latestAnnouncement.priority === 'High' ? 'rose' : 'slate'}>
        <div className="flex items-start space-x-3">
          {latestAnnouncement.priority === 'High' ? (
             <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5 animate-pulse" />
          ) : (
             <Megaphone className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
          )}
          
          <div className="flex-1">
             <div className="flex justify-between items-center mb-1">
               <span className="font-bold text-slate-200 text-sm">{latestAnnouncement.title}</span>
             </div>
             <p className="text-xs text-slate-300 leading-relaxed">
               {latestAnnouncement.content}
               <br/>
             </p>
             {latestAnnouncement.author && (
               <div className="mt-2 text-[10px] text-slate-500 font-mono text-right">
                 Par {latestAnnouncement.author}
               </div>
             )}
          </div>
        </div>
      </FuturisticCard>
    </div>
  );
};

export default Home;