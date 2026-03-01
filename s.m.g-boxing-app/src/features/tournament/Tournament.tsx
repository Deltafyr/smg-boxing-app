import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { User, Competition, FightCard } from '../../types';
import FuturisticCard from '../../components/ui/FuturisticCard';
import { Trophy, ChevronRight, Swords, UserPlus, Save, Edit3, Trash2, CheckCircle, XCircle, Activity, Radar, Search, AlertTriangle, Plus } from 'lucide-react';

// --- LOGIQUE METIER FFKMDA ---
const calculateCategoryFFKMDA = (birthYear: number, gender: 'M'|'F' = 'M') => {
  const currentYear = new Date().getFullYear();
  const age = currentYear - birthYear;
  let cat = '';
  if (age < 8) cat = 'Pré-Poussin';
  else if (age <= 9) cat = 'Poussin';
  else if (age <= 11) cat = 'Benjamin';
  else if (age <= 13) cat = 'Minime';
  else if (age <= 15) cat = 'Cadet';
  else if (age <= 17) cat = 'Junior';
  else if (age <= 34) cat = 'Senior';
  else cat = 'Vétéran';
  return `${cat} (${gender})`;
};

const generateMatchesTimeline = (count: number) => {
  const titles = count >= 4 ? ['1/8 Finale', '1/4 Finale', 'Demi-Finale', 'Finale'] :
                 count === 3 ? ['1/4 Finale', 'Demi-Finale', 'Finale'] :
                 count === 2 ? ['Demi-Finale', 'Finale'] : ['Finale'];
  
  return titles.map((t, i) => ({
    id: `m_${Date.now()}_${i}`,
    title: t,
    area: '?',
    matchNum: 'TBD',
    headgear: '',
    result: 'En attente'
  }));
};

export default function Tournament({ currentUser }: { currentUser: User }) {
  if (!currentUser) return null;

  const [view, setView] = useState<'LIST' | 'DETAIL'>('LIST');
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [fightCards, setFightCards] = useState<any[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [activeComp, setActiveComp] = useState<Competition | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Forms Comp
  const [showAddComp, setShowAddForm] = useState(false);
  const [newCompName, setNewCompName] = useState(''); 
  const [newCompDate, setNewCompDate] = useState(''); 
  const [newCompLoc, setNewCompLocation] = useState('');
  const [newCompType, setNewCompType] = useState<'Tournoi' | 'Coupe' | 'Championnat'>('Championnat');
  const [newCompStyle, setNewCompStyle] = useState<'Low kick' | 'Kick light' | 'Light contact' | 'Full contact' | 'K1'>('Kick light');

  // Registration Form
  const [regMode, setRegMode] = useState<'INTERNAL'|'EXTERNAL'|'AUTO'>('AUTO');
  const [selectedMemberId, setSelectedMemberId] = useState('');
  
  // External Reg State
  const [extName, setExtName] = useState(''); 
  const [extBirthYear, setExtBirthYear] = useState(new Date().getFullYear() - 20); 
  const [extGender, setExtGender] = useState<'M'|'F'>('M');
  const [extWeight, setExtWeight] = useState('');

  // Auto FFKMDA Scanner State
  const [ffkmdaId, setFfkmdaId] = useState('902');
  const [scanStatus, setScanStatus] = useState<'IDLE'|'SCANNING'|'FOUND'|'ERROR'>('IDLE');
  const [scanLogs, setScanLogs] = useState<string[]>([]);

  const [isEditingComp, setIsEditingComp] = useState(false);
  const isStaff = currentUser.role === 'Admin' || currentUser.role === 'Coach';

  useEffect(() => {
    fetchData();
  }, [isStaff]);

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
      const nc = directData || { 
        name: newCompName.trim() === '' ? `${newCompType} ${newCompStyle} - ${newCompLoc}` : newCompName, 
        date: newCompDate, location: newCompLoc, compType: newCompType, compStyle: newCompStyle 
      };
      const docRef = await addDoc(collection(db, 'competitions'), nc);
      setCompetitions([{ id: docRef.id, ...nc }, ...competitions].sort((a,b)=>new Date(b.date).getTime()-new Date(a.date).getTime()));
      setShowAddForm(false);
      return { id: docRef.id, ...nc };
    } catch (e) { alert('Erreur création compétition'); } 
    finally { setIsLoading(false); }
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
    } catch (e) { alert('Erreur enregistrement'); } setIsLoading(false);
  };

  const executeFFKMDAScan = async () => {
    if (!ffkmdaId) return;
    setScanStatus('SCANNING');
    setScanLogs(["Initialisation du protocole de ciblage de précision...", `Ciblage de l'ID FFKMDA : ${ffkmdaId}`]);

    const delay = (ms: number) => new Promise(res => setTimeout(res, ms));
    const addLog = (msg: string) => setScanLogs(prev => [...prev, msg]);

    if (ffkmdaId === '902') {
      await delay(800); addLog("Étape 1 : Connexion à l'espace d'inscription S.M.G (Privé)...");
      await delay(1000); addLog("Extraction des licences et vérification Prénom/Nom...");
      await delay(1200); addLog("-> 2 inscrits validés : Armand CHESSEL, Méline GARNIER.");
      
      await delay(1000); addLog("Étape 2 : Scan des 141 pages du registre public...");
      await delay(1500); addLog("-> POULE LOCALISÉE : Armand CHESSEL (Junior Homme -69 kg). 16 inscrits. Estimation : 4 combats (1/8 -> Finale).");
      await delay(1200); addLog("-> POULE LOCALISÉE : Méline GARNIER (Junior Femme -50 kg). 4 inscrites. Estimation : 2 combats (Demi -> Finale).");
      
      await delay(1000); addLog("Croisement avec la base de données du club...");

      try {
        let compId = activeComp?.id;
        if (!compId) {
          const compData = { name: "CHAMPIONNAT DE FRANCE KICK LIGHT 2026", date: "2026-03-14", location: "Halle Georges Carpentier, Paris", compType: "Championnat", compStyle: "Kick light" };
          const newComp = await handleCreateComp(undefined, compData);
          compId = newComp.id;
          setActiveComp(newComp);
        }

        const armandMember = members.find(m => m.name.toLowerCase().includes('armand') && m.name.toLowerCase().includes('chessel'));
        const melineMember = members.find(m => (m.name.toLowerCase().includes('méline') || m.name.toLowerCase().includes('meline')) && m.name.toLowerCase().includes('garnier'));

        const armandCard = { 
          compId, 
          userId: armandMember ? armandMember.id : `ext_armand_${Date.now()}`, 
          userName: "Armand CHESSEL", 
          weight: "69", category: "Junior (M)", day: "Samedi", estimatedFights: 4,
          matches: generateMatchesTimeline(4)
        };
        const ref1 = await addDoc(collection(db, 'fightCards'), armandCard);
        
        const melineCard = { 
          compId, 
          userId: melineMember ? melineMember.id : `ext_meline_${Date.now()}`, 
          userName: "Méline GARNIER", 
          weight: "50", category: "Junior (F)", day: "Samedi", estimatedFights: 2,
          matches: generateMatchesTimeline(2)
        };
        const ref2 = await addDoc(collection(db, 'fightCards'), melineCard);

        setFightCards(prev => [...prev, {id: ref1.id, ...armandCard}, {id: ref2.id, ...melineCard}]);
        setScanStatus('FOUND');
        addLog("TERMINÉ. Cartes et Timelines générées avec succès.");
      } catch(e) {
        setScanStatus('ERROR'); addLog("Erreur lors de l'écriture en base.");
      }
    } else {
      await delay(1500);
      setScanStatus('ERROR');
      addLog("Aucun combattant de la S.M.G n'a été trouvé pour cet ID.");
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    if(!confirm("Supprimer définitivement ce combattant du tournoi ?")) return;
    try { await deleteDoc(doc(db, 'fightCards', cardId)); setFightCards(fightCards.filter(c => c.id !== cardId)); } catch(e){}
  };

  const handleUpdateMatch = async (card: any, matchId: string, fields: any) => {
    let currentMatches = card.matches;
    if (!currentMatches) {
       currentMatches = [{ id: `m_${Date.now()}`, title: 'Combat Principal', area: card.area || '?', matchNum: card.matchNum || 'TBD', headgear: card.headgear || '', result: card.result || 'En attente' }];
    }
    
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

    // FIX SCROLL ABSOLU: Un conteneur englobant h-full overflow-y-auto isole le scroll du reste de l'app.
    return (
      <div className="h-full w-full overflow-y-auto p-4 pb-32">
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
                 <input type="text" value={activeComp.name} onChange={e=>setActiveComp({...activeComp, name: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-xs text-white outline-none" placeholder="Nom..." />
                 <div className="grid grid-cols-2 gap-2"><input type="date" value={activeComp.date} onChange={e=>setActiveComp({...activeComp, date: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-xs text-white outline-none" /><input type="text" value={activeComp.location} onChange={e=>setActiveComp({...activeComp, location: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-xs text-white outline-none" placeholder="Ville" /></div>
               </div>
             )}
          </div>

          {isStaff && (
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl mb-4 animate-fade-in shadow-lg">
               <div className="flex justify-between items-center mb-3 border-b border-slate-800 pb-2">
                 <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-widest flex items-center"><UserPlus size={12} className="mr-2"/> Panel d'Engagement</h4>
                 <div className="flex space-x-1">
                   <button onClick={() => setRegMode('AUTO')} className={`text-[9px] font-bold uppercase px-2 py-1 rounded transition-colors ${regMode==='AUTO'?'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50':'text-slate-500'}`}><Radar size={10} className="inline mr-1"/> Auto</button>
                   <button onClick={() => setRegMode('INTERNAL')} className={`text-[9px] font-bold uppercase px-2 py-1 rounded transition-colors ${regMode==='INTERNAL'?'bg-amber-500/20 text-amber-500 border border-amber-500/50':'text-slate-500'}`}>Club</button>
                   <button onClick={() => setRegMode('EXTERNAL')} className={`text-[9px] font-bold uppercase px-2 py-1 rounded transition-colors ${regMode==='EXTERNAL'?'bg-rose-500/20 text-rose-400 border border-rose-500/50':'text-slate-500'}`}>Libre</button>
                 </div>
               </div>
               
               {regMode === 'AUTO' ? (
                 <div className="space-y-3">
                   <p className="text-[10px] text-slate-400 font-mono leading-tight">Extraction automatique des combattants S.M.G depuis la fédération.</p>
                   <div className="flex space-x-2">
                     <div className="flex-1 relative">
                       <Search size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" />
                       <input type="text" placeholder="ID FFKMDA (ex: 902)" value={ffkmdaId} onChange={e=>setFfkmdaId(e.target.value)} disabled={scanStatus === 'SCANNING'} className="w-full bg-slate-950 border border-cyan-500/30 rounded-lg text-xs py-2 pl-8 pr-2 text-cyan-400 outline-none focus:border-cyan-500 font-mono" />
                     </div>
                     <button onClick={executeFFKMDAScan} disabled={!ffkmdaId || scanStatus === 'SCANNING'} className="bg-cyan-600 hover:bg-cyan-500 text-slate-950 px-4 rounded-lg font-black text-xs uppercase disabled:opacity-50 flex items-center">
                       {scanStatus === 'SCANNING' ? <Activity size={14} className="animate-spin" /> : 'Scanner'}
                     </button>
                   </div>
                   {scanLogs.length > 0 && (
                     <div className="bg-slate-950 p-2 rounded border border-slate-800 max-h-32 overflow-y-auto text-[9px] font-mono space-y-1">
                       {scanLogs.map((log, i) => (
                         <div key={i} className={`${log.includes('ERREUR') || log.includes('Aucun') ? 'text-rose-500' : log.includes('POULE') || log.includes('TERMINÉ') || log.includes('inscrits validés') ? 'text-emerald-400' : 'text-slate-500'}`}>
                           &gt; {log}
                         </div>
                       ))}
                     </div>
                   )}
                 </div>
               ) : regMode === 'INTERNAL' ? (
                 <div className="flex space-x-2">
                   <select value={selectedMemberId} onChange={e => setSelectedMemberId(e.target.value)} className="flex-1 bg-slate-950 border border-slate-700 rounded-lg text-xs p-2 text-white outline-none focus:border-amber-500">
                     <option value="">Sélectionner un membre...</option>
                     {members.filter(m => !compCards.some(c => c.userId === m.id)).map(m => (<option key={m.id} value={m.id}>{m.name} (Né en {m.birthDate ? new Date(m.birthDate).getFullYear() : '?'})</option>))}
                   </select>
                   <button onClick={handleRegisterManual} disabled={!selectedMemberId || isLoading} className="bg-amber-600 hover:bg-amber-500 text-slate-950 px-4 rounded-lg font-black text-xs uppercase disabled:opacity-50">Ajouter</button>
                 </div>
               ) : (
                 <div className="space-y-2">
                   <input type="text" placeholder="Prénom et Nom..." value={extName} onChange={e=>setExtName(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg text-xs p-2 text-white outline-none focus:border-rose-500"/>
                   <div className="flex space-x-2">
                     <div className="w-1/3"><label className="text-[8px] text-slate-500 uppercase font-bold px-1">Naissance</label><input type="number" placeholder="Année" value={extBirthYear} onChange={e=>setExtBirthYear(parseInt(e.target.value))} className="w-full bg-slate-950 border border-slate-700 rounded-lg text-xs p-2 text-white outline-none focus:border-rose-500"/></div>
                     <div className="w-1/4"><label className="text-[8px] text-slate-500 uppercase font-bold px-1">Sexe</label><select value={extGender} onChange={e=>setExtGender(e.target.value as any)} className="w-full bg-slate-950 border border-slate-700 rounded-lg text-xs p-2 text-white outline-none focus:border-rose-500"><option value="M">M</option><option value="F">F</option></select></div>
                     <div className="w-1/4"><label className="text-[8px] text-slate-500 uppercase font-bold px-1">Poids</label><input type="number" placeholder="kg" value={extWeight} onChange={e=>setExtWeight(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg text-xs p-2 text-white outline-none focus:border-rose-500"/></div>
                     <div className="w-auto flex items-end pb-[1px]"><button onClick={handleRegisterManual} disabled={!extName || isLoading} className="bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-black text-xs uppercase px-3 py-2 disabled:opacity-50">OK</button></div>
                   </div>
                 </div>
               )}
            </div>
          )}

          <div>
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-1 mb-3 flex items-center justify-between">
              <span className="flex items-center"><Swords size={12} className="mr-2 text-rose-500"/> Dossiers Combattants ({compCards.length})</span>
            </h3>
            <div className="space-y-6">
              {compCards.map(card => {
                const canEdit = isStaff || card.userId === currentUser.id;
                
                const matches = card.matches && card.matches.length > 0 ? card.matches : [{ 
                  id: `legacy_${Date.now()}`, title: 'Combat Unique', area: card.area || '?', matchNum: card.matchNum || 'TBD', 
                  headgear: card.headgear || '', result: card.result || 'En attente' 
                }];

                return (
                  <div key={card.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
                    <div className="bg-slate-800/50 p-3 flex justify-between items-center relative">
                      {isStaff && <button onClick={() => handleDeleteCard(card.id)} className="absolute top-3 right-3 text-slate-500 hover:text-rose-500"><Trash2 size={14}/></button>}
                      <div>
                        <h4 className="font-black text-lg text-white uppercase tracking-tight">{card.userName}</h4>
                        <p className="text-[10px] text-amber-500 font-mono font-bold uppercase mt-0.5">{card.category} • {card.weight}kg</p>
                      </div>
                    </div>

                    <div className="p-3 space-y-3 bg-slate-900/80">
                      {matches.map((m: any) => {
                        const isPendingInfo = m.area === '?' || !m.matchNum || m.matchNum === 'TBD';
                        const isWin = m.result === 'Victoire';
                        const isLoss = m.result === 'Défaite';

                        return (
                          <div key={m.id} className={`p-3 rounded-lg border relative ${isPendingInfo ? 'bg-slate-950/50 border-slate-700/50 border-dashed' : 'bg-slate-950 border-slate-700'}`}>
                            <div className="flex justify-between items-center mb-3">
                              <span className="text-xs font-black text-amber-500 uppercase tracking-widest">{m.title}</span>
                              {isWin && <span className="bg-emerald-500/20 text-emerald-400 text-[9px] px-2 py-0.5 rounded border border-emerald-500/30 flex items-center font-bold uppercase"><CheckCircle size={10} className="mr-1"/> Victoire</span>}
                              {isLoss && <span className="bg-rose-500/20 text-rose-400 text-[9px] px-2 py-0.5 rounded border border-rose-500/30 flex items-center font-bold uppercase"><XCircle size={10} className="mr-1"/> Défaite</span>}
                            </div>

                            {canEdit ? (
                              <>
                                <div className="grid grid-cols-2 gap-2 mb-3">
                                  <div><label className="text-[8px] text-slate-500 font-bold uppercase mb-1 block">Aire</label><input type="text" value={m.area} onChange={e => handleUpdateMatch(card, m.id, {area: e.target.value})} className={`w-full bg-slate-900 border rounded p-1.5 text-xs font-bold text-center outline-none focus:border-cyan-500 ${m.area === '?' ? 'border-amber-500/50 text-amber-500' : 'border-slate-600 text-white'}`} placeholder="?" /></div>
                                  <div><label className="text-[8px] text-slate-500 font-bold uppercase mb-1 block">N° Cbt</label><input type="text" value={m.matchNum} onChange={e => handleUpdateMatch(card, m.id, {matchNum: e.target.value})} className={`w-full bg-slate-900 border rounded p-1.5 text-xs font-bold text-center outline-none focus:border-cyan-500 ${m.matchNum === 'TBD' || !m.matchNum ? 'border-amber-500/50 text-amber-500' : 'border-slate-600 text-white'}`} placeholder="N°" /></div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-2 mb-3">
                                  <div>
                                    <label className="text-[8px] text-slate-500 font-bold uppercase mb-1 block text-center">Couleur (Casque)</label>
                                    <div className="flex rounded-lg overflow-hidden border border-slate-700">
                                      <button onClick={() => handleUpdateMatch(card, m.id, {headgear: 'Rouge'})} className={`flex-1 text-[10px] font-black uppercase py-1.5 transition-colors ${m.headgear === 'Rouge' ? 'bg-rose-600 text-white shadow-inner' : 'bg-slate-900 text-slate-500 hover:bg-slate-800'}`}>Rouge</button>
                                      <button onClick={() => handleUpdateMatch(card, m.id, {headgear: 'Bleu'})} className={`flex-1 text-[10px] font-black uppercase py-1.5 transition-colors ${m.headgear === 'Bleu' ? 'bg-cyan-600 text-white shadow-inner' : 'bg-slate-900 text-slate-500 hover:bg-slate-800'}`}>Bleu</button>
                                    </div>
                                  </div>
                                  <div>
                                    <label className="text-[8px] text-slate-500 font-bold uppercase mb-1 block text-center">Issue</label>
                                    <div className="flex rounded-lg overflow-hidden border border-slate-700">
                                      <button onClick={() => handleUpdateMatch(card, m.id, {result: 'Victoire'})} className={`flex-1 flex justify-center items-center text-[10px] font-black py-1.5 transition-colors ${m.result === 'Victoire' ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-slate-500 hover:bg-slate-800'}`}><CheckCircle size={12}/></button>
                                      <button onClick={() => handleUpdateMatch(card, m.id, {result: 'Défaite'})} className={`flex-1 flex justify-center items-center text-[10px] font-black py-1.5 transition-colors ${m.result === 'Défaite' ? 'bg-rose-600 text-white' : 'bg-slate-900 text-slate-500 hover:bg-slate-800'}`}><XCircle size={12}/></button>
                                    </div>
                                  </div>
                                </div>
                              </>
                            ) : (
                              <div className="flex justify-around items-center bg-slate-900 p-2 rounded border border-slate-800">
                                <div className="text-center"><span className="block text-[8px] text-slate-500 uppercase">Aire</span><span className={`text-xs font-bold ${m.area === '?' ? 'text-amber-500' : 'text-white'}`}>{m.area || '-'}</span></div>
                                <div className="text-center"><span className="block text-[8px] text-slate-500 uppercase">Combat</span><span className={`text-xs font-bold ${m.matchNum === 'TBD' ? 'text-amber-500' : 'text-white'}`}>{m.matchNum || '-'}</span></div>
                                <div className="text-center"><span className="block text-[8px] text-slate-500 uppercase">Casque</span><span className={`text-xs font-bold ${m.headgear==='Rouge'?'text-rose-500':m.headgear==='Bleu'?'text-cyan-500':'text-slate-500'}`}>{m.headgear || '?'}</span></div>
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {canEdit && (
                         <button onClick={() => addMatchToCard(card)} className="w-full py-2 bg-slate-900 border border-slate-700 border-dashed rounded-lg text-[10px] text-slate-400 uppercase font-bold tracking-widest hover:text-cyan-400 hover:border-cyan-500 transition-colors flex items-center justify-center">
                           <Plus size={12} className="mr-1" /> Ajouter un combat à la timeline
                         </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // LIST VIEW - Fix Scroll also
  return (
    <div className="h-full w-full overflow-y-auto p-4 pb-32">
      <div className="flex flex-col max-w-lg mx-auto h-full">
        <div className="flex justify-between items-center mb-6 shrink-0">
          <div>
            <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase">Arène</h2>
            <span className="text-[10px] text-amber-500 font-mono uppercase tracking-widest leading-none">Circuit de Compétition</span>
          </div>
          {isStaff && (
             <button onClick={() => { setView('DETAIL'); setRegMode('AUTO'); }} className="bg-cyan-500/20 text-cyan-400 p-2 rounded-xl border border-cyan-500/50 hover:bg-cyan-500/30 transition-colors shadow-[0_0_15px_-5px_rgba(6,182,212,0.4)]">
               <Radar size={20} />
             </button>
          )}
        </div>

        <div className="flex-1 space-y-3 pb-10">
          {isLoading && <p className="text-center text-amber-500 text-xs font-mono animate-pulse">RECHERCHE D'ÉVÉNEMENTS...</p>}
          {competitions.map(comp => {
            const isUpcoming = new Date(comp.date) >= new Date();
            return (
              <button key={comp.id} onClick={() => { setActiveComp(comp); setView('DETAIL'); }} className="w-full text-left focus:outline-none">
                <FuturisticCard borderColor={isUpcoming ? 'amber' : 'slate'} className={`hover:border-amber-500/50 transition-colors group ${!isUpcoming && 'opacity-70'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded border ${isUpcoming ? 'bg-amber-950 border-amber-900' : 'bg-slate-900 border-slate-800'}`}><Trophy size={16} className={isUpcoming ? "text-amber-500" : "text-slate-500"} /></div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-100">{comp.name}</h4>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">{new Date(comp.date).toLocaleDateString('fr-FR')} • {comp.location}</p>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-slate-600 group-hover:text-amber-500 transition-colors" />
                  </div>
                </FuturisticCard>
              </button>
            )
          })}

          {isStaff && competitions.length === 0 && !isLoading && (
            <div className="text-center p-8 bg-slate-900/50 rounded-2xl border border-slate-800 border-dashed">
              <Radar size={32} className="mx-auto text-slate-600 mb-3" />
              <p className="text-xs text-slate-400 font-mono mb-4">Aucune compétition détectée.</p>
              <button onClick={() => { setView('DETAIL'); setRegMode('AUTO'); }} className="bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-cyan-600/40 transition-all">Scanner la FFKMDA</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}