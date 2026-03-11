import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { User } from '../../types';
import { Medal, Trophy, Star, Shield, Activity, Calendar, MapPin, Zap, Dumbbell } from 'lucide-react';

const HISTORICAL_PALMARES = [
  { id: 'h1', competitionName: 'Championnat de France 2026', date: '2026-02-21', userName: 'Méline', medal: 'Or' },
  { id: 'h2', competitionName: 'Championnat de France 2026', date: '2026-02-21', userName: 'Pauline', medal: 'Bronze' },
  { id: 'h3', competitionName: 'Championnat de France 2026', date: '2026-02-21', userName: 'Armand', medal: 'Bronze' },
  { id: 'h4', competitionName: 'Championnat Régional AURA 2025', date: '2025-11-22', userName: 'Pauline', medal: 'Or' },
  { id: 'h5', competitionName: 'Championnat Régional AURA 2025', date: '2025-11-22', userName: 'Méline', medal: 'Or' },
  { id: 'h6', competitionName: 'Championnat Régional AURA 2025', date: '2025-11-22', userName: 'Maevan', medal: 'Or' },
  { id: 'h7', competitionName: 'Championnat Régional AURA 2025', date: '2025-11-22', userName: 'Armand', medal: 'Or' },
  { id: 'h8', competitionName: 'Championnat Régional AURA 2025', date: '2025-11-22', userName: 'Axel', medal: 'Argent' },
  { id: 'h9', competitionName: 'Championnat Régional AURA 2025', date: '2025-11-22', userName: 'Benjamin', medal: 'Bronze' },
  { id: 'h10', competitionName: 'Championnat Régional AURA 2025', date: '2025-11-22', userName: 'Lucas', medal: 'Bronze' },
  { id: 'h11', competitionName: 'Championnat Régional AURA 2025', date: '2025-11-22', userName: 'Elise', medal: 'Bronze' },
  { id: 'h12', competitionName: 'Championnat Régional AURA 2025', date: '2025-11-22', userName: 'Nicolas', medal: 'Bronze' },
  { id: 'h13', competitionName: 'Championnat Régional AURA 2025', date: '2025-11-22', userName: 'Julien', medal: 'Bronze' }
];

const normalizeName = (str: string) => str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim() : "";

const matchPalmares = (member: User, p: any) => {
   if (p.userId && p.userId === member.id) return true;
   const mName = normalizeName(member.name);
   const pName = normalizeName(p.userName);
   if (!mName || !pName) return false;
   
   const mWords = mName.split(/\s+/).filter(w => w.length > 2);
   const pWords = pName.split(/\s+/).filter(w => w.length > 2);
   
   return mWords.some(mw => pWords.some(pw => mw === pw || pw.includes(mw) || mw.includes(pw)));
};

const calculateCategoryFFKMDA = (birthYear: number, gender: 'M'|'F' = 'M') => {
  const age = new Date().getFullYear() - birthYear;
  if (age <= 9) return `Poussin (${gender})`;
  if (age <= 11) return `Benjamin (${gender})`;
  if (age <= 13) return `Minime (${gender})`;
  if (age <= 15) return `Cadet (${gender})`;
  if (age <= 17) return `Junior (${gender})`;
  if (age <= 34) return `Senior (${gender})`;
  return `Vétéran (${gender})`;
};

export default function PrivateSpace({ currentUser }: { currentUser: User }) {
  const [palmares, setPalmares] = useState<any[]>([]);
  const [nextEvent, setNextEvent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch Agenda (Prochain événement)
        const aSnap = await getDocs(collection(db, 'agenda'));
        const today = new Date();
        today.setHours(0,0,0,0);
        const events: any[] = [];
        aSnap.forEach(d => {
          const data = d.data();
          if (new Date(data.date) >= today) events.push({ id: d.id, ...data });
        });
        events.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        if (events.length > 0) setNextEvent(events[0]);

        // Fetch & Merge Palmares
        const pSnap = await getDocs(collection(db, 'palmares'));
        const dbPalmares: any[] = [];
        pSnap.forEach(d => dbPalmares.push({ id: d.id, ...d.data() }));
        
        const merged = [...HISTORICAL_PALMARES];
        dbPalmares.forEach(dbp => {
          const exists = merged.find(m => m.userName === dbp.userName && m.competitionName === dbp.competitionName);
          if (!exists) merged.push(dbp);
        });

        // Match robuste pour le membre actuel
        const myPalmares = merged.filter(p => matchPalmares(currentUser, p));
        setPalmares(myPalmares.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      } catch (e) { console.error(e); }
      setIsLoading(false);
    };

    if (currentUser) fetchData();
  }, [currentUser]);

  const getHighestTitle = () => {
    if (palmares.length === 0) return null;
    let bestWeight = -1; let bestTitle = "";
    palmares.forEach(p => {
      let weight = 0; let titleName = "";
      const compName = p.competitionName.toLowerCase();
      const isFrance = compName.includes('france') || compName.includes('national');
      const isAura = compName.includes('aura') || compName.includes('régional') || compName.includes('regional');

      if (isFrance) {
        if (p.medal === 'Or') { weight = 100; titleName = "🥇 Champion de France"; }
        else if (p.medal === 'Argent') { weight = 90; titleName = "🥈 Vice-Champion de France"; }
        else if (p.medal === 'Bronze') { weight = 80; titleName = "🥉 Médaillé de Bronze (France)"; }
      } else if (isAura) {
        if (p.medal === 'Or') { weight = 70; titleName = "🥇 Champion AURA"; }
        else if (p.medal === 'Argent') { weight = 60; titleName = "🥈 Vice-Champion AURA"; }
        else if (p.medal === 'Bronze') { weight = 50; titleName = "🥉 Médaillé (AURA)"; }
      } else {
         if (p.medal === 'Or') { weight = 40; titleName = "🥇 Vainqueur"; }
         else if (p.medal === 'Argent') { weight = 30; titleName = "🥈 Finaliste"; }
         else if (p.medal === 'Bronze') { weight = 20; titleName = "🥉 Médaillé"; }
      }

      if (weight > bestWeight) {
        bestWeight = weight;
        const yearMatch = p.competitionName.match(/\d{4}/);
        const year = yearMatch ? yearMatch[0] : new Date(p.date).getFullYear();
        bestTitle = `${titleName} ${year}`;
      }
    });
    return bestTitle;
  };

  const highestTitle = getHighestTitle();
  const roleColor = currentUser?.role === 'Admin' ? 'rose' : currentUser?.role === 'Coach' ? 'amber' : 'cyan';
  const category = currentUser?.birthDate ? calculateCategoryFFKMDA(new Date(currentUser.birthDate).getFullYear(), currentUser.gender === 'Femme' ? 'F' : 'M') : 'N/C';

  return (
    <div style={{ height: '100vh', overflowY: 'auto', paddingBottom: '150px' }} className="w-full px-4 pt-4">
      <div className="max-w-lg mx-auto space-y-6">
        
        {/* CARTE D'IDENTITÉ & TITRE SUPRÊME */}
        <div className={`bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative mt-4`}>
          <div className={`h-24 bg-gradient-to-r from-${roleColor}-900/30 via-slate-800 to-slate-900 relative`}>
             <div className="absolute top-4 right-4 bg-slate-950/50 backdrop-blur px-3 py-1 rounded-full border border-slate-700">
               <span className={`text-[10px] font-black uppercase tracking-widest text-${roleColor}-500`}>{currentUser?.role}</span>
             </div>
          </div>
          <div className="px-6 pb-6 relative">
            <div className={`w-20 h-20 rounded-2xl border-4 border-slate-900 bg-slate-800 shadow-xl absolute -top-10 flex items-center justify-center`}>
               <span className={`text-4xl font-black text-${roleColor}-500`}>{currentUser?.name.charAt(0).toUpperCase()}</span>
            </div>
            
            <div className="mt-14">
              <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mb-1">Espace Combattant</p>
              <h2 className="text-2xl font-black text-white uppercase tracking-tight leading-none mb-3">{currentUser?.name}</h2>
              
              <div className="flex space-x-3 mb-4">
                <div className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 flex items-center">
                  <Dumbbell size={12} className="text-slate-500 mr-2"/>
                  <span className="text-xs font-bold text-slate-300">{currentUser?.weight ? `${currentUser.weight} kg` : 'Poids N/C'}</span>
                </div>
                <div className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 flex items-center">
                  <Shield size={12} className="text-slate-500 mr-2"/>
                  <span className="text-xs font-bold text-slate-300">{category}</span>
                </div>
              </div>

              {highestTitle && (
                <div className="inline-block bg-amber-500/10 border border-amber-500/30 px-3 py-2 rounded-lg shadow-[0_0_15px_rgba(245,158,11,0.1)]">
                  <p className="text-[8px] text-amber-500/70 font-bold uppercase tracking-widest mb-0.5">Titre Suprême</p>
                  <span className="text-sm font-black text-amber-400 uppercase tracking-wide">{highestTitle}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* WIDGET : PROCHAIN ENTRAÎNEMENT */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
          <h3 className="text-xs font-black text-cyan-500 uppercase tracking-widest border-b border-slate-800 pb-2 mb-4 flex items-center">
            <Zap size={14} className="mr-2"/> Prochain Rendez-vous
          </h3>
          
          {isLoading ? (
            <p className="text-center text-cyan-500 text-[10px] font-mono animate-pulse py-4">Synchronisation...</p>
          ) : nextEvent ? (
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/50">
              <span className="inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border text-cyan-400 border-cyan-500/30 bg-cyan-500/10 mb-2">{nextEvent.type}</span>
              <h4 className="text-sm font-bold text-white mb-2">{nextEvent.title}</h4>
              <div className="space-y-1.5">
                <p className="text-xs text-slate-400 flex items-center font-mono"><Calendar size={12} className="mr-2 text-cyan-500/70" /> {new Date(nextEvent.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} {nextEvent.time && `à ${nextEvent.time}`}</p>
                {nextEvent.location && <p className="text-xs text-slate-400 flex items-center font-mono"><MapPin size={12} className="mr-2 text-cyan-500/70" /> {nextEvent.location}</p>}
              </div>
            </div>
          ) : (
            <p className="text-center text-slate-500 text-xs font-mono py-4">Aucun événement prévu à l'agenda.</p>
          )}
        </div>

        {/* SECTION PALMARÈS PERSONNEL */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-2 mb-4 flex items-center">
            <Trophy size={14} className="mr-2 text-amber-500"/> Mon Palmarès
          </h3>
          
          {isLoading ? (
            <div className="flex justify-center py-8"><Activity className="text-cyan-500 animate-spin" /></div>
          ) : palmares.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-slate-800 rounded-xl bg-slate-950">
              <Star size={24} className="mx-auto text-slate-600 mb-2"/>
              <p className="text-xs text-slate-500 font-mono">Aucune médaille enregistrée à ton nom pour le moment.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {palmares.map((p, idx) => (
                <div key={idx} className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800/50 hover:border-slate-700 transition-colors shadow-sm">
                  <div className="flex-1 pr-4">
                    <h4 className="text-sm font-bold text-slate-200 leading-tight">{p.competitionName}</h4>
                    <p className="text-[10px] text-slate-500 font-mono mt-1 flex items-center"><Calendar size={10} className="mr-1"/> {new Date(p.date).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <div className="shrink-0 flex items-center justify-center w-12 h-12 rounded-full bg-slate-900 shadow-inner">
                     {p.medal === 'Or' && <Medal size={24} className="text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]" />}
                     {p.medal === 'Argent' && <Medal size={24} className="text-slate-300 drop-shadow-[0_0_8px_rgba(203,213,225,0.6)]" />}
                     {p.medal === 'Bronze' && <Medal size={24} className="text-amber-700 drop-shadow-[0_0_8px_rgba(180,83,9,0.6)]" />}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}