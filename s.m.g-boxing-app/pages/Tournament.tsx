import React, { useState, useEffect } from 'react';
import { INITIAL_MEMBERS, INITIAL_COMPETITIONS } from '../constants';
import { Fight, User, Competition } from '../types';
import FuturisticCard from '../components/ui/FuturisticCard';
import { Shield, AlertTriangle, Plus, Trash2, Globe, RefreshCw, Eye, Settings, CloudDownload, Key, LogIn, AlertCircle, Users } from 'lucide-react';
import { getActiveCompetitions, getCompetitionMatches, getCompetitionRegistrations, loginFFKMDA } from '../services/ffkmda';

interface TournamentProps {
  currentUser: User;
}

const Tournament: React.FC<TournamentProps> = ({ currentUser }) => {
  const isStaff = currentUser.role === 'Admin' || currentUser.role === 'Coach';
  
  // --- STATE ---
  const [activeTab, setActiveTab] = useState<'GESTION' | 'TIMELINE' | 'PALMARES'>(isStaff ? 'GESTION' : 'TIMELINE');
  const [competitions, setCompetitions] = useState<Competition[]>(INITIAL_COMPETITIONS);
  const [selectedCompId, setSelectedCompId] = useState(INITIAL_COMPETITIONS[0].id);
  const [fights, setFights] = useState<Fight[]>([
    { id: 'f1', fighterId: '1', fighterName: 'Thomas Anderson', competitionId: 'c1', fightNumber: 10, ring: 'A', helmetColor: 'Rouge', status: 'Pending', opponentName: 'John Doe' },
    { id: 'f2', fighterId: '2', fighterName: 'Sarah Connor', competitionId: 'c1', fightNumber: 12, ring: 'B', helmetColor: 'Bleu', status: 'Pending', opponentName: 'Jane Smith' }
  ]);
  
  // FFKMDA Module State
  const [isScanning, setIsScanning] = useState(false);
  const [showApiSettings, setShowApiSettings] = useState(false);
  const [apiToken, setApiToken] = useState('');
  const [apiStatus, setApiStatus] = useState<'IDLE' | 'READY' | 'ERROR'>('IDLE');
  
  // Login FFKMDA State
  const [fedEmail, setFedEmail] = useState('0172055');
  const [fedPass, setFedPass] = useState('CyberaxGundam69*');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Competitors Data
  const [competitors, setCompetitors] = useState<User[]>([]);

  // --- INIT ---
  useEffect(() => {
     // 1. Load Members
     const storedUsers = localStorage.getItem('smg_users');
     const localUsers = storedUsers ? JSON.parse(storedUsers) : [];
     const mappedInitial = INITIAL_MEMBERS.map(m => ({ id: m.id, name: m.name, category: m.category } as User));
     
     // Merge et filter
     const allComps = [...mappedInitial, ...localUsers].filter((u, index, self) => 
        index === self.findIndex((t) => t.id === u.id) && (u.category === 'Compétiteur' || u.category === 'Pro')
     );
     setCompetitors(allComps);

     // 2. Load API Token
     const storedToken = localStorage.getItem('ffkmda_token');
     if (storedToken) {
       setApiToken(storedToken);
       setApiStatus('READY');
     }
     
     // 3. Load Saved Competitions
     const storedComps = localStorage.getItem('smg_competitions');
     if (storedComps) {
       const parsedComps = JSON.parse(storedComps);
       if (parsedComps.length > 0) {
           setCompetitions(parsedComps);
           // Si on a sauvegardé une sélection, on essaie de la restaurer, sinon le premier
           setSelectedCompId(parsedComps[0].id);
       }
     }
  }, []);

  // --- FFKMDA ACTIONS ---

  const handleFederationLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fedEmail || !fedPass) return alert("Email et mot de passe requis");

    setIsLoggingIn(true);
    setApiStatus('IDLE');
    
    try {
      const token = await loginFFKMDA(fedEmail, fedPass);
      setApiToken(token);
      localStorage.setItem('ffkmda_token', token);
      setApiStatus('READY');
      alert("Connexion réussie ! Token récupéré.");
    } catch (error: any) {
      console.error(error);
      setApiStatus('ERROR');
      
      if (error.message === "ENDPOINT_NOT_FOUND") {
        alert("Impossible de se connecter automatiquement.\n\nSOLUTION : Collez le token 'Bearer' depuis F12 > Network dans le champ Manuel.");
      } else if (error.message === "BAD_CREDENTIALS") {
        alert("Identifiants incorrects.");
      } else {
        alert("Erreur réseau.");
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSaveTokenManual = () => {
    const cleanToken = apiToken.replace('Bearer ', '').trim();
    if (cleanToken.length > 20) {
      setApiToken(cleanToken);
      localStorage.setItem('ffkmda_token', cleanToken);
      setApiStatus('READY');
      alert('Token API sauvegardé.');
    } else {
      alert('Token invalide.');
    }
  };

  // Importe la liste des compétitions (ID 900 inclus normalement via fetchAllData)
  const handleImportCompetitions = async () => {
    if (apiStatus !== 'READY') return alert("Veuillez d'abord configurer le Token API.");
    
    setIsScanning(true);
    try {
      const activeComps = await getActiveCompetitions(apiToken);
      
      if (activeComps.length > 0) {
        // Fusion intelligente
        const merged = [...competitions];
        let addedCount = 0;
        
        activeComps.forEach(newC => {
          if (!merged.find(c => c.ffkmdaId === newC.ffkmdaId)) {
            merged.push(newC);
            addedCount++;
          }
        });
        
        // Trier par date (plus récent en premier)
        merged.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        setCompetitions(merged);
        localStorage.setItem('smg_competitions', JSON.stringify(merged));
        
        alert(`${addedCount} nouvelles compétitions trouvées.`);
        if (merged.length > 0) setSelectedCompId(merged[0].id);

      } else {
        alert("Aucune compétition trouvée. Vérifiez le token ou la saison.");
      }
    } catch (e) {
      alert("Erreur import compétitions.");
      setApiStatus('ERROR');
    } finally {
      setIsScanning(false);
    }
  };

  // Importe les compétiteurs INSCRITS à la compétition sélectionnée (ex: ID 900)
  const handleImportCompetitors = async () => {
    if (apiStatus !== 'READY') return alert("Token requis.");
    
    const currentComp = competitions.find(c => c.id === selectedCompId);
    if (!currentComp || !currentComp.ffkmdaId) {
      return alert("Sélectionnez une compétition fédérale (ID 900...) dans le menu déroulant.");
    }

    setIsScanning(true);
    try {
        const regs = await getCompetitionRegistrations(currentComp.ffkmdaId, apiToken);
        
        if (regs.length > 0) {
            const newCompetitors = [...competitors];
            let added = 0;

            regs.forEach((reg: any) => {
                // On vérifie si le compétiteur existe déjà par nom (approximatif)
                const exists = newCompetitors.find(c => c.name.toLowerCase() === reg.name.toLowerCase());
                if (!exists) {
                    newCompetitors.push(reg);
                    added++;
                }
            });

            setCompetitors(newCompetitors);
            // On sauvegarde aussi dans le localStorage global des users pour persistance
            localStorage.setItem('smg_users', JSON.stringify(newCompetitors));
            
            alert(`${added} nouveaux compétiteurs importés depuis la compétition ${currentComp.ffkmdaId}.`);
        } else {
            alert("Aucun inscrit trouvé pour cette compétition.");
        }
    } catch(e) {
        alert("Erreur lors de la récupération des inscrits.");
    } finally {
        setIsScanning(false);
    }
  };

  const handleAutoScanMatches = async () => {
    if (apiStatus !== 'READY') return alert("Token requis.");
    
    const currentComp = competitions.find(c => c.id === selectedCompId);
    if (!currentComp || !currentComp.ffkmdaId) {
      return alert("Compétition non valide pour le scan.");
    }

    setIsScanning(true);
    try {
      const apiMatches = await getCompetitionMatches(currentComp.ffkmdaId, apiToken);
      
      const newFights: Fight[] = [];
      let updatesCount = 0;

      apiMatches.forEach(match => {
        const normalize = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '');
        const p1NameNorm = normalize(match.fighter1);
        const p2NameNorm = normalize(match.fighter2);

        // On cherche si un de NOS compétiteurs est dans le match
        const myFighter = competitors.find(c => {
           const cNameNorm = normalize(c.name);
           return p1NameNorm.includes(cNameNorm) || p2NameNorm.includes(cNameNorm);
        });

        if (myFighter) {
          updatesCount++;
          const isP1 = p1NameNorm.includes(normalize(myFighter.name));
          const opponent = isP1 ? match.fighter2 : match.fighter1;
          const color = isP1 ? 'Rouge' : 'Bleu';

          newFights.push({
            id: `auto-${match.externalId || Date.now()}`,
            fighterId: myFighter.id,
            fighterName: myFighter.name,
            competitionId: selectedCompId,
            fightNumber: match.order,
            ring: match.ring,
            helmetColor: color,
            opponentName: opponent,
            status: match.status === 'finished' ? 'Finished' : match.status === 'current' ? 'Ongoing' : 'Pending',
            isAutoImported: true
          });
        }
      });

      if (updatesCount > 0) {
        setFights(prev => {
           // On retire les anciens matchs auto de CETTE compétition pour éviter doublons
           const others = prev.filter(f => !(f.competitionId === selectedCompId && f.isAutoImported));
           return [...others, ...newFights];
        });
        alert(`Scan terminé : ${updatesCount} combats mis à jour.`);
      } else {
        alert("Aucun de vos compétiteurs détecté dans le planning.");
      }

    } catch (e) {
      alert("Erreur lors du scan du planning.");
    } finally {
      setIsScanning(false);
    }
  };

  // --- MANUAL ACTIONS ---
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
  const currentCompetitionName = competitions.find(c => c.id === selectedCompId)?.name || 'Compétition';

  // --- RENDER ---
  return (
    <div className="p-4 pb-24 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <div>
           <h2 className="text-xl font-bold text-white uppercase tracking-wider">COMPÉTITIONS</h2>
           <p className="text-[10px] text-cyan-400 font-mono">
             {isStaff ? 'MODE GESTION (ADMIN)' : 'MODE COMPÉTITEUR (LIVE)'}
           </p>
        </div>
        <div className="flex gap-2">
           {isStaff && (
             <button 
               onClick={() => setShowApiSettings(!showApiSettings)}
               className={`p-2 rounded border ${apiStatus === 'READY' ? 'border-green-500 bg-green-900/20 text-green-500' : 'border-slate-600 bg-slate-800 text-slate-400'}`}
             >
               <Settings size={16} />
             </button>
           )}
           <select 
            value={selectedCompId} 
            onChange={(e) => setSelectedCompId(e.target.value)}
            className="bg-slate-800 text-xs text-white p-2 rounded border border-slate-600 max-w-[150px] truncate"
           >
            {competitions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
           </select>
        </div>
      </div>

      {/* --- API SETTINGS MODAL (Inline) --- */}
      {showApiSettings && isStaff && (
        <FuturisticCard className="mb-4 animate-fade-in" borderColor="cyan" title="CONNEXION FÉDÉRATION">
           <div className="space-y-4">
             {/* LOGIN FORM - Masqué si connecté manuellement pour gagner place */}
             {apiStatus !== 'READY' && (
                <div className="bg-slate-900/50 p-3 rounded border border-slate-700">
                  <form onSubmit={handleFederationLogin} className="space-y-2">
                    <input type="text" placeholder="Email / ID" value={fedEmail} onChange={e => setFedEmail(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-xs text-white"/>
                    <input type="password" placeholder="Mot de passe" value={fedPass} onChange={e => setFedPass(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-xs text-white"/>
                    <button type="submit" disabled={isLoggingIn} className="w-full bg-cyan-600 text-white rounded py-2 text-xs font-bold">{isLoggingIn ? '...' : 'CONNEXION AUTO'}</button>
                  </form>
                </div>
             )}

             {/* MANUAL TOKEN */}
             <div className="flex gap-2">
               <div className="relative flex-1">
                 <Key className="absolute left-3 top-2.5 text-slate-500" size={14} />
                 <input 
                   type="text" 
                   value={apiToken}
                   onChange={e => setApiToken(e.target.value)}
                   className="w-full bg-slate-950 border border-slate-700 rounded py-2 pl-9 pr-2 text-[10px] text-white font-mono"
                   placeholder="Token Bearer..."
                 />
               </div>
               <button onClick={handleSaveTokenManual} className="bg-slate-700 text-white px-3 rounded text-xs font-bold">OK</button>
             </div>

             <div className="pt-2 border-t border-slate-800 grid grid-cols-2 gap-2">
               {/* BOUTON 1 : RECUP LISTE COMPETITIONS */}
               <button 
                 onClick={handleImportCompetitions} 
                 disabled={isScanning || apiStatus !== 'READY'}
                 className="flex flex-col items-center justify-center p-2 bg-slate-800 rounded hover:bg-slate-700 disabled:opacity-50"
               >
                 <CloudDownload size={16} className="text-cyan-400 mb-1"/>
                 <span className="text-[9px] text-center">MAJ Compétitions</span>
               </button>

               {/* BOUTON 2 : RECUP COMPETITEURS DE L'EVENT */}
               <button 
                 onClick={handleImportCompetitors} 
                 disabled={isScanning || apiStatus !== 'READY'}
                 className="flex flex-col items-center justify-center p-2 bg-slate-800 rounded hover:bg-slate-700 disabled:opacity-50"
               >
                 <Users size={16} className="text-rose-400 mb-1"/>
                 <span className="text-[9px] text-center">Importer Inscrits ({competitions.find(c=>c.id===selectedCompId)?.ffkmdaId || '?'})</span>
               </button>
             </div>
           </div>
        </FuturisticCard>
      )}

      {/* Tabs */}
      <div className="flex space-x-2 mb-6 bg-slate-900/50 p-1 rounded-xl">
        {isStaff && (
          <button
            onClick={() => setActiveTab('GESTION')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'GESTION' ? 'bg-rose-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
          >
            GESTION
          </button>
        )}
        <button
          onClick={() => setActiveTab('TIMELINE')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'TIMELINE' ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
        >
          TIMELINE
        </button>
        <button
          onClick={() => setActiveTab('PALMARES')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'PALMARES' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
        >
          PALMARES
        </button>
      </div>

      {/* --- GESTION VIEW (ADMIN ONLY) --- */}
      {activeTab === 'GESTION' && isStaff && (
        <div className="space-y-4">
          <div className="flex justify-between gap-2">
            <button 
               onClick={handleAutoScanMatches} 
               disabled={isScanning || apiStatus !== 'READY'}
               className={`flex-1 flex items-center justify-center text-xs border px-3 py-3 rounded transition-colors disabled:opacity-50 ${
                 apiStatus === 'READY' 
                   ? 'bg-slate-800 border-green-500/50 text-green-400 hover:bg-slate-700' 
                   : 'bg-slate-900 border-slate-700 text-slate-500'
               }`}
            >
              <RefreshCw size={14} className={`mr-2 ${isScanning ? 'animate-spin' : ''}`}/> 
              {isScanning ? 'SCAN EN COURS...' : 'SCAN PLANNING'}
            </button>
            <button onClick={addFight} className="flex-1 flex items-center justify-center text-xs bg-slate-800 border border-slate-600 px-3 py-3 rounded text-cyan-400 hover:bg-slate-700">
              <Plus size={14} className="mr-1"/> AJOUT MANUEL
            </button>
          </div>

          <div className="text-[10px] text-slate-500 text-center italic">
             {apiStatus === 'READY' ? `Connecté (Event ID: ${competitions.find(c=>c.id===selectedCompId)?.ffkmdaId})` : 'API Déconnectée'}
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
                      {/* Cas où l'API renvoie autre chose */}
                      {fight.isAutoImported && !['A','B','C'].includes(fight.ring) && (
                         <option value={fight.ring}>{fight.ring}</option>
                      )}
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

      {/* --- TIMELINE VIEW --- */}
      {activeTab === 'TIMELINE' && (
        <div className="space-y-6">
          <div className="text-center mb-4">
            <h3 className="text-lg font-bold text-white">{currentCompetitionName}</h3>
            <span className="text-xs text-slate-500">Ordre de passage en temps réel</span>
          </div>

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
                           <div className={`absolute -left-[9px] top-4 w-4 h-4 rounded-full border-2 z-10 ${fight.status === 'Finished' ? 'bg-slate-700 border-slate-500' : fight.status === 'Ongoing' ? 'bg-green-500 border-green-300 animate-pulse' : 'bg-slate-900 border-slate-600'}`}></div>
                           
                           <div className={`text-sm font-bold ${fight.helmetColor === 'Rouge' ? 'text-rose-400' : fight.helmetColor === 'Bleu' ? 'text-cyan-400' : 'text-slate-300'}`}>
                             #{fight.fightNumber} - {fight.fighterName}
                           </div>
                           <div className="text-xs text-slate-400"><span className="text-slate-600">vs</span> {fight.opponentName || '???'}</div>
                           {currentUser.id === fight.fighterId && (<div className="mt-1 inline-block bg-yellow-500/20 text-yellow-400 text-[10px] px-2 rounded border border-yellow-500/30 animate-pulse">🔥 C'EST TON TOUR !</div>)}
                       </div>
                    ))}
                 </div>
              </div>
            )
          })}
          {filteredFights.length === 0 && (
            <div className="text-center text-slate-500 text-xs py-10 border border-dashed border-slate-800 rounded">
              <p>Aucun combat planifié.</p>
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
               <div className="text-xs text-slate-400">
                  <p>Catégorie : {comp.category}</p>
                  <p className="mt-1 italic opacity-50">Historique des médailles...</p>
               </div>
             </FuturisticCard>
           ))}
           {competitors.length === 0 && <p className="text-slate-500 text-center text-sm">Aucun compétiteur enregistré. Utilisez "Importer Inscrits".</p>}
        </div>
      )}

    </div>
  );
};

export default Tournament;