
import React, { useState, useEffect, useMemo } from 'react';
import { INITIAL_MEMBERS, INITIAL_COMPETITIONS } from '../constants';
import { Fight, User, Competition, FightStage, CalendarEvent, Announcement } from '../types';
import FuturisticCard from '../components/ui/FuturisticCard';
// Added Lock and Unlock icons to fix the reference error on line 397
import { 
  Plus, Trash2, Hash, MapPin, Shield, AlertTriangle, 
  CheckCircle2, XCircle, Trophy, Zap, Award, Calendar as CalIcon, Scale,
  Lock, Unlock
} from 'lucide-react';

// Fonction utilitaire pour envoyer une notification système
const sendPushNotification = (title: string, body: string) => {
  if (!("Notification" in window)) return;
  
  if (Notification.permission === "granted") {
    new Notification(title, { body, icon: '/logo.png' });
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission().then(permission => {
      if (permission === "granted") {
        new Notification(title, { body, icon: '/logo.png' });
      }
    });
  }
};

interface TournamentProps {
  currentUser: User;
}

const Tournament: React.FC<TournamentProps> = ({ currentUser }) => {
  const isStaff = currentUser.role === 'Admin' || currentUser.role === 'Coach';
  const [activeTab, setActiveTab] = useState<'GESTION' | 'TIMELINE' | 'PALMARES' | 'PLANNING'>(isStaff ? 'GESTION' : 'TIMELINE');
  const [competitions, setCompetitions] = useState<Competition[]>(INITIAL_COMPETITIONS);
  const [selectedCompId, setSelectedCompId] = useState(INITIAL_COMPETITIONS[0].id);
  const [fights, setFights] = useState<Fight[]>([]);
  const [competitors, setCompetitors] = useState<User[]>([]);

  // Formulaire Planning
  const [newCompName, setNewCompName] = useState('');
  const [newCompDiscipline, setNewCompDiscipline] = useState('Kick-Boxing');
  const [newCompDate, setNewCompDate] = useState('');
  const [newCompLocation, setNewCompLocation] = useState('');
  const [weighInDayBefore, setWeighInDayBefore] = useState(false);

  const AREAS = Array.from({ length: 10 }, (_, i) => (i + 1).toString());

  useEffect(() => {
    const storedUsers = localStorage.getItem('smg_users');
    const localUsers = storedUsers ? JSON.parse(storedUsers) : [];
    const mappedInitial = INITIAL_MEMBERS.map(m => ({ id: m.id, name: m.name, category: m.category, role: 'Member' } as User));
    const allComps = [...mappedInitial, ...localUsers].filter((u, index, self) => 
      index === self.findIndex((t) => t.id === u.id) && (u.category === 'Compétiteur' || u.category === 'Pro')
    );
    setCompetitors(allComps);

    const storedFights = localStorage.getItem('smg_fights');
    if (storedFights) setFights(JSON.parse(storedFights));

    const storedComps = localStorage.getItem('smg_competitions');
    if (storedComps) {
      setCompetitions(JSON.parse(storedComps));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('smg_fights', JSON.stringify(fights));
  }, [fights]);

  const sortedCompetitions = useMemo(() => {
    return [...competitions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [competitions]);

  const handleAddCompetition = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompName || !newCompDate) return;

    const newComp: Competition = {
      id: Date.now().toString(),
      name: newCompName,
      discipline: newCompDiscipline,
      date: newCompDate,
      location: newCompLocation || 'Non précisé',
      weighInDayBefore: weighInDayBefore
    };

    const updatedComps = [...competitions, newComp];
    setCompetitions(updatedComps);
    localStorage.setItem('smg_competitions', JSON.stringify(updatedComps));

    // Ajouter à l'agenda auto
    const storedEvents = localStorage.getItem('smg_calendar_events');
    const currentEvents: CalendarEvent[] = storedEvents ? JSON.parse(storedEvents) : [];
    
    const competitionEvent: CalendarEvent = {
      id: `evt-${newComp.id}`,
      title: `${newCompDiscipline}: ${newCompName}`,
      date: newCompDate,
      type: 'Tournament',
      description: `Lieu: ${newCompLocation}`
    };

    let eventsToAdd = [competitionEvent];

    // Gérer la pesée la veille
    if (weighInDayBefore) {
       const compDate = new Date(newCompDate);
       compDate.setDate(compDate.getDate() - 1);
       const weighInDateStr = compDate.toISOString().split('T')[0];
       
       eventsToAdd.push({
          id: `weigh-${newComp.id}`,
          title: `PESÉE : ${newCompName}`,
          date: weighInDateStr,
          type: 'Tournament',
          description: `Pesée officielle la veille à ${newCompLocation}`
       });
    }

    localStorage.setItem('smg_calendar_events', JSON.stringify([...currentEvents, ...eventsToAdd]));

    // Ajouter aux annonces auto
    const storedAnns = localStorage.getItem('smg_announcements');
    const currentAnns: Announcement[] = storedAnns ? JSON.parse(storedAnns) : [];
    const newAnn: Announcement = {
      id: `ann-${newComp.id}`,
      title: `Nouvelle Compétition : ${newCompName}`,
      content: `Discipline: ${newCompDiscipline} | Date: ${new Date(newCompDate).toLocaleDateString()}${weighInDayBefore ? ' (Pesée la veille)' : ''} | Lieu: ${newCompLocation}. Préparez-vous !`,
      date: new Date().toLocaleDateString(),
      author: currentUser.name,
      priority: 'High'
    };
    localStorage.setItem('smg_announcements', JSON.stringify([...currentAnns, newAnn]));

    // NOTIFICATION PUSH
    sendPushNotification("Nouvelle Compétition !", `${newCompName} - ${newCompDiscipline} le ${new Date(newCompDate).toLocaleDateString()}`);

    setNewCompName('');
    setNewCompDate('');
    setNewCompLocation('');
    setWeighInDayBefore(false);
    alert('Compétition ajoutée et membres notifiés !');
  };

  const getAutoStage = (fighterId: string, currentFightId: string): FightStage => {
    const fighterFights = fights
      .filter(f => f.fighterId === fighterId && f.competitionId === selectedCompId)
      .sort((a, b) => a.fightNumber - b.fightNumber);
    
    const index = fighterFights.findIndex(f => f.id === currentFightId);
    const total = fighterFights.length;
    const reverseIndex = total - 1 - index;

    if (reverseIndex === 0) return 'Finale';
    if (reverseIndex === 1) return 'Demi-finale';
    if (reverseIndex === 2) return '1/4 de finale';
    if (reverseIndex === 3) return '1/8 de finale';
    return 'Eliminatoire';
  };

  const handleUpdateFight = (id: string, field: keyof Fight, value: any) => {
    let finalValue = value;
    if (field === 'fightNumber') finalValue = Math.floor(Number(value)) || 0;
    setFights(prev => prev.map(f => f.id === id ? { ...f, [field]: finalValue } : f));
  };

  const addFightForCompetitor = (fighter: User) => {
    const newFight: Fight = {
      id: Math.random().toString(36).substr(2, 9),
      fighterId: fighter.id,
      fighterName: fighter.name,
      competitionId: selectedCompId,
      fightNumber: 1,
      ring: '1',
      helmetColor: 'Inconnu',
      status: 'Pending',
      isLocked: false
    };
    setFights([...fights, newFight]);
  };

  const setFightResult = (id: string, result: 'Victoire' | 'Défaite') => {
    setFights(prev => prev.map(f => f.id === id ? { ...f, result, status: 'Finished' } : f));
  };

  const toggleLock = (id: string) => {
    setFights(prev => prev.map(f => f.id === id ? { ...f, isLocked: !f.isLocked } : f));
  };

  const liveFights = useMemo(() => 
    fights.filter(f => f.competitionId === selectedCompId && f.status !== 'Finished'), 
  [fights, selectedCompId]);

  const alerts = useMemo(() => {
    const conflicts: string[] = [];
    const preps: string[] = [];
    const byNum: Record<number, string[]> = {};
    liveFights.forEach(f => {
      if (f.fightNumber > 0) {
        if (!byNum[f.fightNumber]) byNum[f.fightNumber] = [];
        byNum[f.fightNumber].push(f.ring);
      }
    });
    Object.entries(byNum).forEach(([num, rings]) => {
      if (new Set(rings).size > 1) conflicts.push(`Conflit : Combats simultanés au n°${num} !`);
    });
    for (let i = 0; i < liveFights.length; i++) {
      for (let j = i + 1; j < liveFights.length; j++) {
        const f1 = liveFights[i];
        const f2 = liveFights[j];
        if (f1.fightNumber > 0 && f2.fightNumber > 0) {
          const diff = Math.abs(f1.fightNumber - f2.fightNumber);
          if (diff <= 3) preps.push(`${f1.fighterName.split(' ')[0]} (#${f1.fightNumber}) et ${f2.fighterName.split(' ')[0]} (#${f2.fightNumber}) se suivent !`);
        }
      }
    }
    return { conflicts: [...new Set(conflicts)], preps: [...new Set(preps)] };
  }, [liveFights]);

  const palmares = useMemo(() => {
    const finished = fights.filter(f => f.competitionId === selectedCompId && f.status === 'Finished');
    const stats: Record<string, {name: string, gold: number, silver: number, bronze: number, total: number}> = {};
    finished.forEach(f => {
      const stage = getAutoStage(f.fighterId, f.id);
      if (!stats[f.fighterId]) stats[f.fighterId] = { name: f.fighterName, gold: 0, silver: 0, bronze: 0, total: 0 };
      stats[f.fighterId].total++;
      if (f.result === 'Victoire') {
        if (stage === 'Finale') stats[f.fighterId].gold++;
      } else {
        if (stage === 'Finale') stats[f.fighterId].silver++;
        else if (stage === 'Demi-finale') stats[f.fighterId].bronze++;
      }
    });
    return Object.values(stats).sort((a, b) => b.gold - a.gold || b.silver - a.silver);
  }, [fights, selectedCompId]);

  return (
    <div className="p-4 pb-24 h-full flex flex-col max-w-lg mx-auto">
      {/* HEADER & SELECTOR */}
      <div className="flex justify-between items-center mb-6">
        <div>
           <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase">Arena</h2>
           <div className="flex items-center space-x-2">
             <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
             <span className="text-[10px] text-slate-400 font-mono uppercase tracking-widest leading-none">Live System v2.3</span>
           </div>
        </div>
        <select 
          value={selectedCompId} 
          onChange={(e) => setSelectedCompId(e.target.value)}
          className="bg-slate-900 text-xs text-cyan-400 font-bold p-2 rounded-xl border border-slate-800 outline-none max-w-[140px] shadow-lg"
        >
          {sortedCompetitions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* ALERTES SECTION */}
      {(alerts.conflicts.length > 0 || alerts.preps.length > 0) && activeTab === 'TIMELINE' && (
        <div className="mb-6 space-y-2">
           {alerts.conflicts.map((m, i) => (
             <div key={i} className="bg-rose-600 text-white text-[10px] font-black p-2 rounded-lg flex items-center shadow-lg italic">
               <AlertTriangle size={14} className="mr-2 shrink-0" /> {m.toUpperCase()}
             </div>
           ))}
           {alerts.preps.map((m, i) => (
             <div key={i} className="bg-amber-500 text-slate-950 text-[10px] font-black p-2 rounded-lg flex items-center shadow-lg italic">
               <Zap size={14} className="mr-2 shrink-0" /> {m.toUpperCase()}
             </div>
           ))}
        </div>
      )}

      {/* TABS NAVIGATION */}
      <div className="flex space-x-1 mb-6 bg-slate-950/50 p-1 rounded-2xl border border-slate-800 overflow-x-auto">
        {isStaff && (
          <button onClick={() => setActiveTab('PLANNING')} className={`flex-1 min-w-[80px] py-2.5 text-[9px] font-black rounded-xl transition-all ${activeTab === 'PLANNING' ? 'bg-purple-600 text-white shadow-xl' : 'text-slate-500'}`}>
            PLANNING
          </button>
        )}
        {isStaff && (
          <button onClick={() => setActiveTab('GESTION')} className={`flex-1 min-w-[80px] py-2.5 text-[9px] font-black rounded-xl transition-all ${activeTab === 'GESTION' ? 'bg-slate-100 text-slate-950 shadow-xl' : 'text-slate-500'}`}>
            GESTION
          </button>
        )}
        <button onClick={() => setActiveTab('TIMELINE')} className={`flex-1 min-w-[80px] py-2.5 text-[9px] font-black rounded-xl transition-all ${activeTab === 'TIMELINE' ? 'bg-cyan-600 text-white shadow-xl' : 'text-slate-500'}`}>
          TIMELINE
        </button>
        <button onClick={() => setActiveTab('PALMARES')} className={`flex-1 min-w-[80px] py-2.5 text-[9px] font-black rounded-xl transition-all ${activeTab === 'PALMARES' ? 'bg-amber-500 text-slate-950 shadow-xl' : 'text-slate-500'}`}>
          PALMARÈS
        </button>
      </div>

      {/* CONTENU : PLANNING */}
      {activeTab === 'PLANNING' && isStaff && (
        <div className="space-y-6 animate-fade-in">
           <FuturisticCard title="PLANIFIER TOURNOI" borderColor="cyan">
              <form onSubmit={handleAddCompetition} className="space-y-4">
                 <div>
                    <label className="text-[9px] text-slate-500 font-black mb-1 block uppercase">Nom de l'événement</label>
                    <input type="text" value={newCompName} onChange={e => setNewCompName(e.target.value)} placeholder="ex: Championnat de France" className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white" required />
                 </div>
                 <div className="grid grid-cols-2 gap-2">
                    <div>
                       <label className="text-[9px] text-slate-500 font-black mb-1 block uppercase">Discipline</label>
                       <select value={newCompDiscipline} onChange={e => setNewCompDiscipline(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white outline-none">
                          <option>Kick-Boxing</option>
                          <option>K1-Rules</option>
                          <option>Full Contact</option>
                          <option>Light Contact</option>
                          <option>Kick Light</option>
                       </select>
                    </div>
                    <div>
                       <label className="text-[9px] text-slate-500 font-black mb-1 block uppercase">Date</label>
                       <input type="date" value={newCompDate} onChange={e => setNewCompDate(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white" required />
                    </div>
                 </div>
                 <div>
                    <label className="text-[9px] text-slate-500 font-black mb-1 block uppercase">Lieu</label>
                    <input type="text" value={newCompLocation} onChange={e => setNewCompLocation(e.target.value)} placeholder="Ville, Gymnase..." className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white" />
                 </div>
                 
                 <div className="flex items-center space-x-3 bg-slate-950 border border-slate-800 p-3 rounded-xl">
                    <Scale size={18} className="text-cyan-400" />
                    <div className="flex-1">
                       <span className="text-[10px] font-black text-slate-100 block uppercase italic">Pesée officielle la veille</span>
                       <span className="text-[8px] text-slate-500 font-mono uppercase">Ajoute automatiquement l'événement à J-1</span>
                    </div>
                    <button type="button" onClick={() => setWeighInDayBefore(!weighInDayBefore)} className={`w-10 h-5 rounded-full p-1 transition-colors ${weighInDayBefore ? 'bg-cyan-600' : 'bg-slate-800'}`}>
                      <div className={`w-3 h-3 bg-white rounded-full transition-transform ${weighInDayBefore ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                 </div>

                 <button type="submit" className="w-full bg-cyan-600 text-white font-black py-3 rounded-xl shadow-lg shadow-cyan-900/20 active:scale-95 transition-all text-xs uppercase italic">Valider & Notifier le club</button>
              </form>
           </FuturisticCard>

           <div className="space-y-3">
              <h4 className="text-[10px] text-slate-400 font-mono tracking-widest uppercase mb-2 px-1">Historique / Planning</h4>
              {sortedCompetitions.map(c => (
                <div key={c.id} className="bg-slate-900/50 border border-slate-800 p-3 rounded-xl flex items-center justify-between">
                   <div>
                      <div className="text-xs font-black text-white italic leading-tight">{c.name}</div>
                      <div className="text-[9px] text-slate-500 font-mono uppercase mt-1">
                         {new Date(c.date).toLocaleDateString()} • {c.discipline}
                         {c.weighInDayBefore && <span className="text-cyan-600 ml-2"> + Pesée J-1</span>}
                      </div>
                   </div>
                   <button onClick={() => {
                     if(confirm('Supprimer cette compétition ?')) {
                       const filtered = competitions.filter(comp => comp.id !== c.id);
                       setCompetitions(filtered);
                       localStorage.setItem('smg_competitions', JSON.stringify(filtered));
                     }
                   }} className="text-slate-600 hover:text-rose-500 p-2 transition-colors">
                      <Trash2 size={14} />
                   </button>
                </div>
              ))}
           </div>
        </div>
      )}

      {/* CONTENU : GESTION */}
      {activeTab === 'GESTION' && isStaff && (
        <div className="space-y-8 animate-fade-in">
          {competitors.map(competitor => {
            const compFights = fights.filter(f => f.competitionId === selectedCompId && f.fighterId === competitor.id);
            return (
              <div key={competitor.id} className="space-y-4">
                <div className="flex justify-between items-end border-b border-slate-800 pb-2 px-1">
                   <div className="flex flex-col">
                      <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest leading-none mb-1">Fighter Profile</span>
                      <h3 className="text-lg font-black text-white italic tracking-tighter uppercase">{competitor.name}</h3>
                   </div>
                   <button onClick={() => addFightForCompetitor(competitor)} className="bg-cyan-600 text-white p-2 rounded-xl shadow-lg active:scale-90">
                     <Plus size={20} />
                   </button>
                </div>
                <div className="grid gap-3">
                  {compFights.sort((a,b) => a.fightNumber - b.fightNumber).map((fight) => {
                    const stage = getAutoStage(competitor.id, fight.id);
                    return (
                      <FuturisticCard key={fight.id} borderColor={fight.isLocked ? 'slate' : 'cyan'} className={`${fight.status === 'Finished' ? 'opacity-40 grayscale' : ''}`}>
                         <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center space-x-2">
                               <div className="bg-slate-950 px-2 py-1 rounded border border-slate-800 flex items-center">
                                  <Hash size={12} className="text-rose-500 mr-1"/>
                                  <span className="text-[11px] font-black text-white">{fight.fightNumber || '??'}</span>
                               </div>
                               <div className="bg-slate-950 px-2 py-1 rounded border border-slate-800 flex items-center">
                                  <MapPin size={12} className="text-cyan-400 mr-1"/>
                                  <span className="text-[11px] font-black text-white">AIRE {fight.ring}</span>
                               </div>
                            </div>
                            <div className="flex items-center space-x-1">
                               <button onClick={() => toggleLock(fight.id)} className={`p-1.5 rounded ${fight.isLocked ? 'text-green-500' : 'text-slate-600'}`}>
                                 {fight.isLocked ? <Lock size={16}/> : <Unlock size={16}/>}
                               </button>
                               {!fight.isLocked && <button onClick={() => setFights(prev => prev.filter(f => f.id !== fight.id))} className="p-1.5 text-rose-500"><Trash2 size={16}/></button>}
                            </div>
                         </div>
                         <div className="flex justify-between items-center">
                            <div className="flex flex-col">
                               <span className={`text-xl font-black italic tracking-tighter leading-none mb-1 ${fight.helmetColor === 'Rouge' ? 'text-rose-500' : fight.helmetColor === 'Bleu' ? 'text-cyan-400' : 'text-slate-100'}`}>
                                 {fight.fighterName}
                               </span>
                               <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{stage}</span>
                            </div>
                            {fight.status !== 'Finished' && !fight.isLocked ? (
                              <div className="flex flex-col items-end gap-2">
                                 <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
                                   <button onClick={() => handleUpdateFight(fight.id, 'helmetColor', 'Rouge')} className={`px-2 py-1 rounded text-[9px] font-black ${fight.helmetColor === 'Rouge' ? 'bg-rose-600 text-white' : 'text-slate-600'}`}>R</button>
                                   <button onClick={() => handleUpdateFight(fight.id, 'helmetColor', 'Bleu')} className={`px-2 py-1 rounded text-[9px] font-black ${fight.helmetColor === 'Bleu' ? 'bg-cyan-600 text-white' : 'text-slate-600'}`}>B</button>
                                 </div>
                                 <div className="flex gap-1">
                                    <input type="number" step="1" min="1" placeholder="#" value={fight.fightNumber} onChange={e => handleUpdateFight(fight.id, 'fightNumber', e.target.value)} className="w-12 bg-slate-950 border border-slate-700 rounded p-1 text-[10px] text-white text-center font-bold"/>
                                    <select value={fight.ring} onChange={e => handleUpdateFight(fight.id, 'ring', e.target.value)} className="w-16 bg-slate-950 border border-slate-700 rounded p-1 text-[10px] text-white text-center font-bold outline-none">
                                       {AREAS.map(num => <option key={num} value={num}>A.{num}</option>)}
                                    </select>
                                 </div>
                              </div>
                            ) : fight.status !== 'Finished' ? (
                               <div className="flex gap-2">
                                  <button onClick={() => setFightResult(fight.id, 'Victoire')} className="bg-green-600 text-white p-2 rounded-xl shadow-lg active:scale-90"><CheckCircle2 size={18}/></button>
                                  <button onClick={() => setFightResult(fight.id, 'Défaite')} className="bg-rose-600 text-white p-2 rounded-xl shadow-lg active:scale-90"><XCircle size={18}/></button>
                               </div>
                            ) : (
                               <div className={`px-3 py-1 rounded-lg font-black text-[10px] italic shadow-lg ${fight.result === 'Victoire' ? 'bg-green-600 text-white' : 'bg-rose-600 text-white'}`}>
                                 {fight.result?.toUpperCase()}
                               </div>
                            )}
                         </div>
                      </FuturisticCard>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TIMELINE */}
      {activeTab === 'TIMELINE' && (
        <div className="space-y-10 animate-fade-in">
          {AREAS.map(ringNum => {
            const ringFights = liveFights.filter(f => f.ring === ringNum).sort((a,b) => a.fightNumber - b.fightNumber);
            if (ringFights.length === 0) return null;
            return (
              <div key={ringNum} className="space-y-4">
                 <div className="flex items-center justify-between border-b border-slate-800 pb-2 px-1">
                    <h3 className="text-sm font-black text-cyan-400 italic flex items-center uppercase">
                       <MapPin size={16} className="mr-2"/> AIRE {ringNum}
                    </h3>
                    <span className="text-[10px] text-slate-500 font-mono uppercase tracking-tighter">{ringFights.length} EN ATTENTE</span>
                 </div>
                 <div className="space-y-4">
                    {ringFights.map(fight => {
                      const stage = getAutoStage(fight.fighterId, fight.id);
                      return (
                        <div key={fight.id} className={`relative flex items-center p-4 bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl ${fight.helmetColor === 'Rouge' ? 'border-rose-500/20' : 'border-cyan-500/20'}`}>
                           <div className={`absolute top-0 left-0 w-1 h-full ${fight.helmetColor === 'Rouge' ? 'bg-rose-600' : fight.helmetColor === 'Bleu' ? 'bg-cyan-500' : 'bg-slate-700'}`}></div>
                           <div className="w-14 h-14 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col items-center justify-center mr-4 shrink-0 shadow-inner">
                              <span className="text-[9px] text-slate-500 font-black">N°</span>
                              <span className="text-xl font-black text-white leading-none">{fight.fightNumber}</span>
                           </div>
                           <div className="flex-1">
                              <h4 className={`text-xl font-black italic tracking-tighter leading-none mb-1 ${fight.helmetColor === 'Rouge' ? 'text-rose-500' : fight.helmetColor === 'Bleu' ? 'text-cyan-400' : 'text-slate-100'}`}>
                                {fight.fighterName}
                              </h4>
                              <div className="flex items-center space-x-2">
                                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{stage}</span>
                                 <span className={`text-[8px] px-1.5 py-0.5 rounded font-black border ${fight.helmetColor === 'Rouge' ? 'border-rose-500 text-rose-500' : 'border-cyan-500 text-cyan-400'}`}>COIN {fight.helmetColor.toUpperCase()}</span>
                              </div>
                           </div>
                           {currentUser.id === fight.fighterId && <div className="bg-cyan-500/10 p-2 rounded-2xl animate-pulse border border-cyan-500/30"><Shield size={24} className="text-cyan-400" /></div>}
                        </div>
                      );
                    })}
                 </div>
              </div>
            );
          })}
          {liveFights.length === 0 && <div className="flex flex-col items-center justify-center py-20 text-slate-600 opacity-30"><Trophy size={64} className="mb-4" /><p className="font-black italic uppercase tracking-widest">Arena Vide</p></div>}
        </div>
      )}

      {/* PALMARES */}
      {activeTab === 'PALMARES' && (
        <div className="space-y-6 animate-fade-in">
           <div className="flex items-center space-x-3 mb-6 px-1">
              <div className="bg-amber-500/20 p-3 rounded-2xl border border-amber-500/30"><Award size={24} className="text-amber-500" /></div>
              <h3 className="text-xl font-black text-white italic tracking-tighter uppercase">Résultats Club</h3>
           </div>
           <div className="grid gap-4">
              {palmares.map((p, i) => (
                <FuturisticCard key={i} borderColor={p.gold > 0 ? 'cyan' : 'slate'} className="bg-slate-950/40">
                   <div className="flex justify-between items-center">
                      <div>
                         <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest block mb-1">Champion Profile</span>
                         <h4 className="text-lg font-black text-white italic tracking-tighter uppercase leading-none">{p.name}</h4>
                         <div className="flex gap-3 mt-3">
                            {p.gold > 0 && <div className="flex items-center space-x-1 bg-yellow-500/10 border border-yellow-500/50 rounded-full px-2.5 py-1"><div className="w-2 h-2 rounded-full bg-yellow-500 shadow-[0_0_8px_#eab308] animate-pulse"/><span className="text-[9px] font-black text-yellow-500 uppercase">Or</span></div>}
                            {p.silver > 0 && <div className="flex items-center space-x-1 bg-slate-400/10 border border-slate-400/50 rounded-full px-2.5 py-1"><div className="w-2 h-2 rounded-full bg-slate-300"/><span className="text-[9px] font-black text-slate-300 uppercase">Argent</span></div>}
                            {p.bronze > 0 && <div className="flex items-center space-x-1 bg-amber-700/10 border border-amber-700/50 rounded-full px-2.5 py-1"><div className="w-2 h-2 rounded-full bg-amber-700"/><span className="text-[9px] font-black text-amber-700 uppercase">Bronze</span></div>}
                         </div>
                      </div>
                      <div className="text-right flex flex-col justify-center items-end bg-slate-900 p-3 rounded-2xl border border-slate-800 shadow-xl">
                         <span className="text-[9px] text-slate-500 font-black uppercase mb-1">Victoires</span>
                         <span className="text-2xl font-black text-white leading-none italic">{p.total - p.silver - p.bronze}</span>
                      </div>
                   </div>
                </FuturisticCard>
              ))}
              {palmares.length === 0 && <p className="text-center py-20 text-slate-600 text-xs italic">En attente des premiers résultats...</p>}
           </div>
        </div>
      )}
    </div>
  );
};

export default Tournament;
