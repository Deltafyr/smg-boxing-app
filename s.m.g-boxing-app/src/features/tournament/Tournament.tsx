import React, { useState } from 'react';
import { User } from '../../types';
import FuturisticCard from '../../components/ui/FuturisticCard';
import { Trophy, Swords, Activity, Play, Zap } from 'lucide-react';

interface TournamentProps { 
  currentUser: User; 
}

interface Match {
  id: string;
  round: string;
  red: any;
  blue: any;
  status: 'pending' | 'active' | 'completed';
  winner: string | null;
}

const Tournament: React.FC<TournamentProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<'BRACKET' | 'TIMELINE'>('BRACKET');
  const [bracketCreated, setBracketCreated] = useState(false);
  const [matches, setMatches] = useState<Match[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<any[]>([]);

  const generateBracket = () => {
    const seedPlayers = Array.from({ length: 16 }, (_, i) => ({
      id: `fighter-${i + 1}`,
      seed: i + 1,
      name: `Combattant ${String.fromCharCode(65 + i)}`,
      club: i % 2 === 0 ? 'SMG Boxing' : 'Rival Gym',
    }));

    const bracketOrder = [1, 16, 8, 9, 5, 12, 4, 13, 3, 14, 6, 11, 7, 10, 2, 15];
    const firstRoundMatches: Match[] = [];
    
    for (let i = 0; i < bracketOrder.length; i += 2) {
      firstRoundMatches.push({
        id: `match-1-8-${i/2}`,
        round: '1/8 Finale',
        red: seedPlayers.find(p => p.seed === bracketOrder[i]),
        blue: seedPlayers.find(p => p.seed === bracketOrder[i+1]),
        status: 'pending',
        winner: null
      });
    }
    
    setMatches(firstRoundMatches);
    setBracketCreated(true);
    addTimelineEvent('Système', 'Arbre généré. Seeding (1-16) appliqué.', 'system');
  };

  const addTimelineEvent = (actor: string, action: string, type: 'info' | 'system' | 'combat' | 'alert' = 'info') => {
    const newEvent = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      actor,
      action,
      type
    };
    setTimelineEvents(prev => [newEvent, ...prev].slice(0, 50));
  };

  const simulateCombatStart = (matchId: string) => {
    const match = matches.find(m => m.id === matchId);
    if(!match) return;
    setMatches(prev => prev.map(m => m.id === matchId ? { ...m, status: 'active' } : m));
    addTimelineEvent('Arbitre', `Début du combat : ${match.red.name} vs ${match.blue.name}`, 'combat');
  };

  return (
    <div className="p-4 pb-24 h-full flex flex-col max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
           <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase">Arena</h2>
           <div className="flex items-center space-x-2 mt-1">
             <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
             <span className="text-[10px] text-amber-500 font-mono uppercase tracking-widest leading-none">Tournoi Actif</span>
           </div>
        </div>
      </div>

      <div className="flex space-x-1 mb-6 bg-slate-950/50 p-1 rounded-2xl border border-slate-800 overflow-x-auto">
        <button onClick={() => setActiveTab('BRACKET')} className={`flex-1 min-w-[80px] py-2.5 text-[9px] font-black rounded-xl transition-all ${activeTab === 'BRACKET' ? 'bg-amber-600 text-white shadow-xl' : 'text-slate-500'}`}>BRACKET & SEEDS</button>
        <button onClick={() => setActiveTab('TIMELINE')} className={`flex-1 min-w-[80px] py-2.5 text-[9px] font-black rounded-xl transition-all ${activeTab === 'TIMELINE' ? 'bg-cyan-600 text-white shadow-xl' : 'text-slate-500'}`}>TIMELINE ARÈNE</button>
      </div>

      {activeTab === 'BRACKET' && (
        <div className="space-y-4 animate-fade-in flex-1 overflow-y-auto">
          {!bracketCreated ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500 bg-slate-900/50 rounded-2xl border border-slate-800">
              <Trophy size={64} className="mb-4 opacity-50 text-amber-500" />
              <button onClick={generateBracket} className="bg-amber-600 hover:bg-amber-500 text-white px-6 py-3 rounded-xl font-black text-xs transition-all shadow-lg active:scale-95 uppercase tracking-wider flex items-center">
                <Swords size={16} className="mr-2" /> Initialiser Bracket (16)
              </button>
            </div>
          ) : (
            <div className="space-y-3 pb-10">
              <div className="flex justify-between items-center px-2 mb-4">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">1/8 de Finale</span>
                <button onClick={() => {setBracketCreated(false); setMatches([]);}} className="text-[10px] text-rose-500 uppercase font-black hover:underline">Reset</button>
              </div>
              {matches.map((match, idx) => (
                <FuturisticCard key={match.id} borderColor={match.status === 'active' ? 'rose' : 'slate'} className="bg-slate-950/80">
                  <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-800">
                    <span className="text-[10px] font-mono text-slate-500">MATCH #{idx + 1}</span>
                    {match.status === 'pending' && <button onClick={() => simulateCombatStart(match.id)} className="text-[10px] text-emerald-500 font-black uppercase flex items-center bg-emerald-500/10 px-2 py-1 rounded"><Play size={10} className="mr-1" /> Démarrer</button>}
                    {match.status === 'active' && <span className="text-[10px] text-rose-500 font-black uppercase flex items-center animate-pulse"><Zap size={10} className="mr-1"/> En cours</span>}
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-2 rounded-lg bg-red-950/20 border border-red-900/30">
                      <div className="flex items-center space-x-3"><span className="text-[10px] font-mono font-black text-red-500 w-5 text-center bg-red-500/10 rounded px-1">#{match.red.seed}</span><span className="text-xs font-bold text-white uppercase">{match.red.name}</span></div>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded-lg bg-blue-950/20 border border-blue-900/30">
                      <div className="flex items-center space-x-3"><span className="text-[10px] font-mono font-black text-blue-500 w-5 text-center bg-blue-500/10 rounded px-1">#{match.blue.seed}</span><span className="text-xs font-bold text-white uppercase">{match.blue.name}</span></div>
                    </div>
                  </div>
                </FuturisticCard>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'TIMELINE' && (
        <div className="flex-1 bg-slate-900/50 border border-slate-800 rounded-2xl flex flex-col animate-fade-in overflow-hidden">
          <div className="p-3 border-b border-slate-800 bg-slate-900 flex items-center justify-between"><h3 className="text-xs font-black text-white flex items-center uppercase tracking-widest"><Activity className="mr-2 text-cyan-500" size={14} /> Flux Live</h3></div>
          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {timelineEvents.map((ev) => (
              <div key={ev.id} className="flex items-start space-x-3 text-xs bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-[9px] font-mono text-slate-500 mt-0.5">{ev.timestamp}</span>
                <div className="flex-1"><span className={`font-black uppercase tracking-wider mr-2 ${ev.type === 'system' ? 'text-amber-500' : 'text-cyan-400'}`}>{ev.actor}</span><span className="text-slate-300">{ev.action}</span></div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
export default Tournament;
