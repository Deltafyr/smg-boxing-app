import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { User, Competition, FightCard } from '../../types';
import FuturisticCard from '../../components/ui/FuturisticCard';
import { Trophy, Plus, ChevronRight, Swords, UserPlus, Save, Edit3 } from 'lucide-react';

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
  
  const [showAddComp, setShowAddForm] = useState(false);
  const [newCompName, setNewCompName] = useState(''); const [newCompDate, setNewCompDate] = useState(''); const [newCompLoc, setNewCompLocation] = useState('');
  const [newCompType, setNewCompType] = useState<'Tournoi' | 'Coupe' | 'Championnat'>('Tournoi');
  const [newCompStyle, setNewCompStyle] = useState<'Low kick' | 'Kick light' | 'Light contact' | 'Full contact' | 'K1'>('Kick light');

  const [selectedMemberId, setSelectedMemberId] = useState('');
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

  const handleEditCompSave = async () => {
    if(!activeComp) return; setIsLoading(true);
    try {
      await updateDoc(doc(db, 'competitions', activeComp.id), { name: activeComp.name, date: activeComp.date, location: activeComp.location, compType: activeComp.compType, compStyle: activeComp.compStyle });
      setCompetitions(competitions.map(c => c.id === activeComp.id ? activeComp : c).sort((a,b)=>new Date(b.date).getTime()-new Date(a.date).getTime()));
      setIsEditingComp(false);
    } catch(e) { alert("Erreur modification"); } setIsLoading(false);
  }

  const handleRegisterMe = async () => {
    if (!activeComp || !isCompetitor) return; setIsLoading(true);
    try {
      const newCard: any = { compId: activeComp.id, userId: currentUser.id, userName: currentUser.name, weight: currentUser.weight || 'N/C', category: getFFKMDACategory(currentUser), area: '', matchNum: '', headgear: '' };
      const docRef = await addDoc(collection(db, 'fightCards'), newCard); setFightCards([...fightCards, { id: docRef.id, ...newCard }]);
    } catch (e) { alert('Erreur'); } setIsLoading(false);
  };

  const handleRegisterMember = async () => {
    if (!activeComp || !selectedMemberId) return; const targetUser = members.find(m => m.id === selectedMemberId); if (!targetUser) return; setIsLoading(true);
    try {
      const newCard: any = { compId: activeComp.id, userId: targetUser.id, userName: targetUser.name, weight: targetUser.weight || 'N/C', category: getFFKMDACategory(targetUser), area: '', matchNum: '', headgear: '' };
      const docRef = await addDoc(collection(db, 'fightCards'), newCard); setFightCards([...fightCards, { id: docRef.id, ...newCard }]); setSelectedMemberId('');
    } catch (e) { alert('Erreur'); } setIsLoading(false);
  };

  const handleUpdateCard = async (cardId: string, field: string, value: string) => {
    try { await updateDoc(doc(db, 'fightCards', cardId), { [field]: value }); setFightCards(fightCards.map(c => c.id === cardId ? { ...c, [field]: value } : c)); } catch (e) {}
  };

  if (view === 'DETAIL' && activeComp) {
    const compCards = fightCards.filter(fc => fc.compId === activeComp.id);
    const amIRegistered = compCards.some(fc => fc.userId === currentUser.id);

    return (
      <div className="p-4 pb-24 max-w-lg mx-auto space-y-6">
        <button onClick={() => setView('LIST')} className="text-slate-500 text-xs font-bold uppercase">&larr; Retour</button>
        
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-xl relative">
           {isStaff && (
             <button onClick={() => isEditingComp ? handleEditCompSave() : setIsEditingComp(true)} className="absolute top-3 right-3 text-slate-500 hover:text-amber-500 p-2">
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
               <div className="grid grid-cols-2 gap-2">
                 <select value={activeComp.compType} onChange={e=>setActiveComp({...activeComp, compType: e.target.value as any})} className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-xs text-white outline-none"><option value="Tournoi">Tournoi</option><option value="Coupe">Coupe</option><option value="Championnat">Championnat</option></select>
                 <select value={activeComp.compStyle} onChange={e=>setActiveComp({...activeComp, compStyle: e.target.value as any})} className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-xs text-white outline-none"><option value="Low kick">Low kick</option><option value="Kick light">Kick light</option><option value="Light contact">Light contact</option><option value="Full contact">Full contact</option><option value="K1">K1</option></select>
               </div>
               <div className="grid grid-cols-2 gap-2">
                 <input type="date" value={activeComp.date} onChange={e=>setActiveComp({...activeComp, date: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-xs text-white outline-none" />
                 <input type="text" value={activeComp.location} onChange={e=>setActiveComp({...activeComp, location: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-xs text-white outline-none" placeholder="Ville" />
               </div>
             </div>
           )}
        </div>

        {isCompetitor && !amIRegistered && (<button onClick={handleRegisterMe} disabled={isLoading} className="w-full py-4 bg-amber-600 hover:bg-amber-500 text-white font-black text-xs uppercase rounded-xl shadow-lg shadow-amber-600/20 active:scale-95 transition-all">{isLoading ? 'TRAITEMENT...' : 'S\'inscrire à cette compétition'}</button>)}
        
        {isStaff && (
          <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl mb-4 animate-fade-in">
             <h4 className="text-[10px] font-black text-amber-500 mb-3 uppercase tracking-widest flex items-center"><UserPlus size={12} className="mr-2"/> Engagement manuel</h4>
             <div className="flex space-x-2">
               <select value={selectedMemberId} onChange={e => setSelectedMemberId(e.target.value)} className="flex-1 bg-slate-950 border border-slate-700 rounded-lg text-xs p-2.5 text-white outline-none focus:border-amber-500">
                 <option value="">Sélectionner...</option>
                 {members.filter(m => m.category === 'Compétiteur' && !compCards.some(c => c.userId === m.id)).map(m => (<option key={m.id} value={m.id}>{m.name} ({m.weight ? m.weight+'kg' : '?'})</option>))}
               </select>
               <button onClick={handleRegisterMember} disabled={!selectedMemberId || isLoading} className="bg-amber-600 hover:bg-amber-500 text-slate-950 px-4 rounded-lg font-black text-xs uppercase disabled:opacity-50">Ajouter</button>
             </div>
          </div>
        )}

        <div>
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-1 mb-3 flex items-center"><Swords size={12} className="mr-2 text-rose-500"/> Fight Cards ({compCards.length})</h3>
          <div className="space-y-3">
            {compCards.map(card => {
              const canEdit = isStaff || card.userId === currentUser.id;
              return (
                <div key={card.id} className={`p-3 rounded-xl border ${card.userId === currentUser.id ? 'bg-slate-900 border-amber-500/50' : 'bg-slate-950 border-slate-800'}`}>
                  <div className="flex justify-between items-start mb-3 pb-2 border-b border-slate-800/50"><div><span className="font-bold text-sm text-slate-100 block">{card.userName}</span><span className="text-[9px] text-slate-500 font-mono uppercase mt-0.5 block">{card.category}</span></div></div>
                  {canEdit ? (
                    <div className="grid grid-cols-3 gap-2">
                      <div><label className="text-[8px] text-slate-500 font-bold uppercase mb-1 block">Aire/Ring</label><input type="text" value={card.area} onChange={e => handleUpdateCard(card.id, 'area', e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-white text-center" /></div>
                      <div><label className="text-[8px] text-slate-500 font-bold uppercase mb-1 block">N° Combat</label><input type="number" value={card.matchNum} onChange={e => handleUpdateCard(card.id, 'matchNum', e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-white text-center" /></div>
                      <div><label className="text-[8px] text-slate-500 font-bold uppercase mb-1 block">Coin/Casque</label><select value={card.headgear} onChange={e => handleUpdateCard(card.id, 'headgear', e.target.value)} className={`w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-center ${card.headgear === 'Rouge' ? 'text-rose-500' : card.headgear === 'Bleu' ? 'text-cyan-500' : 'text-slate-400'}`}><option value="">-</option><option value="Rouge">Rouge</option><option value="Bleu">Bleu</option></select></div>
                    </div>
                  ) : (
                    <div className="flex justify-around items-center bg-slate-900 p-2 rounded"><div className="text-center"><span className="block text-[8px] text-slate-500 uppercase">Aire</span><span className="text-xs font-bold text-white">{card.area || '-'}</span></div><div className="text-center"><span className="block text-[8px] text-slate-500 uppercase">Combat</span><span className="text-xs font-bold text-white">{card.matchNum || '-'}</span></div><div className="text-center"><span className="block text-[8px] text-slate-500 uppercase">Casque</span><span className={`text-xs font-bold ${card.headgear==='Rouge'?'text-rose-500':card.headgear==='Bleu'?'text-cyan-500':'text-white'}`}>{card.headgear || '-'}</span></div></div>
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
      <div className="flex justify-between items-center mb-6"><div><h2 className="text-2xl font-black text-white italic tracking-tighter uppercase">Arène</h2><span className="text-[10px] text-amber-500 font-mono uppercase tracking-widest leading-none">Compétitions S.M.G</span></div>{isStaff && <button onClick={() => setShowAddForm(!showAddComp)} className="bg-amber-500/20 text-amber-500 p-2 rounded-xl border border-amber-500/50"><Plus size={20} /></button>}</div>
      {isStaff && showAddComp && (
        <FuturisticCard borderColor="slate" className="mb-6 animate-fade-in bg-slate-900/80">
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
            <button type="submit" disabled={isLoading} className="w-full bg-amber-600 text-slate-950 font-black py-2 rounded text-xs uppercase">Initialiser la Base</button>
          </form>
        </FuturisticCard>
      )}
      <div className="flex-1 overflow-y-auto space-y-3">
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
                <ChevronRight size={16} className="text-slate-600 group-hover:text-amber-500" />
              </div>
            </FuturisticCard>
          </button>
        ))}
      </div>
    </div>
  );
}
