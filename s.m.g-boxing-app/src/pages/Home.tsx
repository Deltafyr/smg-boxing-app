import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { User } from '../../types';
import { Trophy, Calendar as CalendarIcon, Medal, Star, Activity, Clock } from 'lucide-react';

export default function Dashboard({ currentUser }: { currentUser: User }) {
  const [events, setEvents] = useState<any[]>([]);
  const [palmares, setPalmares] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        // Fetch Agenda
        const qAgenda = collection(db, 'agenda');
        const snapAgenda = await getDocs(qAgenda);
        const today = new Date();
        today.setHours(0,0,0,0);
        const loadedEvents: any[] = [];
        snapAgenda.forEach(d => {
          const data = d.data();
          const eventDate = new Date(data.date);
          eventDate.setHours(0,0,0,0);
          if (eventDate >= today) loadedEvents.push({ id: d.id, ...data });
        });
        // 3 prochains événements
        setEvents(loadedEvents.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 3)); 

        // Fetch Palmarès
        const qPalmares = collection(db, 'palmares');
        const snapPalmares = await getDocs(qPalmares);
        const loadedPalmares: any[] = [];
        snapPalmares.forEach(d => loadedPalmares.push({ id: d.id, ...d.data() }));
        // 5 dernières médailles
        setPalmares(loadedPalmares.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5)); 

      } catch (e) {
        console.error(e);
      }
      setIsLoading(false);
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
    <div className="w-full min-h-screen pb-32 p-4">
      <div className="max-w-5xl mx-auto space-y-6">
        
        <div>
          <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">Accueil</h2>
          <span className="text-[10px] text-cyan-500 font-mono uppercase tracking-widest leading-none">Quartier Général S.M.G</span>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-10"><Activity className="text-cyan-500 animate-spin"/></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* WIDGET AGENDA */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col">
              <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-2">
                <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center">
                  <CalendarIcon size={16} className="mr-2 text-cyan-500"/> Prochains Événements
                </h3>
              </div>
              
              <div className="space-y-3 flex-1">
                {events.length === 0 ? (
                  <div className="text-center py-6"><CalendarIcon size={24} className="mx-auto text-slate-700 mb-2"/><p className="text-xs text-slate-500 font-mono">Aucun événement prévu.</p></div>
                ) : (
                  events.map(ev => (
                    <div key={ev.id} className="bg-slate-950 p-3 rounded-lg border border-slate-800/50 relative overflow-hidden group">
                       <div className="pr-2 mb-1">
                        <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border mb-1 ${getTypeColor(ev.type)}`}>{ev.type}</span>
                        <h4 className="text-slate-200 font-bold text-sm leading-tight truncate">{ev.title}</h4>
                       </div>
                       <div className="space-y-1 mt-2 pt-2 border-t border-slate-800/50">
                         <p className="text-[10px] text-slate-400 flex items-center font-mono"><CalendarIcon size={10} className="mr-1.5 text-cyan-500/70" /> {new Date(ev.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short' })}</p>
                         {ev.time && <p className="text-[10px] text-slate-400 flex items-center font-mono"><Clock size={10} className="mr-1.5 text-cyan-500/70" /> {ev.time}</p>}
                       </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* WIDGET PALMARES */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col">
              <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-2">
                <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center">
                  <Trophy size={16} className="mr-2 text-amber-500"/> Mur des Champions
                </h3>
              </div>
              
              <div className="space-y-3 flex-1">
                {palmares.length === 0 ? (
                  <div className="text-center py-6"><Star size={24} className="mx-auto text-slate-700 mb-2"/><p className="text-xs text-slate-500 font-mono">Aucune médaille enregistrée.</p></div>
                ) : (
                  palmares.map(p => (
                    <div key={p.id} className="flex items-center justify-between bg-slate-950 p-3 rounded-lg border border-slate-800/50 hover:border-slate-700 transition-colors">
                      <div className="shrink-0 mr-4 flex items-center justify-center w-10 h-10 rounded-full bg-slate-900 shadow-inner">
                         {p.medal === 'Or' && <Medal size={20} className="text-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.6)]" />}
                         {p.medal === 'Argent' && <Medal size={20} className="text-slate-300 drop-shadow-[0_0_5px_rgba(203,213,225,0.6)]" />}
                         {p.medal === 'Bronze' && <Medal size={20} className="text-amber-700 drop-shadow-[0_0_5px_rgba(180,83,9,0.6)]" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-black text-white uppercase tracking-wider truncate">{p.userName}</h4>
                        <p className="text-[10px] text-slate-500 font-mono truncate">{p.competitionName}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}