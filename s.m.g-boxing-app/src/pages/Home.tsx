import React, { useState } from 'react';
import { Trophy, Medal, Star, ChevronDown, ChevronUp } from 'lucide-react';
import { User } from '../../types';

export default function Dashboard({ currentUser }: { currentUser: User }) {
  const [showPalmares, setShowPalmares] = useState(false);

  // PALMARES DUR (Hardcoded d'après tes instructions)
  const palmaresData = [
    { comp: 'Championnat de France 2026', date: '2026-02-21', name: 'Méline', medal: 'Or', iconColor: 'text-yellow-400', shadow: 'shadow-[0_0_8px_rgba(250,204,21,0.6)]' },
    { comp: 'Championnat de France 2026', date: '2026-02-21', name: 'Pauline', medal: 'Bronze', iconColor: 'text-amber-700', shadow: 'shadow-[0_0_8px_rgba(180,83,9,0.6)]' },
    { comp: 'Championnat de France 2026', date: '2026-02-21', name: 'Armand', medal: 'Bronze', iconColor: 'text-amber-700', shadow: 'shadow-[0_0_8px_rgba(180,83,9,0.6)]' },
    { comp: 'Championnat Régional AURA 2025', date: '2025-11-22', name: 'Pauline', medal: 'Or', iconColor: 'text-yellow-400', shadow: 'shadow-[0_0_8px_rgba(250,204,21,0.6)]' },
    { comp: 'Championnat Régional AURA 2025', date: '2025-11-22', name: 'Méline', medal: 'Or', iconColor: 'text-yellow-400', shadow: 'shadow-[0_0_8px_rgba(250,204,21,0.6)]' },
    { comp: 'Championnat Régional AURA 2025', date: '2025-11-22', name: 'Maevan', medal: 'Or', iconColor: 'text-yellow-400', shadow: 'shadow-[0_0_8px_rgba(250,204,21,0.6)]' },
    { comp: 'Championnat Régional AURA 2025', date: '2025-11-22', name: 'Armand', medal: 'Or', iconColor: 'text-yellow-400', shadow: 'shadow-[0_0_8px_rgba(250,204,21,0.6)]' },
    { comp: 'Championnat Régional AURA 2025', date: '2025-11-22', name: 'Axel', medal: 'Argent', iconColor: 'text-slate-300', shadow: 'shadow-[0_0_8px_rgba(203,213,225,0.6)]' },
    { comp: 'Championnat Régional AURA 2025', date: '2025-11-22', name: 'Benjamin', medal: 'Bronze', iconColor: 'text-amber-700', shadow: 'shadow-[0_0_8px_rgba(180,83,9,0.6)]' },
    { comp: 'Championnat Régional AURA 2025', date: '2025-11-22', name: 'Lucas', medal: 'Bronze', iconColor: 'text-amber-700', shadow: 'shadow-[0_0_8px_rgba(180,83,9,0.6)]' },
    { comp: 'Championnat Régional AURA 2025', date: '2025-11-22', name: 'Elise', medal: 'Bronze', iconColor: 'text-amber-700', shadow: 'shadow-[0_0_8px_rgba(180,83,9,0.6)]' },
    { comp: 'Championnat Régional AURA 2025', date: '2025-11-22', name: 'Nicolas', medal: 'Bronze', iconColor: 'text-amber-700', shadow: 'shadow-[0_0_8px_rgba(180,83,9,0.6)]' },
    { comp: 'Championnat Régional AURA 2025', date: '2025-11-22', name: 'Julien', medal: 'Bronze', iconColor: 'text-amber-700', shadow: 'shadow-[0_0_8px_rgba(180,83,9,0.6)]' }
  ];

  return (
    <div style={{ height: '100vh', overflowY: 'auto', paddingBottom: '150px' }} className="w-full px-4 pt-4">
      <div className="max-w-lg mx-auto space-y-6">
        
        {/* EN-TETE */}
        <div className="text-center py-6">
          <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-2">Bienvenue</h1>
          <p className="text-xs text-cyan-500 font-mono uppercase tracking-widest">{currentUser?.name}</p>
        </div>

        {/* BOUTON PALMARÈS */}
        <button 
          onClick={() => setShowPalmares(!showPalmares)}
          className={`w-full p-4 rounded-xl border flex items-center justify-between transition-all ${showPalmares ? 'bg-amber-950 border-amber-500/50 text-amber-500' : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-white'}`}
        >
          <div className="flex items-center font-black uppercase tracking-widest text-sm">
            <Trophy size={18} className="mr-3" />
            Voir le Palmarès du Club
          </div>
          {showPalmares ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>

        {/* LISTE DU PALMARÈS DEROULANTE */}
        {showPalmares && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg animate-fade-in">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-2 mb-4 flex items-center">
              <Star size={14} className="mr-2"/> Champions S.M.G
            </h3>
            
            <div className="space-y-3">
              {palmaresData.map((p, idx) => (
                <div key={idx} className="flex items-center justify-between bg-slate-950 p-3 rounded-lg border border-slate-800/50">
                  <div className="shrink-0 mr-4 flex items-center justify-center w-10 h-10 rounded-full bg-slate-900 shadow-inner">
                     <Medal size={20} className={`${p.iconColor} ${p.shadow}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-black text-white uppercase tracking-wider truncate">{p.name}</h4>
                    <p className="text-[10px] text-slate-500 font-mono truncate">{p.comp} • {p.date.split('-')[0]}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}