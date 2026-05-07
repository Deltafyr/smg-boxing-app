import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { User, Competition, FightCard } from '../../types';
import FuturisticCard from '../../components/ui/FuturisticCard';
import { Trophy, ChevronRight, Swords, UserPlus, Save, Edit3, Trash2, CheckCircle, XCircle, Activity, Radar, Search, AlertTriangle, Plus, ListOrdered, Medal, Archive, Globe, Download } from 'lucide-react';

const calculateCategoryFFKMDA = (birthYear: number, gender: 'M'|'F' = 'M') => {
  const currentYear = new Date().getFullYear();
  const age = currentYear - birthYear;
  if (age <= 9) return `Poussin (${gender})`;
  if (age <= 11) return `Benjamin (${gender})`;
  if (age <= 13) return `Minime (${gender})`;
  if (age <= 15) return `Cadet (${gender})`;
  if (age <= 17) return `Junior (${gender})`;
  if (age <= 34) return `Senior (${gender})`;
  return `Vétéran (${gender})`;
};

const generateMatchesTimeline = (count: number) => {
  const titles = count >= 4 ? ['1/8 Finale', '1/4 Finale', 'Demi-Finale', 'Finale'] :
                 count === 3 ? ['1/4 Finale', 'Demi-Finale', 'Finale'] :
                 count === 2 ? ['Demi-Finale', 'Finale'] : ['Finale'];
  return titles.map((t, i) => ({ id: `m_${Date.now()}_${i}`, title: t, area: '', matchNum: '', headgear: '', result: 'En attente' }));
};

export default function Tournament({ currentUser }: { currentUser: User }) {
  if (!currentUser) return null;

  const [view, setView] = useState<'LIST' | 'DETAIL'>('LIST');
  const [detailTab, setDetailTab] = useState<'CARDS' | 'TIMELINE'>('CARDS');
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [fightCards, setFightCards] = useState<any[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [activeComp, setActiveComp] = useState<Competition | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);

  // Registration Form
  const [regMode, setRegMode] = useState<'INTERNAL'|'EXTERNAL'|'AUTO'>('AUTO');
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [extName, setExtName] = useState('');
  const [extBirthYear, setExtBirthYear] = useState(new Date().getFullYear() - 20);
  const [extGender, setExtGender] = useState<'M'|'F'>('M');
  const [extWeight, setExtWeight] = useState('');

  // Auto FFKMDA Scanner State
  const [ffkmdaId, setFfkmdaId] = useState('');
  const [scanStatus, setScanStatus] = useState<'IDLE'|'SCANNING'|'FOUND'|'ERROR'>('IDLE');
  const [scanLogs, setScanLogs] = useState<string[]>([]);

  // FFKMDA Catalog State
  const [ffkmdaCatalog, setFfkmdaCatalog] = useState<any[]>([]);
  const [isFetchingCatalog, setIsFetchingCatalog] = useState(false);

  const [isEditingComp, setIsEditingComp] = useState(false);
  const isStaff = currentUser.role === 'Admin' || currentUser.role === 'Coach';

  useEffect(() => { fetchData(); }, [isStaff]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const cSnap = await getDocs(collection(db, 'competitions'));
      const cList: Competition[] = []; cSnap.forEach(d => cList.push({ id: d.id, ...d.data() } as Competition));
      setCompetitions(cList.sort((a,b)=>new Date(b.date).getTime()-new Date(a.date).getTime()));

      const fSnap = await getDocs(collection(db, 'fightCards'));
      const fList: any[] = []; fSnap.forEach(d => fList.push({ id: d.id, ...d.data() }));
      setFightCards(fList);

      if (isStaff) {
        const mSnap = await getDocs(collection(db, 'members'));
        const mList: User[] = []; mSnap.forEach(d => mList.push({ id: d.id, ...d.data() } as User));
        setMembers(mList);
      }
    } catch (e) { console.error(e); }
    setIsLoading(false);
  };

  const handleCreateComp = async (directData: any) => {
    try {
      const docRef = await addDoc(collection(db, 'competitions'), directData);
      setCompetitions([{ id: docRef.id, ...directData }, ...competitions].sort((a,b)=>new Date(b.date).getTime()-new Date(a.date).getTime()));
      return { id: docRef.id, ...directData };
    } catch (e) { console.error(e); return null; }
  };

  const handleRegisterManual = async () => {
    if (!activeComp) return; setIsLoading(true);
    try {
      let newCard: any = { compId: activeComp.id, day: 'En attente', matches: generateMatchesTimeline(1), estimatedFights: 1, medal: '' };
      if (regMode === 'INTERNAL' && selectedMemberId) {
        const targetUser = members.find(m => m.id === selectedMemberId); if (!targetUser) return;
        const bYear = targetUser.birthDate ? new Date(targetUser.birthDate).getFullYear() : (new Date().getFullYear() - 25);
        newCard = { ...newCard, userId: targetUser.id, userName: targetUser.name, weight: targetUser.weight || 'N/C', category: calculateCategoryFFKMDA(bYear, targetUser.gender === 'Femme' ? 'F' : 'M') };
      } else if (regMode === 'EXTERNAL' && extName) {
        newCard = { ...newCard, userId: `ext_${Date.now()}`, userName: extName, weight: extWeight || 'N/C', category: calculateCategoryFFKMDA(extBirthYear, extGender) };
      } else { setIsLoading(false); return; }

      const docRef = await addDoc(collection(db, 'fightCards'), newCard);
      setFightCards([...fightCards, { id: docRef.id, ...newCard }]);
      setSelectedMemberId(''); setExtName(''); setExtWeight('');
    } catch (e) {} setIsLoading(false);
  };

  // =======================================================================
  // CORTEX CATALOG : APPEL API VERCEL
  // =======================================================================
  const fetchFFKMDACompetitions = async () => {
    setIsFetchingCatalog(true);
    setScanLogs(["Interrogation du Cortex S.M.G (Vercel)..."]);

    try {
      const response = await fetch('/api/catalog');
      const result = await response.json();

      if (!result.success) throw new Error("Échec du Cortex");

      setFfkmdaCatalog(result.data);
      setScanLogs([`${result.data.length} compétitions détectées sur le portail fédéral.`]);

    } catch (e) {
      setScanLogs(["Échec critique : Impossible d'accéder au catalogue via le serveur."]);
    }
    setIsFetchingCatalog(false);
  };

  const selectCatalogItem = (comp: any) => {
    setFfkmdaId(comp.id);
    setScanLogs([`Cible verrouillée : ${comp.name} (ID: ${comp.id})`]);
  };

  // =======================================================================
  // MOTEUR DE SCAN : APPEL API VERCEL + MATCHING LOCAL
  // =======================================================================
  const executeFFKMDAScan = async () => {
    if (!ffkmdaId) return;
    setScanStatus('SCANNING');
    setScanLogs(["Initialisation du Deep Scan S.M.G...", `Ciblage Compétition ID : ${ffkmdaId}`]);
    const delay = (ms: number) => new Promise(res => setTimeout(res, ms));
    const addLog = (msg: string) => setScanLogs(prev => [...prev, msg]);

    try {
      await delay(500);
      const response = await fetch(`/api/scan?id=${ffkmdaId}`);
      const result = await response.json();

      if (!result.success) throw new Error("Erreur de réponse serveur");

      addLog("Analyse des registres terminée. Lancement du matching...");
      const pageLower = result.pageData;

      // Matching strict mais tolérant à l'ordre des mots
      const foundMembers = members.filter(m => {
          if (!m.name) return false;
          const names = m.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().split(' ').filter(n => n.length > 2);
          if (names.length === 0) return false;
          return names.every(n => pageLower.includes(n));
      });

      if (foundMembers.length > 0) {
        addLog(`-> ${foundMembers.length} membre(s) identifié(s) !`);

        let compId = activeComp?.id;

        if (!compId) {
          const catItem = ffkmdaCatalog.find(c => c.id === ffkmdaId);
          const compData = {
            name: catItem ? catItem.name : `Tournoi FFKMDA #${ffkmdaId}`,
            date: catItem ? catItem.date.split('/').reverse().join('-') || new Date().toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            location: catItem ? catItem.location : "À définir",
            compType: "Compétition",
            compStyle: "Kickboxing"
          };
          const newComp = await handleCreateComp(compData);
          if(newComp) {
            compId = newComp.id;
            setActiveComp(newComp as Competition);
            setView('DETAIL');
          }
        }

        if (!compId) throw new Error("Erreur de création d'arène.");

        let newCardsAdded = 0;
        for (const m of foundMembers) {
           await delay(100);
           const bYear = m.birthDate ? new Date(m.birthDate).getFullYear() : (new Date().getFullYear() - 20);
           const cat = calculateCategoryFFKMDA(bYear, m.gender === 'Femme' ? 'F' : 'M');

           const alreadyIn = fightCards.find(fc => fc.compId === compId && fc.userId === m.id);
           if (!alreadyIn) {
               addLog(`Génération fiche : ${m.name}...`);
               const newCard = {
                   compId,
                   userId: m.id,
                   userName: m.name,
                   weight: m.weight || "N/C",
                   category: cat,
                   day: "À définir",
                   estimatedFights: 2,
                   medal: '',
                   matches: generateMatchesTimeline(2)
               };
               const ref = await addDoc(collection(db, 'fightCards'), newCard);
               setFightCards(prev => [...prev, {id: ref.id, ...newCard}]);
               newCardsAdded++;
           }
        }

        setScanStatus('FOUND');
        addLog("TERMINÉ. Arène synchronisée.");
      } else {
        setScanStatus('ERROR');
        addLog("Aucun combattant du club détecté sur ce tournoi.");
      }

    } catch (e) {
      setScanStatus('ERROR');
      addLog("Échec critique : Le Cortex n'a pas pu joindre la cible.");
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    if(!confirm("Supprimer définitivement ce combattant ?")) return;
    try { await deleteDoc(doc(db, 'fightCards', cardId)); setFightCards(fightCards.filter(c => c.id !== cardId)); } catch(e){}
  };

  const handleUpdateCardBase = async (cardId: string, fields: any) => {
    try {
      await updateDoc(doc(db, 'fightCards', cardId), fields);
      setFightCards(fightCards.map(c => c.id === cardId ? { ...c, ...fields } : c));
    } catch (e) {}
  };

  const handleUpdateMatch = async (card: any, matchId: string, fields: any) => {
    let currentMatches = card.matches || [];
    const updatedMatches = currentMatches.map((m: any) => m.id === matchId ? { ...m, ...fields } : m);
    try {
      await updateDoc(doc(db, 'fightCards', card.id), { matches: updatedMatches });
      setFightCards(fightCards.map(c => c.id === card.id ? { ...c, matches: updatedMatches } : c));
    } catch(e) {}
  };

  const addMatchToCard = async (card: any) => {
    const currentMatches = card.matches || [];
    const newMatch = { id: `m_${Date.now()}`, title: `Combat Sup. ${currentMatches.length + 1}`, area: '?', matchNum: 'TBD', headgear: '', result: 'En attente' };
    const updatedMatches = [...currentMatches, newMatch];
    try {
      await updateDoc(doc(db, 'fightCards', card.id), { matches: updatedMatches, estimatedFights: updatedMatches.length });
      setFightCards(fightCards.map(c => c.id === card.id ? { ...c, matches: updatedMatches, estimatedFights: updatedMatches.length } : c));
    } catch(e) {}
  };

  const handleArchivePalmares = async (compCards: any[]) => {
    if(!confirm("Archiver les médailles dans le Palmarès ?")) return;
    setIsArchiving(true);
    try {
      for(const c of compCards) {
        if(c.medal) {
          await addDoc(collection(db, 'palmares'), {
            userId: c.userId,
            userName: c.userName,
            competitionName: activeComp?.name,
            date: activeComp?.date,
            medal: c.medal
          });
        }
      }
      alert("Palmarès archivé !");
    } catch(e) { alert("Erreur d'archivage."); }
    setIsArchiving(false);
  };

  if (view === 'DETAIL' && activeComp) {
    const compCards = fightCards.filter(fc => fc.compId === activeComp.id);
    const allMatches = compCards.flatMap(c => (c.matches || []).map((m: any) => ({ ...m, fighterName: c.userName, fighterCat: c.category, cardId: c.id })));
    const groupedMatches = allMatches.reduce((acc, m) => {
      const key = m.matchNum || 'TBD';
      if (!acc[key]) acc[key] = [];
      acc[key].push(m);
      return acc;
    }, {} as Record<string, any[]>);

    const sortedGroups = Object.keys(groupedMatches).sort((a, b) => {
      if (a === 'TBD') return 1; if (b === 'TBD') return -1;
      return parseInt(a) - parseInt(b);
    }).map(k => ({ matchNum: k, matches: groupedMatches[k] }));

    return (
      <div style={{ height: '100vh', overflowY: 'auto', paddingBottom: '150px' }} className="w-full px-4 pt-4">
        <div className="max-w-lg mx-auto space-y-6">
          <button onClick={() => setView('LIST')} className="text-slate-500 text-xs font-bold uppercase hover:text-amber-500 transition-colors">&larr; Retour</button>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-xl relative">
             {isStaff && (
               <button onClick={() => isEditingComp ? setIsEditingComp(false) : setIsEditingComp(true)} className="absolute top-3 right-3 text-slate-500 hover:text-amber-500 p-2">
                 {isEditingComp ? <Save size={16} className="text-emerald-500"/> : <Edit3 size={16}/>}
               </button>
             )}
             <Trophy className="text-amber-500 mx-auto mb-2" size={32} />
             {!isEditingComp ? (
               <div className="text-center">
                 <h2 className="text-xl font-black text-white italic uppercase">{activeComp.name}</h2>
                 <p className="text-[10px] text-amber-500 font-mono font-bold mt-1 uppercase tracking-widest">{activeComp.compType} • {activeComp.compStyle}</p>
                 <p className="text-xs text-slate-400 font-mono mt-1">{new Date(activeComp.date).toLocaleDateString('fr-FR')} - {activeComp.location}</p>
               </div>
             ) : (
               <div className="space-y-2 mt-4">
                 <input type="text" value={activeComp.name} onChange={e=>setActiveComp({...activeComp, name: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-xs text-white outline-none" />
                 <div className="grid grid-cols-2 gap-2">
                   <input type="date" value={activeComp.date} onChange={e=>setActiveComp({...activeComp, date: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-xs text-white outline-none" />
                   <input type="text" value={activeComp.location} onChange={e=>setActiveComp({...activeComp, location: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-xs text-white outline-none" />
                 </div>
               </div>
             )}
             {isStaff && compCards.length > 0 && (
               <button onClick={() => handleArchivePalmares(compCards)} disabled={isArchiving} className="w-full mt-4 bg-amber-600/20 border border-amber-500/50 text-amber-500 py-2 rounded-lg text-xs font-black uppercase flex items-center justify-center hover:bg-amber-600/30 transition-colors">
                 {isArchiving ? <Activity size={16} className="animate-spin mr-2"/> : <Archive size={16} className="mr-2"/>} Clôturer & Archiver
               </button>
             )}
          </div>

          <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-800">
            <button onClick={() => setDetailTab('CARDS')} className={`flex-1 py-2 text-xs font-black uppercase rounded transition-all flex items-center justify-center ${detailTab === 'CARDS' ? 'bg-cyan-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}><Swords size={14} className="mr-2"/> BOXEURS ({compCards.length})</button>
            <button onClick={() => setDetailTab('TIMELINE')} className={`flex-1 py-2 text-xs font-black uppercase rounded transition-all flex items-center justify-center ${detailTab === 'TIMELINE' ? 'bg-rose-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}><Activity size={14} className="mr-2"/> LIVE ({allMatches.length})</button>
          </div>

          {detailTab === 'CARDS' && (
            <div className="space-y-4 animate-fade-in">
              {isStaff && (
                <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl shadow-lg mb-6">
                   <div className="flex justify-between items-center mb-3 border-b border-slate-800 pb-2">
                     <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-widest flex items-center"><UserPlus size={12} className="mr-2"/> Engager</h4>
                     <div className="flex space-x-1">
                       <button onClick={() => setRegMode('AUTO')} className={`text-[9px] font-bold uppercase px-2 py-1 rounded ${regMode==='AUTO'?'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50':'text-slate-500'}`}>Cortex</button>
                       <button onClick={() => setRegMode('INTERNAL')} className={`text-[9px] font-bold uppercase px-2 py-1 rounded ${regMode==='INTERNAL'?'bg-amber-500/20 text-amber-500 border border-amber-500/50':'text-slate-500'}`}>Club</button>
                       <button onClick={() => setRegMode('EXTERNAL')} className={`text-[9px] font-bold uppercase px-2 py-1 rounded ${regMode==='EXTERNAL'?'bg-rose-500/20 text-rose-400 border border-rose-500/50':'text-slate-500'}`}>Libre</button>
                     </div>
                   </div>

                   {regMode === 'AUTO' ? (
                     <div className="space-y-3">
                       <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 space-y-2">
                          <button onClick={fetchFFKMDACompetitions} disabled={isFetchingCatalog || scanStatus === 'SCANNING'} className="w-full bg-slate-800 hover:bg-slate-700 text-cyan-400 py-2 rounded flex items-center justify-center text-[10px] font-black uppercase tracking-widest transition-colors">
                            {isFetchingCatalog ? <Activity size={12} className="animate-spin mr-2" /> : <Globe size={12} className="mr-2" />} Parcourir le catalogue FFKMDA
                          </button>
                          {ffkmdaCatalog.length > 0 && (
                            <div className="max-h-40 overflow-y-auto space-y-1 mt-2 pr-1">
                              {ffkmdaCatalog.map((c, i) => (
                                <button key={i} onClick={() => selectCatalogItem(c)} className={`w-full text-left p-2 rounded border text-xs transition-colors ${ffkmdaId === c.id ? 'bg-cyan-900/30 border-cyan-500/50 text-cyan-400' : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-cyan-500/30'}`}>
                                  <span className="font-bold block truncate">{c.name}</span>
                                  <span className="text-[9px] text-slate-500 font-mono">{c.date} • {c.location}</span>
                                </button>
                              ))}
                            </div>
                          )}
                       </div>
                       <div className="flex space-x-2 pt-2 border-t border-slate-800">
                         <div className="flex-1 relative">
                           <Search size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" />
                           <input type="text" placeholder="ID (ex: 968)" value={ffkmdaId} onChange={e=>setFfkmdaId(e.target.value)} className="w-full bg-slate-950 border border-cyan-500/30 rounded-lg text-xs py-2 pl-8 pr-2 text-cyan-400 outline-none font-mono" />
                         </div>
                         <button onClick={executeFFKMDAScan} disabled={!ffkmdaId || scanStatus === 'SCANNING'} className="bg-cyan-600 hover:bg-cyan-500 text-slate-950 px-4 rounded-lg font-black text-xs uppercase disabled:opacity-50">
                           {scanStatus === 'SCANNING' ? <Activity size={14} className="animate-spin" /> : 'Scanner'}
                         </button>
                       </div>
                       {scanLogs.length > 0 && (
                         <div className="bg-slate-950 p-2 rounded border border-slate-800 max-h-32 overflow-y-auto text-[9px] font-mono space-y-1">
                           {scanLogs.map((log, i) => (
                             <div key={i} className={`${log.includes('Échec') ? 'text-rose-500' : log.includes('TERMINÉ') ? 'text-emerald-400' : 'text-slate-500'}`}>&gt; {log}</div>
                           ))}
                         </div>
                       )}
                     </div>
                   ) : regMode === 'INTERNAL' ? (
                     <div className="flex space-x-2">
                       <select value={selectedMemberId} onChange={e => setSelectedMemberId(e.target.value)} className="flex-1 bg-slate-950 border border-slate-700 rounded-lg text-xs p-2 text-white outline-none">
                         <option value="">Choisir un membre...</option>
                         {members.filter(m => !compCards.some(c => c.userId === m.id)).map(m => (<option key={m.id} value={m.id}>{m.name}</option>))}
                       </select>
                       <button onClick={handleRegisterManual} disabled={!selectedMemberId || isLoading} className="bg-amber-600 hover:bg-amber-500 text-slate-950 px-4 rounded-lg font-black text-xs uppercase">OK</button>
                     </div>
                   ) : (
                     <div className="space-y-2">
                       <input type="text" placeholder="Nom..." value={extName} onChange={e=>setExtName(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg text-xs p-2 text-white outline-none"/>
                       <div className="flex space-x-2">
                         <input type="number" placeholder="Année" value={extBirthYear} onChange={e=>setExtBirthYear(parseInt(e.target.value))} className="w-1/3 bg-slate-950 border border-slate-700 rounded-lg text-xs p-2 text-white outline-none"/>
                         <select value={extGender} onChange={e=>setExtGender(e.target.value as any)} className="w-1/4 bg-slate-950 border border-slate-700 rounded-lg text-xs p-2 text-white outline-none"><option value="M">M</option><option value="F">F</option></select>
                         <input type="number" placeholder="kg" value={extWeight} onChange={e=>setExtWeight(e.target.value)} className="w-1/4 bg-slate-950 border border-slate-700 rounded-lg text-xs p-2 text-white outline-none"/>
                         <button onClick={handleRegisterManual} disabled={!extName || isLoading} className="bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-black text-xs uppercase px-3 py-2">OK</button>
                       </div>
                     </div>
                   )}
                </div>
              )}

              <div className="space-y-3">
                {compCards.map(card => {
                  const canEdit = isStaff || card.userId === currentUser.id;
                  const matches = card.matches || [];
                  const isExpanded = expandedCard === card.id;

                  return (
                    <div key={card.id} className={`bg-slate-900 border ${isExpanded ? 'border-cyan-500/50 shadow-lg' : 'border-slate-800'} rounded-xl overflow-hidden transition-all duration-300`}>
                      <div className="bg-slate-800/50 p-3 flex justify-between items-center cursor-pointer" onClick={() => setExpandedCard(isExpanded ? null : card.id)}>
                        <div>
                          <div className="flex items-center">
                            <h4 className="font-black text-lg text-white uppercase">{card.userName}</h4>
                            {card.medal && <Medal size={14} className={`ml-2 ${card.medal === 'Or' ? 'text-yellow-400' : card.medal === 'Argent' ? 'text-slate-300' : 'text-amber-700'}`}/>}
                          </div>
                          <p className="text-[10px] text-amber-500 font-mono font-bold uppercase">{card.category} • {card.weight}kg</p>
                        </div>
                        <ChevronRight size={20} className={`text-slate-500 transition-transform ${isExpanded ? 'rotate-90 text-cyan-400' : ''}`} />
                      </div>
                      {isExpanded && (
                        <div className="p-3 space-y-3 bg-slate-950/50">
                          {canEdit && (
                            <div className="bg-slate-950 border border-slate-700 p-3 rounded-lg mb-4">
                               <select value={card.medal || ''} onChange={e => handleUpdateCardBase(card.id, { medal: e.target.value })} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-xs font-bold text-white outline-none">
                                 <option value="">Aucune médaille</option>
                                 <option value="Or">🥇 Or</option>
                                 <option value="Argent">🥈 Argent</option>
                                 <option value="Bronze">🥉 Bronze</option>
                               </select>
                            </div>
                          )}
                          {matches.map((m: any) => (
                            <div key={m.id} className="p-3 rounded-lg border bg-slate-950 border-slate-700">
                              <span className="text-xs font-black text-cyan-500 uppercase block mb-2">{m.title}</span>
                              {canEdit ? (
                                <div className="space-y-2">
                                  <div className="grid grid-cols-2 gap-2">
                                    <input type="number" value={m.area} onChange={e => handleUpdateMatch(card.id, m.id, {area: e.target.value})} className="bg-slate-900 border border-slate-600 rounded p-1.5 text-xs text-white" placeholder="Aire ?" />
                                    <input type="number" value={m.matchNum} onChange={e => handleUpdateMatch(card.id, m.id, {matchNum: e.target.value})} className="bg-slate-900 border border-slate-600 rounded p-1.5 text-xs text-white" placeholder="N° Combat" />
                                  </div>
                                  <div className="flex rounded border border-slate-700 overflow-hidden">
                                    <button onClick={() => handleUpdateMatch(card.id, m.id, {headgear: 'Rouge'})} className={`flex-1 text-[9px] font-black py-1.5 ${m.headgear === 'Rouge' ? 'bg-rose-600 text-white' : 'bg-slate-900 text-slate-500'}`}>ROUGE</button>
                                    <button onClick={() => handleUpdateMatch(card.id, m.id, {headgear: 'Bleu'})} className={`flex-1 text-[9px] font-black py-1.5 ${m.headgear === 'Bleu' ? 'bg-cyan-600 text-white' : 'bg-slate-900 text-slate-500'}`}>BLEU</button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex justify-around bg-slate-900 p-2 rounded text-[10px] text-white">
                                  <span>A: {m.area || '?'}</span>
                                  <span>N°: {m.matchNum || '?'}</span>
                                  <span className={m.headgear==='Rouge'?'text-rose-500':m.headgear==='Bleu'?'text-cyan-500':'text-slate-500'}>{m.headgear || '?'}</span>
                                </div>
                              )}
                            </div>
                          ))}
                          {canEdit && (
                             <button onClick={() => addMatchToCard(card)} className="w-full py-2 bg-slate-900 border border-slate-700 border-dashed rounded text-[9px] text-slate-400 uppercase font-bold hover:text-cyan-400 hover:border-cyan-500 transition-colors">
                               + Ajouter Combat
                             </button>
                          )}
                          {isStaff && <button onClick={() => handleDeleteCard(card.id)} className="w-full py-2 text-rose-500 text-[9px] font-black uppercase">Supprimer Fiche</button>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {detailTab === 'TIMELINE' && (
            <div className="space-y-6 py-4">
              {sortedGroups.length === 0 ? <p className="text-center text-slate-500 text-xs font-mono py-8">Aucun combat actif.</p> : sortedGroups.map(group => (
                <div key={group.matchNum} className="relative">
                  <div className="flex items-center mb-4">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${group.matches.length > 1 ? 'bg-rose-600 border-rose-400 animate-pulse' : 'bg-slate-800 border-slate-700'} text-white shadow-lg z-10`}>
                      <span className="text-xs font-black">{group.matchNum}</span>
                    </div>
                    {group.matches.length > 1 && (
                      <div className="ml-3 bg-rose-500/20 border border-rose-500/50 text-rose-500 text-[9px] font-black uppercase px-2 py-1 rounded-lg">
                        Alerte Simultanée !
                      </div>
                    )}
                  </div>
                  <div className="ml-5 pl-5 border-l border-slate-800 space-y-3">
                    {group.matches.map(m => (
                      <div key={`${m.cardId}-${m.id}`} className="p-3 rounded-xl border border-slate-800 bg-slate-900/80 shadow-md">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[9px] font-black uppercase text-amber-500">Aire {m.area || '?'}</span>
                          <span className="text-[9px] text-slate-500 font-mono">{m.title}</span>
                        </div>
                        <h4 className="font-bold text-white text-sm uppercase">{m.fighterName}</h4>
                        <p className="text-[9px] text-cyan-500">{m.fighterCat}</p>
                        <div className="mt-3 flex justify-between items-center pt-2 border-t border-slate-800/50">
                          <span className={`text-[9px] font-black uppercase px-2 py-1 rounded ${m.headgear === 'Rouge' ? 'bg-rose-500/20 text-rose-500' : m.headgear === 'Bleu' ? 'bg-cyan-500/20 text-cyan-500' : 'bg-slate-800 text-slate-500'}`}>{m.headgear || 'Casque ?'}</span>
                          {isStaff ? (
                            <div className="flex space-x-1">
                              <button onClick={() => handleUpdateMatch(m.cardId, m.id, {result: 'Victoire'})} className={`p-1.5 rounded ${m.result === 'Victoire' ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-slate-500'}`}><CheckCircle size={14}/></button>
                              <button onClick={() => handleUpdateMatch(m.cardId, m.id, {result: 'Défaite'})} className={`p-1.5 rounded ${m.result === 'Défaite' ? 'bg-rose-600 text-white' : 'bg-slate-900 text-slate-500'}`}><XCircle size={14}/></button>
                            </div>
                          ) : (
                            m.result !== 'En attente' && <span className={`text-[9px] font-black uppercase ${m.result === 'Victoire' ? 'text-emerald-500' : 'text-rose-500'}`}>{m.result}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', overflowY: 'auto', paddingBottom: '150px' }} className="w-full px-4 pt-4">
      <div className="max-w-lg mx-auto flex flex-col h-full">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">Arène</h2>
            <span className="text-[10px] text-amber-500 font-mono uppercase tracking-widest leading-none">Circuit Compétition</span>
          </div>
          {isStaff && (
             <button onClick={() => { setView('DETAIL'); setRegMode('AUTO'); }} className="bg-cyan-500/20 text-cyan-400 p-2 rounded-xl border border-cyan-500/50 hover:bg-cyan-500/30 transition-all shadow-md">
               <Download size={20} />
             </button>
          )}
        </div>
        <div className="flex-1 space-y-3 pb-10">
          {isLoading && <p className="text-center text-amber-500 text-[10px] font-mono animate-pulse">RECHERCHE D'ÉVÉNEMENTS...</p>}
          {competitions.map(comp => {
            const isUpcoming = new Date(comp.date) >= new Date();
            return (
              <button key={comp.id} onClick={() => { setActiveComp(comp); setView('DETAIL'); }} className="w-full text-left">
                <FuturisticCard borderColor={isUpcoming ? 'amber' : 'slate'} className={`hover:border-amber-500/50 transition-colors ${!isUpcoming && 'opacity-70'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded border ${isUpcoming ? 'bg-amber-950 border-amber-900' : 'bg-slate-900 border-slate-800'}`}><Trophy size={16} className={isUpcoming ? "text-amber-500" : "text-slate-500"} /></div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-100">{comp.name}</h4>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">{new Date(comp.date).toLocaleDateString('fr-FR')} • {comp.location}</p>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-slate-600" />
                  </div>
                </FuturisticCard>
              </button>
            )
          })}
          {isStaff && competitions.length === 0 && !isLoading && (
            <div className="text-center p-8 bg-slate-900/50 rounded-2xl border border-slate-800 border-dashed">
              <Radar size={32} className="mx-auto text-slate-600 mb-3" />
              <button onClick={() => { setView('DETAIL'); setRegMode('AUTO'); }} className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">+ Nouveau Tournoi</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}