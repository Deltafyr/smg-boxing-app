import React, { useState, useEffect } from 'react';
import { INITIAL_MEMBERS, INITIAL_COMPETITIONS } from '../constants';
import { Fight, User, Competition } from '../types';
import FuturisticCard from '../components/ui/FuturisticCard';
import { Shield, AlertTriangle, Plus, Trash2, Globe, RefreshCw, Eye } from 'lucide-react';

interface TournamentProps {
  currentUser: User;
}

const Tournament: React.FC<TournamentProps> = ({ currentUser }) => {
  const isStaff = currentUser.role === 'Admin' || currentUser.role === 'Coach';
  
  // Par défaut, le staff voit la gestion, les autres voient la timeline
  const [activeTab, setActiveTab] = useState<'GESTION' | 'TIMELINE' | 'PALMARES'>(isStaff ? 'GESTION' : 'TIMELINE');
  const [selectedCompId, setSelectedCompId] = useState(INITIAL_COMPETITIONS[0].id);
  const [fights, setFights] = useState<Fight[]>([
    { id: 'f1', fighterId: '1', fighterName: 'Thomas Anderson', competitionId: 'c1', fightNumber: 10, ring: 'A', helmetColor: 'Rouge', status: 'Pending', opponentName: 'John Doe' },
    { id: 'f2', fighterId: '2', fighterName: 'Sarah Connor', competitionId: 'c1', fightNumber: 12, ring: 'B', helmetColor: 'Bleu', status: 'Pending', opponentName: 'Jane Smith' }
  ]);
  const [isScanning, setIsScanning] = useState(false);

  // Charger la liste complète des membres pour trouver les noms
  const [competitors, setCompetitors] = useState<User[]>([]);

  useEffect(() => {
     // On charge les membres depuis le LocalStorage + Mock
     const storedUsers = localStorage.getItem('smg_users');
     const localUsers = storedUsers ? JSON.parse(storedUsers) : [];
     // Fusionner avec INITIAL_MEMBERS converti en User partiel pour la logique
     // Ici simplifcation : on prend INITIAL_MEMBERS comme base et on cherche dedans
     // Dans une vraie app, on aurait une seule source de vérité.
     
     // Mock conversion for display
     const mappedInitial = INITIAL_MEMBERS.map(m => ({ id: m.id, name: m.name, category: m.category } as User));
     setCompetitors([...mappedInitial, ...localUsers].filter(u => u.category === 'Compétiteur' || u.category === 'Pro'));
  }, []);


  // --- SIMULATION DU SCRIPT GAS FFKMDA ---
  const handleAutoScanFFKMDA = () => {
    setIsScanning(true);
    
    // Simulation du délai API
    setTimeout(() => {
      // Logique simulée : On récupère des "matchs" depuis l'API FFKMDA fictive
      // Et on cherche nos compétiteurs dedans.
      
      const MOCK_API_RESULTS = [
        { 
          competitor1: { firstname: 'Thomas', lastname: 'Anderson' },
          competitor2: { firstname: 'Jean', lastname: 'Michel' },
          ring: 'A', number: 10, order: 10
        },
        { 
          competitor1: { firstname: 'Pierre', lastname: 'Paul' },
          competitor2: { firstname: 'Sarah', lastname: 'Connor' },
          ring: 'B', number: 15, order: 15
        },
        { 
          competitor1: { firstname: 'Inconnu', lastname: 'Au Bataillon' },
          competitor2: { firstname: 'Autre', lastname: 'Club' },
          ring: 'C', number: 20, order: 20
        }
      ];

      const newFights: Fight[] = [];
      let updatesCount = 0;

      MOCK_API_RESULTS.forEach(match => {
        // Normalisation des noms pour la recherche
        const p1Name = `${match.competitor1.firstname} ${match.competitor1.lastname}`.toLowerCase();
        const p2Name = `${match.competitor2.firstname} ${match.competitor2.lastname}`.toLowerCase();

        // Chercher si un de nos gars est dedans
        const myFighter = competitors.find(c => {
           const cName = c.name.toLowerCase();
           return p1Name.includes(cName) || p2Name.includes(cName); // Simple includes check
        });

        if (myFighter) {
          updatesCount++;
          // Déterminer couleur
          const isP1 = p1Name.includes(myFighter.name.toLowerCase());
          const opponent = isP1 ? `${match.competitor2.firstname} ${match.competitor2.lastname}` : `${match.competitor1.firstname} ${match.competitor1.lastname}`;
          const color = isP1 ? 'Rouge' : 'Bleu';

          newFights.push({
            id: `auto-${Date.now()}-${updatesCount}`,
            fighterId: myFighter.id,
            fighterName: myFighter.name,
            competitionId: selectedCompId,
            fightNumber: match.number,
            ring: match.ring,
            helmetColor: color,
            opponentName: opponent,
            status: 'Pending',
            isAutoImported: true
          });
        }
      });

      if (updatesCount > 0) {
        // Fusion intelligente : on remplace les existants si même fighter/compétition ou on ajoute
        // Ici simple : on concatène pour la démo, en filtrant les doublons grossiers
        setFights(prev => {
           const others = prev.filter(f => f.competitionId !== selectedCompId || !f.isAutoImported);
           return [...others, ...newFights];
        });
        alert(`Scan terminé : ${updatesCount} combats trouvés et mis à jour.`);
      } else {
        alert("Aucun combattant du club trouvé dans le planning de cette compétition.");
      }

      setIsScanning(false);
    }, 2000);
  };

  // --- LOGIC GESTION ---
  const handleUpdateFight = (id: string, field: keyof Fight, value: any) => {
    setFights(prev => prev.map(f => f.id === id ? { ...f, [field]: value } : f));
  };

  const addFight = () => {
    const newFight: Fight = {
      id: Math.random().toString(36).substr(2, 9),
      fighterId: competitors[0]?.id || 'unknown',
      fighterName: competitors[0]?.name || 'Inconnu',
      competitionId: selectedCompId,
      fightNumber: 0,
      ring: 'A',
      helmetColor: 'Rouge',
      status: 'Pending'
    };
    setFights([...fights, newFight]);
  };

  const deleteFight = (id: string) => {
    if(confirm('Supprimer ce combat ?')) {
       setFights(prev => prev.filter(f => f.id !== id));
    }
  };

  const filteredFights = fights.filter(f => f.competitionId === selectedCompId).sort((a, b) => a.fightNumber - b.fightNumber);

  // --- RENDER ---
  return (
    <div className="p-4 pb-24 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <div>
           <h2 className="text-xl font-bold text-white uppercase tracking-wider">Tournoi</h2>
           <p className="text-[10px] text-cyan-400 font-mono">
             {isStaff ? 'MODE GESTION (ADMIN/COACH)' : 'MODE COMPÉTITEUR (LECTURE)'}
           </p>
        </div>
        <select 
          value={selectedCompId} 
          onChange={(e) => setSelectedCompId(e.target.value)}
          className="bg-slate-800 text-xs text-white p-2 rounded border border-slate-600 max-w-[150px]"
        >
          {INITIAL_COMPETITIONS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 mb-6 bg-slate-900/50 p-1 rounded-xl">
        {isStaff && (
          <button
            onClick={() => setActiveTab('GESTION')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'GESTION' ? 'bg-rose-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            GESTION
          </button>
        )}
        <button
          onClick={() => setActiveTab('TIMELINE')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
            activeTab === 'TIMELINE' ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          TIMELINE
        </button>
        <button
          onClick={() => setActiveTab('PALMARES')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
            activeTab === 'PALMARES' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          PALMARES
        </button>
      </div>

      {/* --- GESTION VIEW (ADMIN ONLY) --- */}
      {activeTab === 'GESTION' && isStaff && (
        <div className="space-y-4">
          <div className="flex justify-between gap-2">
            <button 
               onClick={handleAutoScanFFKMDA} 
               disabled={isScanning}
               className="flex-1 flex items-center justify-center text-xs bg-slate-800 border border-slate-600 px-3 py-3 rounded text-green-400 hover:bg-slate-700 disabled:opacity-50"
            >
              <RefreshCw size={14} className={`mr-2 ${isScanning ? 'animate-spin' : ''}`}/> 
              {isScanning ? 'SCAN EN COURS...' : 'SCAN AUTO FFKMDA'}
            </button>
            <button onClick={addFight} className="flex-1 flex items-center justify-center text-xs bg-slate-800 border border-slate-600 px-3 py-3 rounded text-cyan-400 hover:bg-slate-700">
              <Plus size={14} className="mr-1"/> AJOUT MANUEL
            </button>
          </div>

          <div className="text-[10px] text-slate-500 text-center italic">
            Connecté à l'API FFKMDA (Simulé) • Saison 2025/2026
          </div>
          
          {filteredFights.map((fight) => (
            <FuturisticCard key={fight.id} className="relative group" borderColor={fight.helmetColor === 'Rouge' ? 'rose' : fight.helmetColor === 'Bleu' ? 'cyan' : 'slate'}>
                <div className="absolute top-2 right-2 flex space-x-2">
                   {fight.isAutoImported && (
                     <span title="Importé via FFKMDA">
                       <Globe size={14} className="text-green-500" />
                     </span>
                   )}
                   <button onClick={() => deleteFight(fight.id)} className="text-slate-600 hover:text-rose-500"><Trash2 size={14}/></button>
                </div>

                <div className="grid grid-cols-[1fr_auto] gap-2 items-center mb-2 pr-8">
                   <div className="font-bold text-sm text-white">{fight.fighterName}</div>
                   <div className="text-xs text-slate-400 font-mono">#{fight.fightNumber}</div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-slate-500 block mb-1">Adversaire</label>
                    <input 
                      type="text" 
                      value={fight.opponentName || ''} 
                      onChange={(e) => handleUpdateFight(fight.id, 'opponentName', e.target.value)}
                      className="bg-slate-950 border border-slate-700 rounded w-full p-1 text-slate-300"
                    />
                  </div>
                   <div>
                    <label className="text-slate-500 block mb-1">Compétiteur</label>
                    <select
                      value={fight.fighterId}
                      onChange={(e) => {
                         const selected = competitors.find(c => c.id === e.target.value);
                         handleUpdateFight(fight.id, 'fighterId', e.target.value);
                         if(selected) handleUpdateFight(fight.id, 'fighterName', selected.name);
                      }}
                      className="bg-slate-950 border border-slate-700 rounded w-full p-1 text-slate-300"
                    >
                      {competitors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-500 block mb-1">Aire / Ring</label>
                    <select 
                       value={fight.ring}
                       onChange={(e) => handleUpdateFight(fight.id, 'ring', e.target.value)}
                       className="bg-slate-950 border border-slate-700 rounded w-full p-1 text-slate-300"
                    >
                      <option value="A">Ring A</option>
                      <option value="B">Ring B</option>
                      <option value="C">Ring C</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-500 block mb-1">Ordre</label>
                    <input 
                      type="number" 
                      value={fight.fightNumber} 
                      onChange={(e) => handleUpdateFight(fight.id, 'fightNumber', parseInt(e.target.value))}
                      className="bg-slate-950 border border-slate-700 rounded w-full p-1 text-slate-300"
                    />
                  </div>
                  <div className="col-span-2 flex space-x-2 mt-1">
                     <button onClick={() => handleUpdateFight(fight.id, 'helmetColor', 'Rouge')} className={`flex-1 py-1 rounded border text-[10px] font-bold ${fight.helmetColor === 'Rouge' ? 'bg-red-900/50 border-red-500 text-white' : 'border-slate-700 text-slate-500'}`}>ROUGE</button>
                     <button onClick={() => handleUpdateFight(fight.id, 'helmetColor', 'Bleu')} className={`flex-1 py-1 rounded border text-[10px] font-bold ${fight.helmetColor === 'Bleu' ? 'bg-blue-900/50 border-blue-500 text-white' : 'border-slate-700 text-slate-500'}`}>BLEU</button>
                  </div>
                </div>
            </FuturisticCard>
          ))}
        </div>
      )}

      {/* --- TIMELINE VIEW (PUBLIC/COMPETITOR) --- */}
      {activeTab === 'TIMELINE' && (
        <div className="space-y-6">
          {['A', 'B', 'C'].map(ring => {
            const ringFights = filteredFights.filter(f => f.ring === ring);
            if(ringFights.length === 0) return null;

            return (
              <div key={ring} className="space-y-2">
                 <h3 className="text-sm font-mono text-slate-400 border-b border-slate-800 pb-1 flex justify-between">
                    <span>RING {ring}</span>
                    <span className="text-[10px] opacity-50">{ringFights.length} combats</span>
                 </h3>
                 <div className="space-y-2 pl-2 border-l-2 border-slate-800 ml-2">
                    {ringFights.map(fight => (
                       <div key={fight.id} className="relative pl-4 py-2 group">
                           {/* Status Dot */}
                           <div className={`absolute -left-[9px] top-4 w-4 h-4 rounded-full border-2 z-10 ${
                             fight.status === 'Finished' ? 'bg-slate-700 border-slate-500' :
                             fight.status === 'Ongoing' ? 'bg-green-500 border-green-300 animate-pulse' :
                             'bg-slate-900 border-slate-600'
                           }`}></div>
                           
                           <div className={`text-sm font-bold ${
                             fight.helmetColor === 'Rouge' ? 'text-rose-400' : 
                             fight.helmetColor === 'Bleu' ? 'text-cyan-400' : 
                             'text-slate-300'
                           }`}>
                             #{fight.fightNumber} - {fight.fighterName}
                           </div>
                           <div className="text-xs text-slate-400">
                             <span className="text-slate-600">vs</span> {fight.opponentName || '???'}
                           </div>
                           
                           {/* Highlight pour l'utilisateur courant */}
                           {currentUser.id === fight.fighterId && (
                             <div className="mt-1 inline-block bg-yellow-500/20 text-yellow-400 text-[10px] px-2 rounded border border-yellow-500/30">
                               C'EST TON TOUR !
                             </div>
                           )}
                       </div>
                    ))}
                 </div>
              </div>
            )
          })}
          {filteredFights.length === 0 && (
            <div className="text-center text-slate-500 text-xs py-10">
              Aucun combat planifié pour l'instant.
            </div>
          )}
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
               <p className="text-xs text-slate-500 italic">Section palmarès à implémenter complètement.</p>
             </FuturisticCard>
           ))}
           {competitors.length === 0 && <p className="text-slate-500 text-center text-sm">Aucun compétiteur enregistré.</p>}
        </div>
      )}

    </div>
  );
};

export default Tournament;