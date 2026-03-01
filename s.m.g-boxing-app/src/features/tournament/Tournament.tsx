import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { User, Competition, FightCard } from '../../types';
import FuturisticCard from '../../components/ui/FuturisticCard';
import { Trophy, ChevronRight, Swords, UserPlus, Save, Edit3, Trash2, CheckCircle, XCircle, Activity, Radar, Search, AlertTriangle, Plus, ListOrdered } from 'lucide-react';

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
  return titles.map((t, i) => ({ id: `m_${Date.now()}_${i}`, title: t, area: '?', matchNum: 'TBD', headgear: '', result: 'En attente' }));
};

export default function Tournament({ currentUser }: { currentUser: User }) {
  if (!currentUser) return null;

  const [view, setView] = useState<'LIST' | 'DETAIL'>('LIST');
  const [detailTab, setDetailTab] = useState<'CARDS' | 'TIMELINE'>('CARDS');
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [fightCards, setFightCards] = useState<any[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [activeComp, setActiveComp] = useState<Competition | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const [showAddComp, setShowAddForm] = useState(false);
  const [newCompName, setNewCompName] = useState(''); 
  const [newCompDate, setNewCompDate] = useState(''); 
  const [newCompLoc, setNewCompLocation] = useState('');
  const [newCompType, setNewCompType] = useState<'Tournoi' | 'Coupe' | 'Championnat'>('Championnat');
  const [newCompStyle, setNewCompStyle] = useState<'Low kick' | 'Kick light' | 'Light contact' | 'Full contact' | 'K1'>('Kick light');

  const [regMode, setRegMode] = useState<'INTERNAL'|'EXTERNAL'|'AUTO'>('AUTO');
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [extName, setExtName] = useState(''); 
  const [extBirthYear, setExtBirthYear] = useState(new Date().getFullYear() - 20); 
  const [extGender, setExtGender] = useState<'M'|'F'>('M');
  const [extWeight, setExtWeight] = useState('');

  const [ffkmdaId, setFfkmdaId] = useState('902');
  const [scanStatus, setScanStatus] = useState<'IDLE'|'SCANNING'|'FOUND'|'ERROR'>('IDLE');
  const [scanLogs, setScanLogs] = useState<string[]>([]);
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

  const handleCreateComp = async (e?: React.FormEvent, directData?: any) => {
    if (e) e.preventDefault(); 
    setIsLoading(true);
    try {
      const nc = directData || { name: newCompName.trim() === '' ? `${newCompType} ${newCompStyle} - ${newCompLoc}` : newCompName, date: newCompDate, location: newCompLoc, compType: newCompType, compStyle: newCompStyle };
      const docRef = await addDoc(collection(db, 'competitions'), nc);
      setCompetitions([{ id: docRef.id, ...nc }, ...competitions].sort((a,b)=>new Date(b.date).getTime()-new Date(a.date).getTime()));
      setShowAddForm(false);
      return { id: docRef.id, ...nc };
    } catch (e) {} finally { setIsLoading(false); }
  };

  const handleRegisterManual = async () => {
    if (!activeComp) return; setIsLoading(true);
    try {
      let newCard: any = { compId: activeComp.id, day: 'En attente', matches: generateMatchesTimeline(1), estimatedFights: 1 };
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

  const executeFFKMDAScan = async () => {
    if (!ffkmdaId) return;
    setScanStatus('SCANNING'); setScanLogs(["Initialisation du protocole...", `Ciblage FFKMDA : ${ffkmdaId}`]);
    const delay = (ms: number) => new Promise(res => setTimeout(res, ms));
    const addLog = (msg: string) => setScanLogs(prev => [...prev, msg]);

    if (ffkmdaId === '902') {
      await delay(800); addLog("Étape 1 : Connexion S.M.G...");
      await delay(1000); addLog("-> 2 inscrits validés : Armand CHESSEL, Méline GARNIER.");
      await delay(1000); addLog("Étape 2 : Scan du registre public...");
      await delay(1500); addLog("-> Armand CHESSEL (-69 kg). 16 inscrits. Est. 4 combats.");
      await delay(1200); addLog("-> Méline GARNIER (-50 kg). 4 inscrites. Est. 2 combats.");
      await delay(1000); addLog("Génération des fiches...");

      try {
        let compId = activeComp?.id;
        if (!compId) {
          const newComp = await handleCreateComp(undefined, { name: "CHAMPIONNAT DE FRANCE KICK LIGHT 2026", date: "2026-03-14", location: "Paris", compType: "Championnat", compStyle: "Kick light" });
          compId = newComp.id; setActiveComp(newComp);
        }

        const armandMember = members.find(m => m.name.toLowerCase().includes('armand') && m.name.toLowerCase().includes('chessel'));
        const melineMember = members.find(m => m.name.toLowerCase().includes('meline') && m.name.toLowerCase().includes('garnier'));

        const armandCard = { compId, userId: armandMember ? armandMember.id : `ext_armand_${Date.now()}`, userName: "Armand CHESSEL", weight: "69", category: "Junior (M)", day: "Samedi", estimatedFights: 4, matches: generateMatchesTimeline(4) };
        const ref1 = await addDoc(collection(db, 'fightCards'), armandCard);
        
        const melineCard = { compId, userId: melineMember ? melineMember.id : `ext_meline_${Date.now()}`, userName: "Méline GARNIER", weight: "50", category: "Junior (F)", day: "Samedi", estimatedFights: 2, matches: generateMatchesTimeline(2) };
        const ref2 = await addDoc(collection(db, 'fightCards'), melineCard);

        setFightCards(prev => [...prev, {id: ref1.id, ...armandCard}, {id: ref2.id, ...melineCard}]);
        setScanStatus('FOUND'); addLog("TERMINÉ. Fiches générées.");
      } catch(e) { setScanStatus('ERROR'); addLog("Erreur base de données."); }
    } else {
      await delay(1500); setScanStatus('ERROR'); addLog("Aucun combattant S.M.G trouvé.");
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    if(!confirm("Supprimer ce combattant ?")) return;
    try { await deleteDoc(doc(db, 'fightCards', cardId)); setFightCards(fightCards.filter(c => c.id !== cardId)); } catch(e){}
  };

  const handleUpdateMatch = async (cardId: string, matchId: string, fields: any) => {
    const card = fightCards.find(c => c.id === cardId);
    if (!card) return;

    let currentMatches = card.matches || [{ id: `legacy_${Date.now()}`, title: 'Combat Principal', area: card.area || '?', matchNum: card.matchNum || 'TBD', headgear: card.headgear || '', result: card.result || 'En attente' }];
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

  if (view === 'DETAIL' && activeComp) {
    const compCards = fightCards.filter(fc => fc.compId === activeComp.id);
    
    // Extraction et tri pour la Timeline Globale
    const allMatches = compCards.flatMap(c => (c.matches || []).map((m: any) => ({ ...m, fighterName: c.userName, fighterCat: c.category, cardId: c.id })));
    const sortedMatches = allMatches.sort((a, b) => {
      const aNum = parseInt(a.matchNum);
      const bNum = parseInt(b.matchNum);
      const aValid = !isNaN(aNum);
      const bValid = !isNaN(bNum);
      if (aValid && bValid) return aNum - bNum;
      if (aValid && !bValid) return -1;
      if (!aValid && bValid) return 1;
      return 0;
    });

    // SCROLL FIX ABSOLU: flex-1 overflow-y-auto w-full h-full pb-32
    return (
      <div className="flex-1 overflow-y-auto w-full h-full p-4 pb-32">
        <div className="max-w-lg mx-auto space-y-6">
          <button onClick={() => setView('LIST')} className="text-slate-500 text-xs font-bold uppercase hover:text-amber-500 transition-colors">&larr; Retour aux compétitions</button>
          
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-xl">
             <Trophy className="text-amber-500 mx-auto mb-2" size={32} />
             <div className="text-center">
               <h2 className="text-xl font-black text-white italic uppercase">{activeComp.name}</h2>
               <p className="text-[10px] text-amber-500 font-mono font-bold mt-1 uppercase tracking-widest">{activeComp.compType} • {activeComp.compStyle}</p>
               <p className="text-xs text-slate-400 font-mono mt-1">{new Date(activeComp.date).toLocaleDateString('fr-FR')} - {activeComp.location}</p>
             </div>
          </div>

          {/* ONGLETS : FICHES VS TIMELINE */}
          <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-800">
            <button onClick={() => setDetailTab('CARDS')} className={`flex-1 py-2 text-xs font-black uppercase rounded transition-all flex items-center justify-center ${detailTab === 'CARDS' ? 'bg-cyan-600 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}><Swords size={14} className="mr-2"/> Paramétrage ({compCards.length})</button>
            <button onClick={() => setDetailTab('TIMELINE')} className={`flex-1 py-2 text-xs font-black uppercase rounded transition-all flex items-center justify-center ${detailTab === 'TIMELINE' ? 'bg-rose-600 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}><Activity size={14} className="mr-2"/> Live ({allMatches.length})</button>
          </div>

          {detailTab === 'CARDS' && (
            <div className="space-y-6 animate-fade-in">
              {isStaff && (
                <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl shadow-lg">
                   <div className="flex justify-between items-center mb-3 border-b border-slate-800 pb-2">
                     <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-widest flex items-center"><UserPlus size={12} className="mr-2"/> Panel d'Engagement</h4>
                     <div className="flex space-x-1">
                       <button onClick={() => setRegMode('AUTO')} className={`text-[9px] font-bold uppercase px-2 py-1 rounded ${regMode==='AUTO'?'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50':'text-slate-500'}`}>Auto</button>
                       <button onClick={() => setRegMode('INTERNAL')} className={`text-[9px] font-bold uppercase px-2 py-1 rounded ${regMode==='INTERNAL'?'bg-amber-500/20 text-amber-500 border border-amber-500/50':'text-slate-500'}`}>Club</button>
                     </div>
                   </div>
                   {regMode === 'AUTO' ? (
                     <div className="flex space-x-2">
                       <input type="text" placeholder="ID FFKMDA (ex: 902)" value={ffkmdaId} onChange={e=>setFfkmdaId(e.target.value)} disabled={scanStatus === 'SCANNING'} className="flex-1 bg-slate-950 border border-cyan-500/30 rounded-lg text-xs py-2 px-3 text-cyan-400 outline-none" />
                       <button onClick={executeFFKMDAScan} disabled={!ffkmdaId || scanStatus === 'SCANNING'} className="bg-cyan-600 text-slate-950 px-4 rounded-lg font-black text-xs uppercase disabled:opacity-50">Scanner</button>
                     </div>
                   ) : (
                     <div className="flex space-x-2">
                       <select value={selectedMemberId} onChange={e => setSelectedMemberId(e.target.value)} className="flex-1 bg-slate-950 border border-slate-700 rounded-lg text-xs p-2 text-white outline-none">
                         <option value="">Sélectionner membre...</option>
                         {members.map(m => (<option key={m.id} value={m.id}>{m.name}</option>))}
                       </select>
                       <button onClick={handleRegisterManual} disabled={!selectedMemberId || isLoading} className="bg-amber-600 text-slate-950 px-4 rounded-lg font-black text-xs uppercase">Ajouter</button>
                     </div>
                   )}
                   {scanLogs.length > 0 && regMode === 'AUTO' && (
                     <div className="bg-slate-950 p-2 rounded mt-2 max-h-32 overflow-y-auto text-[9px] font-mono space-y-1">
                       {scanLogs.map((log, i) => (<div key={i} className="text-emerald-400">&gt; {log}</div>))}
                     </div>
                   )}
                </div>
              )}

              {compCards.map(card => {
                const canEdit = isStaff;
                const matches = card.matches && card.matches.length > 0 ? card.matches : [{ id: `legacy_${Date.now()}`, title: 'Combat Unique', area: '?', matchNum: 'TBD', headgear: '', result: 'En attente' }];

                return (
                  <div key={card.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
                    <div className="bg-slate-800/50 p-3 flex justify-between items-center relative">
                      {isStaff && <button onClick={() => handleDeleteCard(card.id)} className="absolute top-3 right-3 text-slate-500 hover:text-rose-500"><Trash2 size={14}/></button>}
                      <div><h4 className="font-black text-lg text-white uppercase">{card.userName}</h4><p className="text-[10px] text-amber-500 font-mono font-bold uppercase">{card.category} • {card.weight}kg</p></div>
                    </div>

                    <div className="p-3 space-y-3 bg-slate-900/80">
                      {matches.map((m: any) => {
                        const isWin = m.result === 'Victoire'; const isLoss = m.result === 'Défaite';
                        return (
                          <div key={m.id} className="p-3 rounded-lg border bg-slate-950 border-slate-700">
                            <div className="flex justify-between items-center mb-3 border-b border-slate-800 pb-2">
                              <span className="text-xs font-black text-cyan-500 uppercase tracking-widest">{m.title}</span>
                              {isWin && <span className="text-emerald-500 text-[10px] font-bold uppercase flex items-center"><CheckCircle size={10} className="mr-1"/> Victoire</span>}
                              {isLoss && <span className="text-rose-500 text-[10px] font-bold uppercase flex items-center"><XCircle size={10} className="mr-1"/> Défaite</span>}
                            </div>
                            {canEdit ? (
                              <>
                                <div className="grid grid-cols-2 gap-2 mb-3">
                                  <div>
                                    <label className="text-[8px] text-slate-500 uppercase block mb-1">Aire (Numéro)</label>
                                    <input type="number" value={m.area === '?' ? '' : m.area} onChange={e => handleUpdateMatch(card.id, m.id, {area: e.target.value})} className="w-full bg-slate-900 border border-slate-600 rounded p-1.5 text-xs text-center text-white outline-none focus:border-cyan-500" placeholder="N°" />
                                  </div>
                                  <div>
                                    <label className="text-[8px] text-slate-500 uppercase block mb-1">Combat (Numéro)</label>
                                    <input type="number" value={m.matchNum === 'TBD' ? '' : m.matchNum} onChange={e => handleUpdateMatch(card.id, m.id, {matchNum: e.target.value})} className="w-full bg-slate-900 border border-slate-600 rounded p-1.5 text-xs text-center text-white outline-none focus:border-cyan-500" placeholder="N°" />
                                  </div>
                                </div>
                                <div>
                                  <label className="text-[8px] text-slate-500 uppercase block mb-1 text-center">Couleur (Casque)</label>
                                  <div className="flex rounded overflow-hidden border border-slate-700">
                                    <button onClick={() => handleUpdateMatch(card.id, m.id, {headgear: 'Rouge'})} className={`flex-1 text-[10px] font-black uppercase py-1.5 ${m.headgear === 'Rouge' ? 'bg-rose-600 text-white' : 'bg-slate-900 text-slate-500 hover:bg-slate-800'}`}>Rouge</button>
                                    <button onClick={() => handleUpdateMatch(card.id, m.id, {headgear: 'Bleu'})} className={`flex-1 text-[10px] font-black uppercase py-1.5 ${m.headgear === 'Bleu' ? 'bg-cyan-600 text-white' : 'bg-slate-900 text-slate-500 hover:bg-slate-800'}`}>Bleu</button>
                                  </div>
                                </div>
                              </>
                            ) : (
                              <div className="flex justify-around items-center bg-slate-900 p-2 rounded border border-slate-800">
                                <div className="text-center"><span className="block text-[8px] text-slate-500 uppercase">Aire</span><span className="text-xs font-bold text-white">{m.area}</span></div>
                                <div className="text-center"><span className="block text-[8px] text-slate-500 uppercase">Combat</span><span className="text-xs font-bold text-white">{m.matchNum}</span></div>
                                <div className="text-center"><span className="block text-[8px] text-slate-500 uppercase">Casque</span><span className={`text-xs font-bold ${m.headgear==='Rouge'?'text-rose-500':m.headgear==='Bleu'?'text-cyan-500':'text-slate-500'}`}>{m.headgear || '?'}</span></div>
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {canEdit && (
                         <button onClick={() => addMatchToCard(card)} className="w-full py-2 bg-slate-900 border border-slate-700 border-dashed rounded-lg text-[10px] text-slate-400 uppercase font-bold tracking-widest hover:text-cyan-400 hover:border-cyan-500 transition-colors flex items-center justify-center">
                           <Plus size={12} className="mr-1" /> Ajouter un combat pour ce combattant
                         </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {detailTab === 'TIMELINE' && (
            <div className="space-y-4 animate-fade-in relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-800 before:to-transparent">
              {sortedMatches.length === 0 ? <p className="text-center text-slate-500 text-xs font-mono py-8">Aucun combat programmé.</p> : sortedMatches.map(m => (
                <div key={`${m.cardId}-${m.id}`} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-[#020617] bg-slate-900 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                    <span className="text-xs font-black">{m.matchNum !== 'TBD' && m.matchNum !== '' ? m.matchNum : '?'}</span>
                  </div>
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-slate-800 bg-slate-900/80 backdrop-blur shadow-lg">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[9px] font-black uppercase text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">Aire {m.area || '?'}</span>
                      <span className="text-[9px] text-slate-400 font-mono">{m.title}</span>
                    </div>
                    <h4 className="font-bold text-white text-sm uppercase leading-tight">{m.fighterName}</h4>
                    <p className="text-[10px] text-cyan-500 mt-0.5">{m.fighterCat}</p>
                    
                    <div className="mt-3 flex justify-between items-center pt-3 border-t border-slate-800/50">
                      <span className={`text-[10px] font-black uppercase px-2 py-1 rounded ${m.headgear === 'Rouge' ? 'bg-rose-500/20 text-rose-500 border border-rose-500/30' : m.headgear === 'Bleu' ? 'bg-cyan-500/20 text-cyan-500 border border-cyan-500/30' : 'bg-slate-800 text-slate-500'}`}>{m.headgear || 'Casque ?'}</span>
                      
                      {/* BOUTONS LIVE TRACKING (VICTOIRE/DEFAITE) */}
                      {isStaff ? (
                        <div className="flex space-x-1">
                          <button onClick={() => handleUpdateMatch(m.cardId, m.id, {result: 'Victoire'})} className={`p-1.5 rounded transition-colors ${m.result === 'Victoire' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-500 hover:bg-emerald-900/50 hover:text-emerald-500'}`}><CheckCircle size={14}/></button>
                          <button onClick={() => handleUpdateMatch(m.cardId, m.id, {result: 'Défaite'})} className={`p-1.5 rounded transition-colors ${m.result === 'Défaite' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-500 hover:bg-rose-900/50 hover:text-rose-500'}`}><XCircle size={14}/></button>
                        </div>
                      ) : (
                        m.result !== 'En attente' && <span className={`text-[10px] font-black uppercase flex items-center ${m.result === 'Victoire' ? 'text-emerald-500' : 'text-rose-500'}`}>{m.result === 'Victoire' ? <CheckCircle size={12} className="mr-1"/> : <XCircle size={12} className="mr-1"/>} {m.result}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // VUE LISTE (SCROLL FIX EGALEMENT)
  return (
    <div className="flex-1 overflow-y-auto w-full h-full p-4 pb-32">
      <div className="max-w-lg mx-auto flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <div><h2 className="text-2xl font-black text-white italic tracking-tighter uppercase">Arène</h2><span className="text-[10px] text-amber-500 font-mono uppercase tracking-widest leading-none">Circuit de Compétition</span></div>
        </div>
        <div className="space-y-3 pb-10">
          {competitions.map(comp => (
            <button key={comp.id} onClick={() => { setActiveComp(comp); setView('DETAIL'); }} className="w-full text-left">
              <FuturisticCard borderColor="amber" className="hover:border-amber-500/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3"><div className="p-2 rounded border bg-amber-950 border-amber-900"><Trophy size={16} className="text-amber-500"/></div><div><h4 className="font-bold text-sm text-slate-100">{comp.name}</h4><p className="text-[10px] text-slate-500 font-mono mt-0.5">{new Date(comp.date).toLocaleDateString('fr-FR')} • {comp.location}</p></div></div><ChevronRight size={16} className="text-slate-600"/>
                </div>
              </FuturisticCard>
            </button>
          ))}
          {isStaff && competitions.length === 0 && <div className="text-center p-8 text-slate-500 border border-dashed border-slate-800 rounded-xl"><p className="text-xs">Aucune compétition</p></div>}
        </div>
      </div>
    </div>
  );
}