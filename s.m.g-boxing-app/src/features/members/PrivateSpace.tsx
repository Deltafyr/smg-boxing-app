import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { User } from '../../types';
import { Medal, Trophy, Star, Shield, Activity } from 'lucide-react';

export default function PrivateSpace({ currentUser }: { currentUser: User }) {
  const [palmares, setPalmares] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPalmares = async () => {
      try {
        const snap = await getDocs(collection(db, 'palmares'));
        const allPalmares: any[] = [];
        snap.forEach(d => allPalmares.push({ id: d.id, ...d.data() }));
        
        // Filtrage robuste : On cherche si le prénom ou le nom de l'utilisateur est dans le nom du combattant du palmarès
        const userNames = currentUser.name.toLowerCase().split(' ');
        const myPalmares = allPalmares.filter(p => 
          userNames.some(n => p.userName.toLowerCase().includes(n)) || 
          (p.userId && p.userId === currentUser.id)
        );
        
        setPalmares(myPalmares.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      } catch (e) {
        console.error(e);
      }
      setIsLoading(false);
    };

    if (currentUser) fetchPalmares();
  }, [currentUser]);

  // Algorithme de calcul du Titre Suprême
  const getHighestTitle = () => {
    if (palmares.length === 0) return null;
    
    let bestWeight = -1;
    let bestTitle = "";

    palmares.forEach(p => {
      let weight = 0;
      let titleName = "";
      const compName = p.competitionName.toLowerCase();
      const isFrance = compName.includes('france') || compName.includes('national');
      const isAura = compName.includes('aura') || compName.includes('régional') || compName.includes('regional');

      if (isFrance) {
        if (p.medal === 'Or') { weight = 100; titleName = "🥇 Champion de France"; }
        else if (p.medal === 'Argent') { weight = 90; titleName = "🥈 Vice-Champion de France"; }
        else if (p.medal === 'Bronze') { weight = 80; titleName = "🥉 Médaillé de Bronze (France)"; }
      } else if (isAura) {
        if (p.medal === 'Or') { weight = 70; titleName = "🥇 Champion Régional AURA"; }
        else if (p.medal === 'Argent') { weight = 60; titleName = "🥈 Vice-Champion Régional AURA"; }
        else if (p.medal === 'Bronze') { weight = 50; titleName = "🥉 Médaillé de Bronze (AURA)"; }
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

  return (
    <div className="flex-1 overflow-y-auto w-full h-full p-4 pb-32">
      <div className="max-w-lg mx-auto space-y-6">
        
        {/* CARTE D'IDENTITÉ & TITRE SUPRÊME */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative">
          <div className="h-24 bg-gradient-to-r from-slate-800 via-cyan-900/40 to-slate-800 relative">
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-30 mix-blend-overlay"></div>
          </div>
          <div className="px-6 pb-6 relative">
            <div className="w-20 h-20 rounded-2xl border-4 border-slate-900 bg-slate-800 shadow-xl absolute -top-10 flex items-center justify-center">
               <Shield size={36} className="text-cyan-500" />
            </div>
            
            <div className="mt-12 text-center sm:text-left sm:pl-24 sm:mt-2">
              <h2 className="text-2xl font-black text-white uppercase tracking-tight leading-none">{currentUser?.name}</h2>
              {highestTitle ? (
                <div className="inline-block mt-2 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                  <span className="text-xs font-black text-amber-500 uppercase tracking-widest">{highestTitle}</span>
                </div>
              ) : (
                <p className="text-xs text-slate-500 font-mono mt-1 uppercase tracking-widest">Combattant S.M.G</p>
              )}
            </div>
          </div>
        </div>

        {/* SECTION PALMARÈS */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg">
          <h3 className="text-sm font-black text-white uppercase tracking-widest border-b border-slate-800 pb-2 mb-4 flex items-center">
            <Trophy size={16} className="mr-2 text-amber-500"/> Palmarès Historique
          </h3>
          
          {isLoading ? (
            <div className="flex justify-center py-8"><Activity className="text-cyan-500 animate-spin" /></div>
          ) : palmares.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-slate-800 rounded-xl">
              <Star size={24} className="mx-auto text-slate-600 mb-2"/>
              <p className="text-xs text-slate-500 font-mono">Aucune médaille enregistrée pour le moment.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {palmares.map(p => (
                <div key={p.id} className="flex items-center justify-between bg-slate-950 p-3 rounded-lg border border-slate-800/50 hover:border-slate-700 transition-colors">
                  <div className="flex-1 pr-4">
                    <h4 className="text-sm font-bold text-slate-200">{p.competitionName}</h4>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">{new Date(p.date).toLocaleDateString('fr-FR')}</p>
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

        {/* SECTION PLANIFICATION (PLACEHOLDER) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg opacity-50">
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-2 mb-4">Planification Coach</h3>
          <p className="text-xs text-slate-500 font-mono text-center py-4">En attente de synchronisation des programmes...</p>
        </div>

      </div>
    </div>
  );
}