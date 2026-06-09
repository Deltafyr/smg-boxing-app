import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { User } from '../../types';
import { Medal, Trophy, Star, Shield, Activity, Calendar, MapPin, Zap, Dumbbell, MessageSquare, Heart, Brain } from 'lucide-react';

const HISTORICAL_PALMARES = [
  { id: 'h1', competitionName: 'Championnat de France 2026', date: '2026-02-21', userName: 'Méline', medal: 'Or' },
  { id: 'h2', competitionName: 'Championnat de France 2026', date: '2026-02-21', userName: 'Pauline', medal: 'Bronze' },
  { id: 'h3', competitionName: 'Championnat de France 2026', date: '2026-02-21', userName: 'Armand', medal: 'Bronze' },
  { id: 'h4', competitionName: 'Championnat Régional AURA 2025', date: '2025-11-22', userName: 'Pauline', medal: 'Or' },
  { id: 'h5', competitionName: 'Championnat Régional AURA 2025', date: '2025-11-22', userName: 'Méline', medal: 'Or' },
  { id: 'h6', competitionName: 'Championnat Régional AURA 2025', date: '2025-11-22', userName: 'Maevan', medal: 'Or' },
  { id: 'h7', competitionName: 'Championnat Régional AURA 2025', date: '2025-11-22', userName: 'Armand', medal: 'Or' }
];

const normalizeName = (str: string) => str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim() : "";

const matchPalmares = (member: User, p: any) => {
   if (p.userId && p.userId === member.id) return true;
   const mName = normalizeName(member.name); const pName = normalizeName(p.userName);
   if (!mName || !pName) return false;
   return mName.split(/\s+/).filter(w => w.length > 2).some(mw => pName.includes(mw));
};

export default function PrivateSpace({ currentUser }: { currentUser: User }) {
  const [palmares, setPalmares] = useState<any[]>([]);
  const [nextEvent, setNextEvent] = useState<any>(null);
  const [perfData, setPerfData] = useState<any>(null);
  const [liveFights, setLiveFights] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return;
      setIsLoading(true);
      try {
        // 1. Prochain Entraînement / Événement
        const aSnap = await getDocs(collection(db, 'agenda'));
        const today = new Date(); today.setHours(0,0,0,0); const events: any[] = [];
        aSnap.forEach(d => { if (new Date(d.data().date) >= today) events.push(d.data()); });
        events.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        if (events.length > 0) setNextEvent(events[0]);

        // 2. Hub de Performance Athlétique (quarterly tracking from playbook)
        const pDoc = await getDoc(doc(db, 'performance_hubs', currentUser.id));
        if (pDoc.exists()) setPerfData(pDoc.data());

        // 3. Matchs en direct & Instructions de coin (Cornerman Live Toolkit)
        const fSnap = await getDocs(collection(db, 'fightCards'));
        const myCards: any[] = [];
        fSnap.forEach(d => { if (d.data().userId === currentUser.id) myCards.push(d.data()); });
        setLiveFights(myCards);

        // 4. Palmarès et médailles audités
        const pSnap = await getDocs(collection(db, 'palmares'));
        const dbPalmares: any[] = []; pSnap.forEach(d => dbPalmares.push(d.data()));
        const merged = [...HISTORICAL_PALMARES];
        dbPalmares.forEach(dbp => { if(!merged.find(m => m.userName === dbp.userName && m.competitionName === dbp.competitionName)) merged.push(dbp); });
        setPalmares(merged.filter(p => matchPalmares(currentUser, p)));

      } catch (e) { console.error(e); }
      setIsLoading(false);
    };
    fetchData();
  }, [currentUser]);

  const roleColor = currentUser?.role === 'Admin' ? 'rose' : currentUser?.role === 'Coach' ? 'amber' : 'cyan';

  return (
    <div style={{ height: '100vh', overflowY: 'auto', paddingBottom: '150px' }} className="w-full px-4 pt-4">
      <div className="max-w-lg mx-auto space-y-6">
        
        {/* PERSONAL COCKPIT PANEL */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative">
          <div className="h-20 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-4 flex justify-between items-center border-b border-slate-800">
            <div>
              <p className="text-[9px] font-mono text-cyan-500 uppercase tracking-widest">Espace Privé Sécurisé</p>
              <h2 className="text-xl font-black text-white uppercase tracking-tight">{currentUser?.name}</h2>
            </div>
            <span className={`text-[9px] font-black uppercase px-2 py-0.5 border rounded border-${roleColor}-500/30 text-${roleColor}-400 bg-${roleColor}-500/10`}>{currentUser?.role}</span>
          </div>

          {/* INSTRUCTIONS DU COIN EN DIRECT (SI ACTIF EN TOURNOI) */}
          {liveFights.some(f => f.cornerNotes) && (
            <div className="bg-gradient-to-r from-amber-950/40 via-slate-950 to-transparent p-4 border-b border-amber-500/30 animate-pulse">
              <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest flex items-center mb-1"><MessageSquare size={12} className="mr-1"/> DIRECT DU COIN DES COACHS</span>
              <p className="text-xs font-bold text-slate-200 italic">"{liveFights.find(f => f.cornerNotes).cornerNotes}"</p>
            </div>
          )}
        </div>

        {/* COMPLIANCE BIOMÉTRIQUE & PERFORMANCE LOGS */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg">
           <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-2 mb-3 flex items-center"><Activity size={14} className="text-cyan-500 mr-2" /> Tableau de Bord Athlétique (Tests)</h3>
           {perfData ? (
             <div className="space-y-4">
               <div className="grid grid-cols-2 gap-3">
                 <div className="bg-slate-950 p-2.5 rounded border border-slate-800/60 text-center"><span className="block text-[8px] text-slate-500 uppercase font-bold">Test VMA</span><span className="text-sm font-black text-white">{perfData.vma || 'N/C'} km/h</span></div>
                 <div className="bg-slate-950 p-2.5 rounded border border-slate-800/60 text-center"><span className="block text-[8px] text-slate-500 uppercase font-bold">Max Pompes (1m)</span><span className="text-sm font-black text-white">{perfData.pompes || 'N/C'} reps</span></div>
                 <div className="bg-slate-950 p-2.5 rounded border border-slate-800/60 text-center"><span className="block text-[8px] text-slate-500 uppercase font-bold">100 Kicks Challenge</span><span className="text-sm font-black text-white">{perfData.kicks || 'N/C'}</span></div>
                 <div className="bg-slate-950 p-2.5 rounded border border-slate-800/60 text-center"><span className="block text-[8px] text-slate-500 uppercase font-bold">% Esquives</span><span className="text-sm font-black text-white">{perfData.esquives || 'N/C'}</span></div>
               </div>
               
               <div className="bg-slate-950 p-3 rounded border border-slate-800/60">
                 <div className="flex justify-between items-center mb-1"><span className="text-[8px] text-slate-500 uppercase font-bold flex items-center"><Brain size={10} className="mr-1 text-purple-400"/> Indice de Confiance en Défense</span><span className="text-xs font-mono font-bold text-amber-500">{perfData.mental || 5}/10</span></div>
                 <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden"><div className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full" style={{ width: `${(perfData.mental || 5) * 10}%` }}></div></div>
               </div>

               {perfData.roadmap && (
                 <div className="bg-slate-950 p-3 rounded border border-slate-800/40 border-l-2 border-l-amber-500">
                   <span className="text-[8px] text-slate-500 uppercase font-bold block mb-1 flex items-center"><Dumbbell size={10} className="mr-1 text-amber-500"/> Ma Feuille de route Prépa (Samedi)</span>
                   <p className="text-xs text-slate-300 font-mono leading-relaxed">{perfData.roadmap}</p>
                 </div>
               )}
             </div>
           ) : (
             <p className="text-center py-4 text-xs font-mono text-slate-500">Aucun test d'évaluation enregistré par les coachs pour le moment.</p>
           )}
        </div>

        {/* AGENDA TARGET TRACKER */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg">
          <h3 className="text-xs font-black text-cyan-500 uppercase tracking-widest border-b border-slate-800 pb-2 mb-3 flex items-center"><Calendar size={14} className="mr-2"/> Mon Prochain Objectif Club</h3>
          {nextEvent ? (
            <div className="bg-slate-950 p-3 rounded border border-slate-800 flex justify-between items-center">
              <div><span className="text-[8px] font-mono text-cyan-400 border border-cyan-500/30 px-1.5 py-0.2 rounded bg-cyan-950/20">{nextEvent.type}</span><h4 className="text-xs font-bold text-white mt-1">{nextEvent.title}</h4></div>
              <div className="text-right text-[10px] font-mono text-slate-400"><p>{new Date(nextEvent.date).toLocaleDateString('fr-FR', {day:'numeric', month:'short'})}</p>{nextEvent.time && <p className="text-slate-500">{nextEvent.time}</p>}</div>
            </div>
          ) : <p className="text-center py-2 text-xs font-mono text-slate-500">Aucun événement à venir.</p>}
        </div>

        {/* AUDITED PALMARES MEDALS */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg">
          <h3 className="text-xs font-black text-amber-500 uppercase tracking-widest border-b border-slate-800 pb-2 mb-3 flex items-center"><Trophy size={14} className="mr-2"/> Mon Palmarès Historique</h3>
          {palmares.length === 0 ? (
            <p className="text-center py-4 text-xs font-mono text-slate-500">Aucune médaille enregistrée pour l'instant. Travaille dur à la salle !</p>
          ) : (
            <div className="space-y-2">
              {palmares.map((p, idx) => (
                <div key={idx} className="flex justify-between items-center bg-slate-950 p-3 rounded border border-slate-800/40">
                  <div><h4 className="text-xs font-black text-slate-200 uppercase tracking-wide">{p.competitionName}</h4><span className="text-[9px] text-slate-500 font-mono">{p.date}</span></div>
                  <Medal size={22} className={p.medal === 'Or' ? 'text-yellow-400 drop-shadow-[0_0_6px_rgba(250,204,21,0.4)]' : p.medal === 'Argent' ? 'text-slate-300' : 'text-amber-700'} />
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}