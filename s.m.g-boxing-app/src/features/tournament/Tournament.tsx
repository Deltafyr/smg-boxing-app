import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { User, Competition, FightCard } from '../../types';
import FuturisticCard from '../../components/ui/FuturisticCard';
import { Trophy, Plus, ChevronRight, Save, Swords } from 'lucide-react';

interface TournamentProps { 
  currentUser: User; 
}

const Tournament: React.FC<TournamentProps> = ({ currentUser }) => {
  const [view, setView] = useState<'LIST' | 'DETAIL'>('LIST');
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [fightCards, setFightCards] = useState<FightCard[]>([]);
  const [activeComp, setActiveComp] = useState<Competition | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Forms
  const [showAddComp, setShowAddForm] = useState(false);
  const [newCompName, setNewCompName] = useState('');
  const [newCompDate, setNewCompDate] = useState('');
  const [newCompLoc, setNewCompLocation] = useState('');

  const isStaff = currentUser.role === 'Admin' || currentUser.role === 'Coach';
  const isCompetitor = currentUser.category === 'Compétiteur';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const cSnap = await getDocs(collection(db, 'competitions'));
      const cList: Competition[] = [];
      cSnap.forEach(d => cList.push({ id: d.id, ...d.data() } as Competition));
      setCompetitions(cList);

      const fSnap = await getDocs(collection(db, 'fightCards'));
      const fList: FightCard[] = [];
      fSnap.forEach(d => fList.push({ id: d.id, ...d.data() } as FightCard));
      setFightCards(fList);
    } catch (e) { console.error(e); }
    setIsLoading(false);
  };

  const handleCreateComp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompName || !newCompDate) return;
    setIsLoading(true);
    try {
      const nc = { name: newCompName, date: newCompDate, location: newCompLoc };
      const docRef = await addDoc(collection(db, 'competitions'), nc);
      setCompetitions([...competitions, { id: docRef.id, ...nc }]);
      setShowAddForm(false); setNewCompName(''); setNewCompDate(''); setNewCompLocation('');
    } catch (e) { alert('Erreur création'); }
    setIsLoading(false);
  };

  const openComp = (comp: Competition) => {
    setActiveComp(comp);
    setView('DETAIL');
  };

  const handleRegisterMe = async () => {
    if (!activeComp || !isCompetitor) return;
    setIsLoading(true);
    try {
      const newCard: any = {
        compId: activeComp.id,
        userId: currentUser.id,
        userName: currentUser.name,
        weight: currentUser.weight || 'Inconnu',
        category: currentUser.category,
        area: '', matchNum: '', headgear: ''
      };
      const docRef = await addDoc(collection(db, 'fightCards'), newCard);
      setFightCards([...fightCards, { id: docRef.id, ...newCard }]);
    } catch (e) { alert('Erreur inscription'); }
    setIsLoading(false);
  };

  const handleUpdateCard = async (cardId: string, field: string, value: string) => {
    const card = fightCards.find(c => c.id === cardId);
    if (!card) return;
    try {
      await updateDoc(doc(db, 'fightCards', cardId), { [field]: value });
      setFightCards(fightCards.map(c => c.id === cardId ? { ...c, [field]: value } : c));
    } catch (e) { alert('Erreur modif'); }
  };

  // Vues conditionnelles
  if (view === 'DETAIL' && activeComp) {
    const compCards = fightCards.filter(fc => fc.compId === activeComp.id);
    const amIRegistered = compCards.some(fc => fc.userId === currentUser.id);

    return (
      <div className="p-4 pb-24 max-w-lg mx-auto space-y-6">
        <button onClick={() => setView('LIST')} className="text-slate-500 text-xs font-bold uppercase">&larr; Retour aux tournois</button>
        <div className="text-center bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-xl">
           <Trophy className="text-amber-500 mx-auto mb-2" size={32} />
           <h2 className="text-xl font-black text-white italic uppercase">{activeComp.name}</h2>
           <p className="text-xs text-slate-400 font-mono mt-1">{new Date(activeComp.date).toLocaleDateString('fr-FR')} - {activeComp.location}</p>
        </div>

        {isCompetitor && !amIRegistered && (
          <button onClick={handleRegisterMe} disabled={isLoading} className="w-full py-4 bg-amber-600 hover:bg-amber-500 text-white font-black text-xs uppercase rounded-xl shadow-lg shadow-amber-600/20 active:scale-95 transition-all">
            {isLoading ? 'TRAITEMENT...' : 'S\'inscrire à cette compétition'}
          </button>
        )}

        <div>
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-1 mb-3 flex items-center"><Swords size={12} className="mr-2 text-rose-500"/> Fight Cards ({compCards.length})</h3>
          {compCards.length === 0 && <p className="text-[10px] text-slate-500 font-mono text-center py-4">Aucun combattant S.M.G engagé pour le moment.</p>}
          
          <div className="space-y-3">
            {compCards.map(card => {
              const canEdit = isStaff || card.userId === currentUser.id;
              
              return (
                <div key={card.id} className={`p-3 rounded-xl border ${card.userId === currentUser.id ? 'bg-slate-900 border-amber-500/50' : 'bg-slate-950 border-slate-800'}`}>
                  <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-800/50">
                     <span className="font-bold text-sm text-slate-100">{card.userName}</span>
                     <span className="text-[9px] text-slate-500 font-mono">{card.weight}kg</span>
                  </div>
                  
                  {canEdit ? (
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[8px] text-slate-500 font-bold uppercase mb-1 block">Aire/Ring</label>
                        <input type="text" value={card.area} onChange={e => handleUpdateCard(card.id, 'area', e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-white outline-none focus:border-amber-500 text-center" placeholder="Ex: A" />
                      </div>
                      <div>
                        <label className="text-[8px] text-slate-500 font-bold uppercase mb-1 block">N° Combat</label>
                        <input type="number" value={card.matchNum} onChange={e => handleUpdateCard(card.id, 'matchNum', e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-white outline-none focus:border-amber-500 text-center" placeholder="N°" />
                      </div>
                      <div>
                        <label className="text-[8px] text-slate-500 font-bold uppercase mb-1 block">Coin/Casque</label>
                        <select value={card.headgear} onChange={e => handleUpdateCard(card.id, 'headgear', e.target.value)} className={`w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs outline-none focus:border-amber-500 ${card.headgear === 'Rouge' ? 'text-rose-500' : card.headgear === 'Bleu' ? 'text-cyan-500' : 'text-slate-400'}`}>
                          <option value="">-</option>
                          <option value="Rouge">Rouge</option>
                          <option value="Bleu">Bleu</option>
                        </select>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-around items-center bg-slate-900 p-2 rounded">
                      <div className="text-center"><span className="block text-[8px] text-slate-500 uppercase">Aire</span><span className="text-xs font-bold text-white">{card.area || '-'}</span></div>
                      <div className="text-center"><span className="block text-[8px] text-slate-500 uppercase">Combat</span><span className="text-xs font-bold text-white">{card.matchNum || '-'}</span></div>
                      <div className="text-center"><span className="block text-[8px] text-slate-500 uppercase">Casque</span><span className={`text-xs font-bold ${card.headgear==='Rouge'?'text-rose-500':card.headgear==='Bleu'?'text-cyan-500':'text-white'}`}>{card.headgear || '-'}</span></div>
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

  // VUE LISTE PAR DEFAUT
  return (
    <div className="p-4 pb-24 h-full flex flex-col max-w-lg mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
           <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase">Arène</h2>
           <span className="text-[10px] text-amber-500 font-mono uppercase tracking-widest leading-none">Compétitions S.M.G</span>
        </div>
        {isStaff && (
          <button onClick={() => setShowAddForm(!showAddComp)} className="bg-amber-500/20 text-amber-500 p-2 rounded-xl border border-amber-500/50">
            <Plus size={20} />
          </button>
        )}
      </div>

      {isStaff && showAddComp && (
        <FuturisticCard borderColor="slate" className="mb-6 animate-fade-in bg-slate-900/80">
          <form onSubmit={handleCreateComp} className="space-y-3">
            <input type="text" placeholder="Nom de l'Open / Championnat..." value={newCompName} onChange={e => setNewCompName(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-xs outline-none focus:border-amber-500" required />
            <div className="grid grid-cols-2 gap-3">
              <input type="date" value={newCompDate} onChange={e => setNewCompDate(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-xs outline-none focus:border-amber-500" required />
              <input type="text" placeholder="Ville..." value={newCompLoc} onChange={e => setNewCompLocation(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-xs outline-none focus:border-amber-500" required />
            </div>
            <button type="submit" disabled={isLoading} className="w-full bg-amber-600 text-slate-950 font-black py-2 rounded text-xs uppercase">Créer le Tournoi</button>
          </form>
        </FuturisticCard>
      )}

      <div className="flex-1 overflow-y-auto space-y-3">
        {isLoading && <p className="text-center text-amber-500 text-xs font-mono animate-pulse">RECHERCHE D'ÉVÉNEMENTS...</p>}
        {!isLoading && competitions.length === 0 && <p className="text-center text-slate-500 text-xs italic py-10">Aucune compétition active.</p>}
        
        {competitions.map(comp => (
          <FuturisticCard key={comp.id} borderColor="slate" className="cursor-pointer hover:border-amber-500/50 transition-colors group" >
            <div onClick={() => openComp(comp)} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-slate-900 rounded border border-slate-800"><Trophy size={16} className="text-amber-500" /></div>
                <div>
                  <h4 className="font-bold text-sm text-slate-100">{comp.name}</h4>
                  <p className="text-[10px] text-slate-500 font-mono">{new Date(comp.date).toLocaleDateString('fr-FR')} • {comp.location}</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-600 group-hover:text-amber-500" />
            </div>
          </FuturisticCard>
        ))}
      </div>
    </div>
  );
};
export default Tournament;
