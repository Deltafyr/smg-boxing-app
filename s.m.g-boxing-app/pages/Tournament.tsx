import React, { useState } from 'react';
import { INITIAL_MEMBERS, INITIAL_COMPETITIONS } from '../constants';
import { Fight } from '../types';
import FuturisticCard from '../components/ui/FuturisticCard';
import { Shield, AlertTriangle, Plus, Trash2 } from 'lucide-react';

const Tournament: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'PREP' | 'TIMELINE' | 'PALMARES'>('PREP');
  const [selectedCompId, setSelectedCompId] = useState(INITIAL_COMPETITIONS[0].id);
  const [fights, setFights] = useState<Fight[]>([
    { id: 'f1', fighterId: '1', competitionId: 'c1', fightNumber: 10, ring: 'A', helmetColor: 'Rouge', status: 'Pending' },
    { id: 'f2', fighterId: '2', competitionId: 'c1', fightNumber: 12, ring: 'B', helmetColor: 'Bleu', status: 'Pending' }
  ]);
  const [isEditing, setIsEditing] = useState<string | null>(null);

  // Filter logic
  const competitors = INITIAL_MEMBERS.filter(m => m.category === 'Compétiteur');
  const filteredFights = fights.filter(f => f.competitionId === selectedCompId).sort((a, b) => a.fightNumber - b.fightNumber);

  // Conflict Detection
  const detectConflicts = () => {
    const conflicts: string[] = [];
    const map = new Map<number, Fight[]>();
    
    // Group by fight number (roughly time)
    filteredFights.forEach(f => {
       if(!map.has(f.fightNumber)) map.set(f.fightNumber, []);
       map.get(f.fightNumber)?.push(f);
    });

    // Check logic: This is simplified. 
    // Real logic would need estimated start times. 
    // Here we warn if a fighter has fights close together (e.g. within 5 fight numbers).
    
    filteredFights.forEach(f1 => {
      const closeFights = filteredFights.filter(f2 => 
        f2.id !== f1.id && 
        f2.fighterId === f1.fighterId && 
        Math.abs(f2.fightNumber - f1.fightNumber) < 5
      );
      if (closeFights.length > 0) {
        const fighterName = competitors.find(c => c.id === f1.fighterId)?.name;
        conflicts.push(`${fighterName} a des combats rapprochés (#${f1.fightNumber} et #${closeFights[0].fightNumber})`);
      }
    });
    
    return [...new Set(conflicts)];
  };
  
  const conflicts = detectConflicts();

  const handleUpdateFight = (id: string, field: keyof Fight, value: any) => {
    setFights(prev => prev.map(f => f.id === id ? { ...f, [field]: value } : f));
  };

  const addFight = () => {
    const newFight: Fight = {
      id: Math.random().toString(36).substr(2, 9),
      fighterId: competitors[0].id,
      competitionId: selectedCompId,
      fightNumber: 0,
      ring: 'A',
      helmetColor: 'Rouge',
      status: 'Pending'
    };
    setFights([...fights, newFight]);
    setIsEditing(newFight.id);
  };

  return (
    <div className="p-4 pb-24 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-white uppercase tracking-wider">Tournoi</h2>
        <select 
          value={selectedCompId} 
          onChange={(e) => setSelectedCompId(e.target.value)}
          className="bg-slate-800 text-xs text-white p-2 rounded border border-slate-600"
        >
          {INITIAL_COMPETITIONS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 mb-6 bg-slate-900/50 p-1 rounded-xl">
        {['PREP', 'TIMELINE', 'PALMARES'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === tab 
              ? 'bg-cyan-600 text-white shadow-lg' 
              : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {tab === 'PREP' ? 'PRÉPARATION' : tab === 'TIMELINE' ? 'TIMELINE' : 'HISTORIQUE'}
          </button>
        ))}
      </div>

      {/* --- PREP VIEW --- */}
      {activeTab === 'PREP' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={addFight} className="flex items-center text-xs bg-slate-800 px-3 py-2 rounded text-cyan-400 hover:bg-slate-700">
              <Plus size={14} className="mr-1"/> Ajouter un combat
            </button>
          </div>
          
          {filteredFights.map((fight) => {
            const fighter = competitors.find(c => c.id === fight.fighterId);
            return (
              <FuturisticCard key={fight.id} className="relative" borderColor={fight.helmetColor === 'Rouge' ? 'rose' : 'cyan'}>
                <div className="grid grid-cols-[1fr_auto] gap-2 items-center mb-2">
                   <div className="font-bold text-lg text-white">{fighter?.name}</div>
                   <div className="text-xs text-slate-400">#Combat {fight.fightNumber}</div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="text-slate-500 block">Adversaire</label>
                    <input 
                      type="text" 
                      placeholder="Nom adversaire" 
                      value={fight.opponentName || ''} 
                      onChange={(e) => handleUpdateFight(fight.id, 'opponentName', e.target.value)}
                      className="bg-slate-950 border border-slate-700 rounded w-full p-1 mt-1 text-slate-300"
                    />
                  </div>
                   <div>
                    <label className="text-slate-500 block">Compétiteur</label>
                    <select
                      value={fight.fighterId}
                      onChange={(e) => handleUpdateFight(fight.id, 'fighterId', e.target.value)}
                      className="bg-slate-950 border border-slate-700 rounded w-full p-1 mt-1 text-slate-300"
                    >
                      {competitors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-500 block">Aire / Ring</label>
                    <select 
                       value={fight.ring}
                       onChange={(e) => handleUpdateFight(fight.id, 'ring', e.target.value)}
                       className="bg-slate-950 border border-slate-700 rounded w-full p-1 mt-1 text-slate-300"
                    >
                      <option value="A">Ring A</option>
                      <option value="B">Ring B</option>
                      <option value="C">Ring C</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-500 block">Numéro</label>
                    <input 
                      type="number" 
                      value={fight.fightNumber} 
                      onChange={(e) => handleUpdateFight(fight.id, 'fightNumber', parseInt(e.target.value))}
                      className="bg-slate-950 border border-slate-700 rounded w-full p-1 mt-1 text-slate-300"
                    />
                  </div>
                  <div className="col-span-2 flex space-x-2 mt-2">
                     <button 
                       onClick={() => handleUpdateFight(fight.id, 'helmetColor', 'Rouge')}
                       className={`flex-1 py-1 rounded border ${fight.helmetColor === 'Rouge' ? 'bg-red-900/50 border-red-500 text-white' : 'border-slate-700 text-slate-500'}`}
                     >
                       Coin ROUGE
                     </button>
                     <button 
                       onClick={() => handleUpdateFight(fight.id, 'helmetColor', 'Bleu')}
                       className={`flex-1 py-1 rounded border ${fight.helmetColor === 'Bleu' ? 'bg-blue-900/50 border-blue-500 text-white' : 'border-slate-700 text-slate-500'}`}
                     >
                       Coin BLEU
                     </button>
                  </div>
                </div>
              </FuturisticCard>
            );
          })}
        </div>
      )}

      {/* --- TIMELINE VIEW --- */}
      {activeTab === 'TIMELINE' && (
        <div className="space-y-6">
          {conflicts.length > 0 && (
             <div className="bg-orange-900/20 border border-orange-600/50 rounded-lg p-3 animate-pulse">
               <div className="flex items-center text-orange-400 font-bold mb-2">
                 <AlertTriangle size={18} className="mr-2" />
                 Conflits Détectés
               </div>
               <ul className="text-xs text-orange-200 list-disc list-inside">
                 {conflicts.map((c, i) => <li key={i}>{c}</li>)}
               </ul>
             </div>
          )}

          {['A', 'B', 'C'].map(ring => {
            const ringFights = filteredFights.filter(f => f.ring === ring);
            if(ringFights.length === 0) return null;

            return (
              <div key={ring} className="space-y-2">
                 <h3 className="text-sm font-mono text-slate-400 border-b border-slate-800 pb-1">RING {ring}</h3>
                 <div className="space-y-2 pl-2 border-l-2 border-slate-800 ml-2">
                    {ringFights.map(fight => {
                       const fighter = competitors.find(c => c.id === fight.fighterId);
                       return (
                         <div key={fight.id} className="relative pl-4 py-2">
                           <div className="absolute -left-[9px] top-4 w-4 h-4 rounded-full bg-slate-900 border-2 border-slate-600 z-10"></div>
                           <div className={`text-xs font-bold ${fight.helmetColor === 'Rouge' ? 'text-rose-400' : 'text-cyan-400'}`}>
                             #{fight.fightNumber} - {fighter?.name}
                           </div>
                           <div className="text-[10px] text-slate-500">vs {fight.opponentName || '???'}</div>
                         </div>
                       )
                    })}
                 </div>
              </div>
            )
          })}
        </div>
      )}

      {/* --- PALMARES VIEW --- */}
      {activeTab === 'PALMARES' && (
        <div className="space-y-4">
           {competitors.map(comp => (
             <FuturisticCard key={comp.id}>
               <div className="flex items-center space-x-3 mb-3">
                 <Shield className="text-yellow-500" size={20} />
                 <span className="font-bold text-lg">{comp.name}</span>
               </div>
               {comp.titles.length > 0 ? (
                 <div className="space-y-2">
                   {comp.titles.map((t, idx) => (
                     <div key={idx} className="flex justify-between items-center bg-slate-950/50 p-2 rounded border border-slate-800">
                       <span className="text-xs text-slate-300">{t.competition}</span>
                       <span className="text-xs font-bold text-yellow-400">{t.rank} {t.year}</span>
                     </div>
                   ))}
                 </div>
               ) : (
                 <p className="text-xs text-slate-500 italic">Aucun titre enregistré.</p>
               )}
             </FuturisticCard>
           ))}
        </div>
      )}

    </div>
  );
};

export default Tournament;