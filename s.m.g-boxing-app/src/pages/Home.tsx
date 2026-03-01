import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Trophy, Medal, Star, ChevronDown, ChevronUp, Calendar as CalendarIcon, Clock, Bell, Timer, Swords } from 'lucide-react';
import { User } from '../types';

export default function Dashboard(props: any) {
  const { currentUser } = props;
  const [showPalmares, setShowPalmares] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);

  const palmaresData = [
    { comp: 'Championnat de France 2026', date: '2026-02-21', name: 'Méline', medal: 'Or', iconColor: 'text-yellow-400', shadow: 'shadow-[0_0_8px_rgba(250,204,21,0.6)]' },
    { comp: 'Championnat de France 2026', date: '2026-02-21', name: 'Pauline', medal: 'Bronze', iconColor: 'text-amber-700', shadow: 'shadow-[0_0_8px_rgba(180,83,9,0.6)]' },
    { comp: 'Championnat de France 2026', date: '2026-02-21', name: 'Armand', medal: 'Bronze', iconColor: 'text-amber-700', shadow: 'shadow-[0_0_8px_rgba(180,83,9,0.6)]' },
    { comp: 'Championnat Régional AURA 2025', date: '2025-11-22', name: 'Pauline', medal: 'Or', iconColor: 'text-yellow-400', shadow: 'shadow-[0_0_8px_rgba(250,204,21,0.6)]' },
    { comp: 'Championnat Régional AURA 2025', date: '2025-11-22', name: 'Méline', medal: 'Or', iconColor: 'text-yellow-400', shadow: 'shadow-[0_0_8px_rgba(250,204,21,0.6)]' },
    { comp: 'Championnat Régional AURA 2025', date: '2025-11-22', name: 'Maevan', medal: 'Or', iconColor: 'text-yellow-400', shadow: 'shadow-[0_0_8px_rgba(250,204,21,0.6)]' },
    { comp: 'Championnat Régional AURA 2025', date: '2025-11-22', name: 'Armand', medal: 'Or', iconColor: 'text-yellow-400', shadow: 'shadow-[0_0_8px_rgba(250,204,21,0.6)]' },
    { comp: 'Championnat Régional AURA 2025', date: '2025-11-22', name: 'Axel', medal: 'Argent', iconColor: 'text-slate-300', shadow: 'shadow-[0_0_8px_rgba(203,213,225,0.6)]' },
    { comp: 'Championnat Régional AURA 2025', date: '2025-11-22', name: 'Benjamin', medal: 'Bronze', iconColor: 'text-amber-700', shadow: 'shadow-[0_0_8px_rgba(180,83,9,0.6)]' },
    { comp: 'Championnat Régional AURA 2025', date: '2025-11-22', name: 'Lucas', medal: 'Bronze', iconColor: 'text-amber-700', shadow: 'shadow-[0_0_8px_rgba(180,83,9,0.6)]' },
    { comp: 'Champion Régional AURA 2025', date: '2025-11-22', name: 'Elise', medal: 'Bronze', iconColor: 'text-amber-700', shadow: 'shadow-[0_0_8px_rgba(180,83,9,0.6)]' },
    { comp: 'Championnat Régional AURA 2025', date: '2025-11-22', name: 'Nicolas', medal: 'Bronze', iconColor: 'text-amber-700', shadow: 'shadow-[0_0_8px_rgba(180,83,9,0.6)]' },
    { comp: 'Championnat Régional AURA 2025', date: '2025-11-22', name: 'Julien', medal: 'Bronze', iconColor: 'text-amber-700', shadow: 'shadow-[0_0_8px_rgba(180,83,9,0.6)]' }
  ];

  useEffect(() => {
    const fetchAgenda = async () => {
      setIsLoadingEvents(true);
      try {
        const snap = await getDocs(collection(db, 'agenda'));
        const today = new Date();
        today.setHours(0,0,0,0);
        const loaded: any[] = [];
        snap.forEach(d => {
          const data = d.data();
          const eDate = new Date(data.date);
          eDate.setHours(0,0,0,0);
          if (eDate >= today) loaded.push({ id: d.id, ...data });
        });
        setEvents(loaded.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 3));
      } catch(e) { console.error(e); }
      setIsLoadingEvents(false);
    };
    fetchAgenda();
  }, []);

  const getTypeColor = (t: string) => {
    switch(t) {
      case 'Compétition': return 'text-rose-500 border-rose-500/30 bg-rose-500/10';
      case 'Stage': return 'text-amber-500 border-amber-500/30 bg-amber-500/10';
      case 'Anniversaire': return 'text-purple-500 border-purple-500/30 bg-purple-500/10';
      case 'Entraînement': return 'text-emerald-500 border-emerald-500/30 bg-emerald-500/10';
      default: return 'text-cyan-500 border-cyan-500/30 bg-cyan-500/10';
    }
  };

  const handleNav = (target: string) => {
    if (props.setView) props.setView(target);
    else if (props.setCurrentView) props.setCurrentView(target);
    else if (props.setActiveTab) props.setActiveTab(target);
    else if (props.setTab) props.setTab(target);
    else if (props.navigate) props.navigate(target);
    else if (props.onNavigate) props.onNavigate(target);
    else {
      const navButtons = document.querySelectorAll('nav button, div[class*="bottom"] button');
      navButtons.forEach((btn: any) => {
        const text = btn.innerText.toLowerCase();
        if (target === 'TIMER' && (text.includes('chrono') || text.includes('timer'))) btn.click();
        if (target === 'AGENDA' && (text.includes('agenda') || text.includes('calend'))) btn.click();
        if (target === 'TOURNAMENT' && (text.includes('arène') || text.includes('tournoi') || text.includes('compét'))) btn.click();
      });
    }
  };

  return (
    <div style={{ height: '100vh', overflowY: 'auto', paddingBottom: '150px' }} className="w-full px-4 pt-4">
      <div className="max-w-lg mx-auto space-y-6">
        
        {/* HEADER */}
        <div className="flex justify-between items-center bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
          <div>
            <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">Accueil</h2>
            <span className="text-[10px] text-cyan-500 font-mono uppercase tracking-widest leading-none">Quartier Général S.M.G</span>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-white uppercase">{currentUser?.name}</p>
            <p className="text-[9px] text-slate-500 font-mono uppercase">{currentUser?.role}</p>
          </div>
        </div>

        {/* ANNONCES DU CLUB */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg relative overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
           <h3 className="text-xs font-black text-cyan-500 uppercase tracking-widest flex items-center mb-3">
             <Bell size={14} className="mr-2" /> Annonces du Club
           </h3>
           <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/50 border-l-2 border-l-cyan-500">
             <p className="text-sm font-bold text-slate-200 mb-1">Système Opérationnel</p>
             <p className="text-[10px] text-slate-400 leading-relaxed">Bienvenue sur le Cortex de la S.M.G. Défilement corrigé, profils membres intégrés et rôles sécurisés.</p>
           </div>
        </div>

        {/* RACCOURCIS RAPIDES (3 BOUTONS) */}
        <div className="grid grid-cols-3 gap-3">
          <button onClick={() => handleNav('TIMER')} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center text-center shadow-lg hover:bg-slate-800 transition-colors focus:outline-none">
            <Timer size={24} className="text-rose-500 mb-2" />
            <span className="text-[10px] font-black text-white uppercase tracking-widest">Chrono</span>
          </button>
          <button onClick={() => handleNav('AGENDA')} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center text-center shadow-lg hover:bg-slate-800 transition-colors focus:outline-none">
            <CalendarIcon size={24} className="text-cyan-500 mb-2" />
            <span className="text-[10px] font-black text-white uppercase tracking-widest">Agenda</span>
          </button>
          <button onClick={() => handleNav('TOURNAMENT')} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center text-center shadow-lg hover:bg-slate-800 transition-colors focus:outline-none">
            <Swords size={24} className="text-amber-500 mb-2" />
            <span className="text-[10px] font-black text-white uppercase tracking-widest">Arène</span>
          </button>
        </div>

        {/* WIDGET AGENDA */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center mb-4 border-b border-slate-800 pb-2">
            <CalendarIcon size={14} className="mr-2" /> Prochains Événements
          </h3>
          <div className="space-y-3">
            {isLoadingEvents ? (
               <p className="text-center text-cyan-500 text-[10px] font-mono animate-pulse py-4">Chargement...</p>
            ) : events.length === 0 ? (
               <p className="text-center text-slate-500 text-[10px] font-mono py-4">Aucun événement prévu.</p>
            ) : (
              events.map(ev => (
                <div key={ev.id} className="flex items-center justify-between bg-slate-950 p-3 rounded-lg border border-slate-800/50">
                   <div>
                     <span className={`text-[8px] font-black uppercase border px-1.5 py-0.5 rounded ${getTypeColor(ev.type)}`}>{ev.type}</span>
                     <h4 className="text-xs font-bold text-white mt-1.5">{ev.title}</h4>
                     <p className="text-[9px] text-slate-500 font-mono mt-0.5 flex items-center"><CalendarIcon size={8} className="mr-1"/> {new Date(ev.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })} {ev.time && `• ${ev.time}`}</p>
                   </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* BOUTON PALMARÈS */}
        <button 
          onClick={() => setShowPalmares(!showPalmares)}
          className={`w-full p-4 rounded-xl border flex items-center justify-between transition-all shadow-lg focus:outline-none ${showPalmares ? 'bg-amber-950 border-amber-500/50 text-amber-500' : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-white'}`}
        >
          <div className="flex items-center font-black uppercase tracking-widest text-sm">
            <Trophy size={18} className="mr-3" />
            Palmarès du Club
          </div>
          {showPalmares ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>

        {/* LISTE DU PALMARÈS DEROULANTE */}
        {showPalmares && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg animate-fade-in">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-2 mb-4 flex items-center">
              <Star size={14} className="mr-2"/> Champions S.M.G
            </h3>
            
            <div className="space-y-3">
              {palmaresData.map((p, idx) => (
                <div key={idx} className="flex items-center justify-between bg-slate-950 p-3 rounded-lg border border-slate-800/50">
                  <div className="shrink-0 mr-4 flex items-center justify-center w-10 h-10 rounded-full bg-slate-900 shadow-inner">
                     <Medal size={20} className={`${p.iconColor} ${p.shadow}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-black text-white uppercase tracking-wider truncate">{p.name}</h4>
                    <p className="text-[10px] text-slate-500 font-mono truncate">{p.comp} • {p.date.split('-')[0]}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}