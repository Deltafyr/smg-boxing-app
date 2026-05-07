import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Trophy, Medal, Star, ChevronDown, ChevronUp, Calendar as CalendarIcon, Bell, Timer, Swords, BookOpen, Activity } from 'lucide-react';
import { User } from '../../types';

export default function Dashboard(props: any) {
  const { currentUser } = props;
  const [showPalmares, setShowPalmares] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [dbPalmares, setDbPalmares] = useState<any[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [isLoadingPalmares, setIsLoadingPalmares] = useState(true);

  // LOGIQUE DE NAVIGATION (Abstraction des props pour compatibilité maximale)
  const handleNav = (target: string) => {
    if (props.setView) props.setView(target);
    else if (props.setCurrentView) props.setCurrentView(target);
    else if (props.setActiveTab) props.setActiveTab(target);
    else if (props.setTab) props.setTab(target);
    else if (props.navigate) props.navigate(target);
    else if (props.onNavigate) props.onNavigate(target);
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoadingEvents(true);
      setIsLoadingPalmares(true);
      try {
        // 1. FETCH AGENDA (Prochains événements)
        const qAgenda = query(collection(db, 'agenda'), orderBy('date', 'asc'));
        const snapAgenda = await getDocs(qAgenda);
        const today = new Date();
        today.setHours(0,0,0,0);
        const loadedEvents: any[] = [];
        snapAgenda.forEach(d => {
          const data = d.data();
          if (new Date(data.date) >= today) loadedEvents.push({ id: d.id, ...data });
        });
        setEvents(loadedEvents.slice(0, 3));

        // 2. FETCH PALMARES (Les 15 derniers titres du club)
        // On récupère les médailles archivées lors des tournois
        const qPalmares = query(collection(db, 'palmares'), orderBy('date', 'desc'), limit(15));
        const snapPalmares = await getDocs(qPalmares);
        const loadedPalmares: any[] = [];
        snapPalmares.forEach(d => loadedPalmares.push({ id: d.id, ...d.data() }));
        setDbPalmares(loadedPalmares);

      } catch(e) {
        console.error("[CORTEX ERROR] Echec synchro Dashboard:", e);
      }
      setIsLoadingEvents(false);
      setIsLoadingPalmares(false);
    };

    fetchDashboardData();
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
             <Bell size={14} className="mr-2" /> Flash Infos
           </h3>
           <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/50 border-l-2 border-l-cyan-500">
             <p className="text-sm font-bold text-slate-200 mb-1">Système Albedo v43.2</p>
             <p className="text-[10px] text-slate-400 leading-relaxed">Le Cortex de scanning FFKMDA est désormais piloté par nos serveurs Serverless pour une stabilité maximale.</p>
           </div>
        </div>

        {/* RACCOURCIS RAPIDES */}
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => handleNav('TIMER')} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center text-center shadow-lg hover:bg-slate-800 transition-colors">
            <Timer size={24} className="text-rose-500 mb-2" />
            <span className="text-[10px] font-black text-white uppercase tracking-widest">Chrono</span>
          </button>
          <button onClick={() => handleNav('AGENDA')} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center text-center shadow-lg hover:bg-slate-800 transition-colors">
            <CalendarIcon size={24} className="text-cyan-500 mb-2" />
            <span className="text-[10px] font-black text-white uppercase tracking-widest">Agenda</span>
          </button>
          <button onClick={() => handleNav('TOURNAMENT')} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center text-center shadow-lg hover:bg-slate-800 transition-colors">
            <Swords size={24} className="text-amber-500 mb-2" />
            <span className="text-[10px] font-black text-white uppercase tracking-widest">Arène</span>
          </button>
          <button onClick={() => handleNav('COURSES')} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center text-center shadow-lg hover:bg-slate-800 transition-colors">
            <BookOpen size={24} className="text-emerald-500 mb-2" />
            <span className="text-[10px] font-black text-white uppercase tracking-widest">Cours</span>
          </button>
        </div>

        {/* WIDGET AGENDA */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center mb-4 border-b border-slate-800 pb-2">
            <CalendarIcon size={14} className="mr-2" /> Agenda Live
          </h3>
          <div className="space-y-3">
            {isLoadingEvents ? (
               <Activity className="text-cyan-500 animate-spin mx-auto py-2" size={20} />
            ) : events.length === 0 ? (
               <p className="text-center text-slate-500 text-[10px] font-mono py-2">Aucun événement.</p>
            ) : (
              events.map(ev => (
                <div key={ev.id} className="bg-slate-950 p-3 rounded-lg border border-slate-800/50">
                   <span className={`text-[8px] font-black uppercase border px-1.5 py-0.5 rounded ${getTypeColor(ev.type)}`}>{ev.type}</span>
                   <h4 className="text-xs font-bold text-white mt-1.5">{ev.title}</h4>
                   <p className="text-[9px] text-slate-500 font-mono mt-0.5">{new Date(ev.date).toLocaleDateString('fr-FR')} {ev.time && `• ${ev.time}`}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ACCORDÉON PALMARÈS DYNAMIQUE */}
        <button
          onClick={() => setShowPalmares(!showPalmares)}
          className={`w-full p-4 rounded-xl border flex items-center justify-between transition-all shadow-lg ${showPalmares ? 'bg-amber-950 border-amber-500/50 text-amber-500' : 'bg-slate-900 border-slate-800 text-white'}`}
        >
          <div className="flex items-center font-black uppercase tracking-widest text-sm">
            <Trophy size={18} className="mr-3" /> Palmarès S.M.G
          </div>
          {showPalmares ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>

        {showPalmares && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg animate-fade-in">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-2 mb-4">Dernières Réussites</h3>
            <div className="space-y-3">
              {isLoadingPalmares ? (
                <Activity className="text-amber-500 animate-spin mx-auto" size={20} />
              ) : dbPalmares.length === 0 ? (
                <p className="text-center text-slate-500 text-[10px] font-mono">Le palmarès est vide.</p>
              ) : (
                dbPalmares.map((p, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-slate-950 p-3 rounded-lg border border-slate-800/50">
                    <div className="flex items-center">
                      <Medal size={20} className={`mr-3 ${p.medal === 'Or' ? 'text-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.4)]' : p.medal === 'Argent' ? 'text-slate-300' : 'text-amber-700'}`} />
                      <div className="min-w-0">
                        <h4 className="text-sm font-black text-white uppercase truncate">{p.userName}</h4>
                        <p className="text-[9px] text-slate-500 font-mono truncate">{p.competitionName}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-slate-600">{new Date(p.date).getFullYear()}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}