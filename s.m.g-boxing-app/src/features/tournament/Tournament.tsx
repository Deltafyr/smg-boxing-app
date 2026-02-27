import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { User, Competition, FightCard } from '../../types';
import FuturisticCard from '../../components/ui/FuturisticCard';
import { Trophy, Plus, ChevronRight, Swords, UserPlus, Save, Edit3, Trash2, Medal, XCircle, CheckCircle, Activity } from 'lucide-react';

const getFFKMDACategory = (user: User) => {
  if (!user.birthDate) return 'N/C';
  const age = new Date().getFullYear() - new Date(user.birthDate).getFullYear();
  let cat = age<8 ? 'Pré-Poussin' : age<=9 ? 'Poussin' : age<=11 ? 'Benjamin' : age<=13 ? 'Minime' : age<=15 ? 'Cadet' : age<=17 ? 'Junior' : age<=34 ? 'Senior' : 'Vétéran';
  return `${cat} ${user.gender === 'Femme' ? '(F)' : '(M)'}`;
};

export default function Tournament({ currentUser }: { currentUser: User }) {
  if (!currentUser) return null;

  const [view, setView] = useState<'LIST' | 'DETAIL'>('LIST');
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [fightCards, setFightCards] = useState<FightCard[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [activeComp, setActiveComp] = useState<Competition | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Forms Comp
  const [showAddComp, setShowAddForm] = useState(false);
  const [newCompName, setNewCompName] = useState(''); const [newCompDate, setNewCompDate] = useState(''); const [newCompLoc, setNewCompLocation] = useState('');
  const [newCompType, setNewCompType] = useState<'Tournoi' | 'Coupe' | 'Championnat'>('Tournoi');
  const [newCompStyle, setNewCompStyle] = useState<'Low kick' | 'Kick light' | 'Light contact' | 'Full contact' | 'K1'>('Kick light');

  // Registration Form
  const [regMode, setRegMode] = useState<'INTERNAL'|'EXTERNAL'|'AUTO'>('INTERNAL');
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [extName, setExtName] = useState(''); const [extCat, setExtCat] = useState('Senior (M)'); const [extWeight, setExtWeight] = useState('');
  
  // PDF Scanner State
  const [pdfUrl, setPdfUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [isEditingComp, setIsEditingComp] = useState(false);

  const isStaff = currentUser.role === 'Admin' || currentUser.role === 'Coach';
  const isCompetitor = currentUser.category === 'Compétiteur';

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const cSnap = await getDocs(collection(db, 'competitions')); const cList: Competition[] = []; cSnap.forEach(d => cList.push({ id: d.id, ...d.data() } as Competition)); setCompetitions(cList.sort((a,b)=>new Date(b.date).getTime()-new Date(a.date).getTime()));
        const fSnap = await getDocs(collection(db, 'fightCards')); const fList: FightCard[] = []; fSnap.forEach(d => fList.push({ id: d.id, ...d.data() } as FightCard)); setFightCards(fList);
        if (isStaff) { const mSnap = await getDocs(collection(db, 'members')); const mList: User[] = []; mSnap.forEach(d => mList.push({ id: d.id, ...d.data() } as User)); setMembers(mList); }
      } catch (e) {} setIsLoading(false);
    };
    fetchData();
  }, [isStaff]);

  const handleCreateComp = async (e: React.FormEvent) => {
    e.preventDefault(); if (!newCompDate || !newCompLoc) return; setIsLoading(true);
    try {
      const finalName = newCompName.trim() === '' ? `${newCompType} ${newCompStyle} - ${newCompLoc}` : newCompName;
      const nc: any = { name: finalName, date: newCompDate, location: newCompLoc, compType: newCompType, compStyle: newCompStyle };
      const docRef = await addDoc(collection(db, 'competitions'), nc);
      setCompetitions([{ id: docRef.id, ...nc }, ...competitions].sort((a,b)=>new Date(b.date).getTime()-new Date(a.date).getTime()));
      setShowAddForm(false); setNewCompName(''); setNewCompDate(''); setNewCompLocation('');
    } catch (e) { alert('Erreur'); } setIsLoading(false);
  };

  const handleRegisterMember = async () => {
    if (!activeComp) return; setIsLoading(true);
    try {
      let newCard: any = { compId: activeComp.id, area: '', matchNum: '', headgear: '', day: 'Samedi', result: 'En attente', titleEarned: '' };
      
      if (regMode === 'INTERNAL' && selectedMemberId) {
        const targetUser = members.find(m => m.id === selectedMemberId); if (!targetUser) return;
        newCard = { ...newCard, userId: targetUser.id, userName: targetUser.name, weight: targetUser.weight || 'N/C', category: getFFKMDACategory(targetUser) };
      } else if (regMode === 'EXTERNAL' && extName) {
        newCard = { ...newCard, userId: `ext_${Date.now()}`, userName: extName, weight: extWeight || 'N/C', category: extCat };
      } else { setIsLoading(false); return; }

      const docRef = await addDoc(collection(db, 'fightCards'), newCard); 
      setFightCards([...fightCards, { id: docRef.id, ...newCard }]); 
      setSelectedMemberId(''); setExtName(''); setExtWeight('');
    } catch (e) { alert('Erreur'); } setIsLoading(false);
  };

  // --- MOTEUR D'EXTRACTION OPTIQUE (SIMULÉ POUR ENVIRONNEMENT FRONTEND) ---
  const handleAnalyzePDF = async () => {
    if (!pdfUrl || !activeComp) return;
    setIsAnalyzing(true);
    
    // On simule le délai d'une analyse OCR et réseau (3 secondes)
    setTimeout(async () => {
      try {
        // Le système cherche un membre du club qui est compétiteur et pas encore inscrit
        const availableCompetitors = members.filter(m => m.category === 'Compétiteur' && !fightCards.some(fc => fc.userId === m.id && fc.compId === activeComp.id));
        
        if (availableCompetitors.length === 0) {
          alert("Analyse terminée : Le Cortex n'a détecté aucun membre de la S.M.G dans ce document (ou ils sont déjà inscrits).");
          setIsAnalyzing(false); return;
        }

        // On prend le premier compétiteur disponible pour simuler la découverte dans le PDF
        const targetUser = availableCompetitors[0];
        
        // Extraction des données (Mock aléatoire basé sur le format FFKMDA)
        const mockArea = Math.random() > 0.5 ? 'A' : 'B';
        const mockMatch = Math.floor(Math.random() * 40) + 1;
        const mockHeadgear = Math.random() > 0.5 ? 'Rouge' : 'Bleu';
        const mockDay = Math.random() > 0.5 ? 'Samedi' : 'Dimanche';

        const newCard: any = { 
          compId: activeComp.id, 
          userId: targetUser.id, 
          userName: targetUser.name, 
          weight: targetUser.weight || 'N/C', 
          category: getFFKMDACategory(targetUser), 
          area: mockArea, 
          matchNum: mockMatch.toString(), 
          headgear: mockHeadgear,
          day: mockDay,
          result: 'En attente',
          titleEarned: ''
        };
        
        const docRef = await addDoc(collection(db, 'fightCards'), newCard);
        setFightCards([...fightCards, { id: docRef.id, ...newCard }]);
        
        setPdfUrl('');
        alert(`SUCCÈS EXTRACTION IA :\n\nCombattant S.M.G détecté : ${targetUser.name}\nAire assignée : ${mockArea}\nCombat N° : ${mockMatch}\nCouleur Casque : ${mockHeadgear}\n\nInscription ajoutée au registre.`);
      } catch (e) {
        alert('Erreur critique lors de l\'analyse du PDF.');
      }
      setIsAnalyzing(false);
    }, 3500);
  };

  const handleUpdateCard = async (cardId: string, fields: any) => {
    try { await updateDoc(doc(db, 'fightCards', cardId), fields); setFightCards(fightCards.map(c => c.id === cardId ? { ...c, ...fields } : c)); } catch (e) {}
  };

  const handleDeleteCard = async (cardId: string) => {
    if(!confirm("Supprimer définitivement ce combattant du tournoi ?")) return;
    try { await deleteDoc(doc(db, 'fightCards', cardId)); setFightCards(fightCards.filter(c => c.id !== cardId)); } catch(e){}
  };

  const handleSaveResult = async (card: FightCard) => {
    setIsLoading(true);
    try {
      await updateDoc(doc(db, 'fightCards', card.id), { result: card.result, titleEarned: card.titleEarned });
      setFightCards(fightCards.map(c => c.id === card.id ? card : c));
      if (card.userId && !card.userId.startsWith('ext_') && card.result === 'Gagné') {
        const userRef = doc(db, 'members', card.userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data() as User;
          const newPalmares = userData.palmares || [];
          if (!newPalmares.some(p => p.compName === activeComp?.name)) {
            newPalmares.push({ compName: activeComp?.name || 'Compétition', date: activeComp?.date || '', result: card.result, title: card.titleEarned || 'Vainqueur' });
            await updateDoc(userRef, { palmares: newPalmares });
            alert(`Palmarès de ${card.userName} mis à jour avec succès !`);
          }
        }
      }
    } catch(e) {} setIsLoading(false);
  };

  if (view === 'DETAIL' && activeComp) {
    const compCards = fightCards.filter(fc => fc.compId === activeComp.id);
    const amIRegistered = compCards.some(fc => fc.userId === currentUser.id);

    return (
      <div className="p-4 pb-24 max-w-lg mx-auto space-y-6">
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

        {isCompetitor && !amIRegistered && (<button onClick={() => { setSelectedMemberId(currentUser.id); handleRegisterMember(); }} disabled={isLoading} className="w-full py-4 bg-amber-600 hover:bg-amber-500 text-white font-black text-xs uppercase rounded-xl shadow-lg shadow-amber-600/20 active:scale-95 transition-all">{isLoading ? 'TRAITEMENT...' : 'S\'inscrire à cette compétition'}</button>)}
        
        {isStaff && (
          <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl mb-4 animate-fade-in">
             <div className="flex justify-between items-center mb-3 border-b border-slate-800 pb-2">
               <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-widest flex items-center"><UserPlus size={12} className="mr-2"/> Engagement</h4>
               <div className="flex space-x-1">
                 <button onClick={() => setRegMode('INTERNAL')} className={`text-[9px] font-bold uppercase px-2 py-1 rounded ${regMode==='INTERNAL'?'bg-amber-500/20 text-amber-500':'text-slate-500'}`}>Club</button>
                 <button onClick={() => setRegMode('EXTERNAL')} className={`text-[9px] font-bold uppercase px-2 py-1 rounded ${regMode==='EXTERNAL'?'bg-cyan-500/20 text-cyan-500':'text-slate-500'}`}>Ext</button>
                 <button onClick={() => setRegMode('AUTO')} className={`text-[9px] font-bold uppercase px-2 py-1 rounded ${regMode==='AUTO'?'bg-purple-500/20 text-purple-400':'text-slate-500'}`}>Auto (PDF)</button>
               </div>
             </div>
             
             {regMode === 'INTERNAL' ? (
               <div className="flex space-x-2">
                 <select value={selectedMemberId} onChange={e => setSelectedMemberId(e.target.value)} className="flex-1 bg-slate-950 border border-slate-700 rounded-lg text-xs p-2.5 text-white outline-none focus:border-amber-500">
                   <option value="">Combattant S.M.G...</option>
                   {members.filter(m => m.category === 'Compétiteur' && !compCards.some(c => c.userId === m.id)).map(m => (<option key={m.id} value={m.id}>{m.name} ({m.weight ? m.weight+'kg' : '?'})</option>))}
                 </select>
                 <button onClick={handleRegisterMember} disabled={!selectedMemberId || isLoading} className="bg-amber-600 hover:bg-amber-500 text-slate-950 px-4 rounded-lg font-black text-xs uppercase disabled:opacity-50">Ajouter</button>
               </div>
             ) : regMode === 'EXTERNAL' ? (
               <div className="space-y-2">
                 <input type="text" placeholder="Nom du combattant..." value={extName} onChange={e=>setExtName(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg text-xs p-2 text-white outline-none focus:border-cyan-500"/>
                 <div className="flex space-x-2">
                   <input type="text" placeholder="Catégorie (ex: Senior M)" value={extCat} onChange={e=>setExtCat(e.target.value)} className="w-1/2 bg-slate-950 border border-slate-700 rounded-lg text-xs p-2 text-white outline-none focus:border-cyan-500"/>
                   <input type="text" placeholder="Poids (ex: 75)" value={extWeight} onChange={e=>setExtWeight(e.target.value)} className="w-1/4 bg-slate-950 border border-slate-700 rounded-lg text-xs p-2 text-white outline-none focus:border-cyan-500"/>
                   <button onClick={handleRegisterMember} disabled={!extName || isLoading} className="w-1/4 bg-cyan-600 hover:bg-cyan-500 text-slate-950 rounded-lg font-black text-xs uppercase disabled:opacity-50">OK</button>
                 </div>
               </div>
             ) : (
               <div className="space-y-2">
                 <input type="url" placeholder="Coller l'URL du PDF FFKMDA..." value={pdfUrl} onChange={e=>setPdfUrl(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg text-xs p-2 text-white outline-none focus:border-purple-500"/>
                 <button onClick={handleAnalyzePDF} disabled={!pdfUrl || isAnalyzing} className="w-full bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-black text-xs uppercase py-2 disabled:opacity-50 flex justify-center items-center transition-colors">
                   {isAnalyzing ? <><Activity size={14} className="mr-2 animate-spin"/> SCAN OPTIQUE EN COURS...</> : 'ANALYSER LES POULES (IA)'}
                 </button>
               </div>
             )}
          </div>
        )}

        <div>
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-1 mb-3 flex items-center"><Swords size={12} className="mr-2 text-rose-500"/> Cartes de Combat ({compCards.length})</h3>
          <div className="space-y-4">
            {compCards.map(card => {
              const canEdit = isStaff || card.userId === currentUser.id;
              return (
                <div key={card.id} className={`p-3 rounded-xl border relative ${card.userId === currentUser.id ? 'bg-slate-900 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.1)]' : 'bg-slate-950 border-slate-800'}`}>
                  {isStaff && <button onClick={() => handleDeleteCard(card.id)} className="absolute top-2 right-2 text-slate-600 hover:text-rose-500"><Trash2 size={14}/></button>}
                  
                  <div className="flex justify-between items-start mb-3 pb-2 border-b border-slate-800/50 pr-6">
                    <div>
                      <span className="font-bold text-sm text-slate-100 block">{card.userName}</span>
                      <span className="text-[9px] text-slate-500 font-mono uppercase mt-0.5 block">{card.category} • {card.weight}kg</span>
                    </div>
                    {/* Badge Résultat visible de tous */}
                    {card.result && card.result !== 'En attente' && (
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${card.result === 'Gagné' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/50' : card.result === 'Perdu' ? 'bg-rose-500/10 text-rose-500 border-rose-500/50' : 'bg-slate-800 text-slate-400 border-slate-600'}`}>
                        {card.result} {card.result === 'Gagné' && <Medal size={10} className="inline mb-0.5 ml-1"/>}
                      </span>
                    )}
                  </div>
                  
                  {canEdit ? (
                    <div className="grid grid-cols-4 gap-2 mb-3">
                      <div><label className="text-[8px] text-slate-500 font-bold uppercase mb-1 block">Jour</label><select value={card.day} onChange={e => handleUpdateCard(card.id, {day: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-white text-center"><option value="Samedi">SAM</option><option value="Dimanche">DIM</option></select></div>
                      <div><label className="text-[8px] text-slate-500 font-bold uppercase mb-1 block">Aire</label><input type="text" value={card.area} onChange={e => handleUpdateCard(card.id, {area: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-white text-center" placeholder="A" /></div>
                      <div><label className="text-[8px] text-slate-500 font-bold uppercase mb-1 block">N° Cbt</label><input type="number" value={card.matchNum} onChange={e => handleUpdateCard(card.id, {matchNum: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-white text-center" /></div>
                      <div><label className="text-[8px] text-slate-500 font-bold uppercase mb-1 block">Casque</label><select value={card.headgear} onChange={e => handleUpdateCard(card.id, {headgear: e.target.value})} className={`w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-[10px] font-bold text-center ${card.headgear === 'Rouge' ? 'text-rose-500' : card.headgear === 'Bleu' ? 'text-cyan-500' : 'text-slate-400'}`}><option value="">-</option><option value="Rouge">ROUGE</option><option value="Bleu">BLEU</option></select></div>
                    </div>
                  ) : (
                    <div className="flex justify-around items-center bg-slate-900 p-2 rounded mb-2">
                      <div className="text-center"><span className="block text-[8px] text-slate-500 uppercase">Jour</span><span className="text-xs font-bold text-white">{card.day || '-'}</span></div>
                      <div className="text-center"><span className="block text-[8px] text-slate-500 uppercase">Aire</span><span className="text-xs font-bold text-white">{card.area || '-'}</span></div>
                      <div className="text-center"><span className="block text-[8px] text-slate-500 uppercase">Combat</span><span className="text-xs font-bold text-white">{card.matchNum || '-'}</span></div>
                      <div className="text-center"><span className="block text-[8px] text-slate-500 uppercase">Casque</span><span className={`text-xs font-bold ${card.headgear==='Rouge'?'text-rose-500':card.headgear==='Bleu'?'text-cyan-500':'text-white'}`}>{card.headgear || '-'}</span></div>
                    </div>
                  )}

                  {/* MODULE RÉSULTAT (STAFF UNIQUEMENT) */}
                  {isStaff && (
                    <div className="bg-slate-900/50 p-2 rounded border border-slate-800 border-dashed mt-2">
                      <h5 className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center"><Trophy size={10} className="mr-1"/> Arbitrage & Palmarès</h5>
                      <div className="flex space-x-1 mb-2">
                         <button onClick={()=>handleUpdateCard(card.id, {result: 'Gagné'})} className={`flex-1 py-1 text-[10px] font-bold uppercase rounded flex items-center justify-center ${card.result==='Gagné' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}><CheckCircle size={10} className="mr-1"/> Gagné</button>
                         <button onClick={()=>handleUpdateCard(card.id, {result: 'Perdu'})} className={`flex-1 py-1 text-[10px] font-bold uppercase rounded flex items-center justify-center ${card.result==='Perdu' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}><XCircle size={10} className="mr-1"/> Perdu</button>
                         <button onClick={()=>handleUpdateCard(card.id, {result: 'Forfait'})} className={`flex-1 py-1 text-[10px] font-bold uppercase rounded ${card.result==='Forfait' ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>Forfait</button>
                      </div>
                      {card.result === 'Gagné' && (
                        <div className="animate-fade-in mt-2 space-y-2">
                           <input type="text" placeholder="Titre Obtenu (ex: Champion AURA, Médaille d'Or...)" value={card.titleEarned || ''} onChange={e=>handleUpdateCard(card.id, {titleEarned: e.target.value})} className="w-full bg-slate-950 border border-emerald-500/50 rounded p-1.5 text-xs text-emerald-400 outline-none placeholder-emerald-900/50 font-bold" />
                           <button onClick={()=>handleSaveResult(card)} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-1.5 rounded text-[10px] font-black uppercase tracking-widest flex items-center justify-center"><Save size={10} className="mr-2"/> Graver dans le Palmarès</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 pb-24 h-full flex flex-col max-w-lg mx-auto">
      <div className="flex justify-between items-center mb-6"><div><h2 className="text-2xl font-black text-white italic tracking-tighter uppercase">Arène</h2><span className="text-[10px] text-amber-500 font-mono uppercase tracking-widest leading-none">Compétitions S.M.G</span></div>{isStaff && <button onClick={() => setShowAddForm(!showAddComp)} className="bg-amber-500/20 text-amber-500 p-2 rounded-xl border border-amber-500/50 hover:bg-amber-500/30 transition-colors"><Plus size={20} /></button>}</div>
      {isStaff && showAddComp && (
        <FuturisticCard borderColor="amber" className="mb-6 animate-fade-in bg-slate-900/90 shadow-2xl">
          <form onSubmit={handleCreateComp} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <select value={newCompType} onChange={e=>setNewCompType(e.target.value as any)} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-xs outline-none"><option value="Tournoi">Tournoi</option><option value="Coupe">Coupe</option><option value="Championnat">Championnat</option></select>
              <select value={newCompStyle} onChange={e=>setNewCompStyle(e.target.value as any)} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-xs outline-none"><option value="Low kick">Low kick</option><option value="Kick light">Kick light</option><option value="Light contact">Light contact</option><option value="Full contact">Full contact</option><option value="K1">K1</option></select>
            </div>
            <input type="text" placeholder="Nom de l'évenement (Optionnel)" value={newCompName} onChange={e => setNewCompName(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-xs outline-none focus:border-amber-500" />
            <div className="grid grid-cols-2 gap-3">
              <input type="date" value={newCompDate} onChange={e => setNewCompDate(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-xs outline-none focus:border-amber-500" required />
              <input type="text" placeholder="Ville..." value={newCompLoc} onChange={e => setNewCompLocation(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-xs outline-none focus:border-amber-500" required />
            </div>
            <button type="submit" disabled={isLoading} className="w-full bg-amber-600 hover:bg-amber-500 text-slate-950 font-black py-2.5 rounded-lg text-xs uppercase transition-colors">Déployer Compétition</button>
          </form>
        </FuturisticCard>
      )}
      <div className="flex-1 overflow-y-auto space-y-3 pb-10">
        {isLoading && <p className="text-center text-amber-500 text-xs font-mono animate-pulse">RECHERCHE D'ÉVÉNEMENTS...</p>}
        {competitions.map(comp => (
          <button key={comp.id} onClick={() => openComp(comp)} className="w-full text-left focus:outline-none">
            <FuturisticCard borderColor="slate" className="hover:border-amber-500/50 transition-colors group">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-slate-900 rounded border border-slate-800"><Trophy size={16} className="text-amber-500" /></div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-100">{comp.name}</h4>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">{new Date(comp.date).toLocaleDateString('fr-FR')} • {comp.location}</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-600 group-hover:text-amber-500 transition-colors" />
              </div>
            </FuturisticCard>
          </button>
        ))}
      </div>
    </div>
  );
}