
import React, { useState, useEffect } from 'react';
import { AppRoute, Announcement, User, Poll, Vote } from '../types';
import FuturisticCard from '../components/ui/FuturisticCard';
import { Timer, Trophy, Calendar, AlertCircle, Megaphone, CheckSquare } from 'lucide-react';

interface HomeProps {
  onNavigate: (route: AppRoute) => void;
  announcements: Announcement[];
  currentUser: User | null;
}

const Home: React.FC<HomeProps> = ({ onNavigate, announcements, currentUser }) => {
  const [activePoll, setActivePoll] = useState<Poll | null>(null);

  useEffect(() => {
    const storedPolls = localStorage.getItem('smg_polls');
    if (storedPolls) {
      const polls: Poll[] = JSON.parse(storedPolls);
      const now = new Date();
      
      // On cherche un sondage actif qui n'est pas expiré
      const poll = polls.find(p => {
        const isExpiringSoon = p.expiresAt ? new Date(p.expiresAt) > now : true;
        return p.active && isExpiringSoon;
      });
      
      setActivePoll(poll || null);
    }
  }, []);

  const handleVote = (optionId: string) => {
    if (!currentUser || !activePoll) return;
    
    const storedPolls = localStorage.getItem('smg_polls');
    if (storedPolls) {
      let polls: Poll[] = JSON.parse(storedPolls);
      const pollIndex = polls.findIndex(p => p.id === activePoll.id);
      
      if (pollIndex !== -1) {
        const cleanVotes = polls[pollIndex].votes.filter(v => v.userId !== currentUser.id);
        const newVote: Vote = {
          userId: currentUser.id,
          userName: currentUser.name,
          optionId: optionId
        };
        
        polls[pollIndex].votes = [...cleanVotes, newVote];
        localStorage.setItem('smg_polls', JSON.stringify(polls));
        setActivePoll(polls[pollIndex]);
      }
    }
  };

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

  const hasVoted = currentUser && activePoll?.votes.find(v => v.userId === currentUser.id);

  return (
    <div className="p-4 space-y-6 pb-20 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex flex-col items-center justify-center py-6 space-y-4">
        <div className="relative group">
          <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500 via-blue-500 to-rose-500 rounded-full opacity-20 group-hover:opacity-40 blur-xl transition duration-1000 animate-pulse"></div>
          <div className="relative w-32 h-32 flex items-center justify-center bg-slate-950 rounded-full border border-slate-800 shadow-2xl overflow-hidden hover:scale-105 transition-transform duration-500">
             <img src="/logo.png?v=2" alt="SMG Boxing Club" className="w-full h-full object-contain p-2"/>
          </div>
        </div>
        
        <div className="text-center space-y-1">
             <h1 className="text-3xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-white to-rose-500">
               S.M.G BOXING
             </h1>
             {currentUser && (
               <div className="bg-slate-900/80 px-4 py-1.5 rounded-full border border-slate-800 inline-block mt-2">
                 <p className="text-xs text-slate-300 font-mono">
                   Connecté : <span className="text-cyan-400 font-black uppercase tracking-tight">{currentUser.name}</span>
                 </p>
               </div>
             )}
        </div>
      </div>

      {/* SONDAGE ACTIF */}
      {activePoll && (
        <FuturisticCard title="SONDAGE EN COURS" borderColor="rose" className="animate-fade-in">
           <div className="space-y-4">
              <div className="flex justify-between items-start">
                 <h4 className="text-sm font-bold text-white italic flex-1 mr-2">{activePoll.question}</h4>
                 {activePoll.expiresAt && (
                    <div className="bg-rose-500/10 border border-rose-500/30 px-2 py-0.5 rounded text-[8px] font-black text-rose-500 uppercase">
                       Fin: {new Date(activePoll.expiresAt).toLocaleDateString()}
                    </div>
                 )}
              </div>
              <div className="grid gap-2">
                 {activePoll.options.map(opt => {
                   const voteCount = activePoll.votes.filter(v => v.optionId === opt.id).length;
                   const totalVotes = activePoll.votes.length;
                   const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;
                   const isMyChoice = hasVoted?.optionId === opt.id;

                   return (
                     <button 
                       key={opt.id} 
                       onClick={() => handleVote(opt.id)}
                       className={`relative w-full text-left p-3 rounded-xl border transition-all overflow-hidden ${isMyChoice ? 'border-rose-500 bg-rose-500/10' : 'border-slate-800 bg-slate-950'}`}
                     >
                        <div className="absolute left-0 top-0 bottom-0 bg-rose-500/20 transition-all duration-1000" style={{ width: `${percentage}%` }}></div>
                        <div className="relative flex justify-between items-center z-10">
                           <span className={`text-xs font-bold ${isMyChoice ? 'text-rose-400' : 'text-slate-300'}`}>{opt.text}</span>
                           <span className="text-[10px] font-mono text-slate-500">{Math.round(percentage)}%</span>
                        </div>
                     </button>
                   );
                 })}
              </div>
              <p className="text-[9px] text-slate-600 italic text-center uppercase tracking-widest">{activePoll.votes.length} votes enregistrés</p>
           </div>
        </FuturisticCard>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <button onClick={() => onNavigate(AppRoute.TIMER)} className="group col-span-2">
          <FuturisticCard className="h-full flex flex-row items-center justify-between px-6 py-5 transition-all group-active:scale-[0.98]" borderColor="cyan">
             <div className="flex items-center space-x-4">
                <div className="bg-cyan-500/10 p-3 rounded-xl border border-cyan-500/20">
                  <Timer className="w-6 h-6 text-cyan-400" />
                </div>
                <div className="text-left">
                  <span className="block font-bold text-lg text-slate-100">Mode Entraînement</span>
                  <span className="text-xs text-slate-500">Timer & Tabata</span>
                </div>
             </div>
          </FuturisticCard>
        </button>

        <button onClick={() => onNavigate(AppRoute.TOURNAMENT)} className="group">
          <FuturisticCard className="h-full flex flex-col items-center justify-center py-6" borderColor="rose">
            <Trophy className="w-8 h-8 text-rose-500 mb-3" />
            <span className="font-semibold text-slate-200 text-sm">Tournois</span>
          </FuturisticCard>
        </button>

        <button onClick={() => onNavigate(AppRoute.CALENDAR)} className="group">
          <FuturisticCard className="h-full flex flex-col items-center justify-center py-6" borderColor="slate">
            <Calendar className="w-8 h-8 text-purple-400 mb-3" />
            <span className="font-semibold text-slate-200 text-sm">Agenda</span>
          </FuturisticCard>
        </button>
      </div>

      <FuturisticCard title="INFO CLUB" borderColor={latestAnnouncement.priority === 'High' ? 'rose' : 'slate'}>
        <div className="flex items-start space-x-3">
          {latestAnnouncement.priority === 'High' ? (
             <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5 animate-pulse" />
          ) : (
             <Megaphone className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
             <span className="font-bold text-slate-200 text-sm block mb-1">{latestAnnouncement.title}</span>
             <p className="text-xs text-slate-300 leading-relaxed">{latestAnnouncement.content}</p>
          </div>
        </div>
      </FuturisticCard>
    </div>
  );
};

export default Home;
