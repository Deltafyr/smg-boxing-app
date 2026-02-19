
import React, { useState, useEffect } from 'react';
import { INITIAL_EVENTS } from '../constants';
import { CalendarEvent } from '../types';
import FuturisticCard from '../components/ui/FuturisticCard';
import { Calendar as CalIcon, MapPin } from 'lucide-react';

const CalendarPage: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  useEffect(() => {
    const storedEvents = localStorage.getItem('smg_calendar_events');
    const localEvents: CalendarEvent[] = storedEvents ? JSON.parse(storedEvents) : [];
    
    // Fusionner mocks et événements locaux, trier par date
    const combined = [...INITIAL_EVENTS, ...localEvents].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    setEvents(combined);
  }, []);

  return (
    <div className="p-4 pb-24 max-w-lg mx-auto">
      <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase mb-8">Agenda Club</h2>
      
      <div className="space-y-4 relative">
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-cyan-500/50 via-rose-500/50 to-transparent"></div>

        {events.map((event) => {
          const date = new Date(event.date);
          const day = date.getDate();
          const month = date.toLocaleDateString('fr-FR', { month: 'short' }).toUpperCase();
          
          return (
             <div key={event.id} className="relative pl-12 animate-fade-in">
               {/* Date Bubble */}
               <div className={`absolute left-0 top-0 w-9 h-9 border rounded-lg flex flex-col items-center justify-center z-10 bg-slate-950 ${event.type === 'Tournament' ? 'border-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.3)]' : 'border-cyan-500'}`}>
                 <span className="text-[10px] font-black text-white leading-none">{day}</span>
                 <span className={`text-[8px] leading-none font-bold ${event.type === 'Tournament' ? 'text-rose-400' : 'text-cyan-400'}`}>{month}</span>
               </div>

               <FuturisticCard className="mb-2" borderColor={event.type === 'Tournament' ? 'rose' : 'slate'}>
                 <div className="flex justify-between items-start">
                   <h3 className="font-bold text-slate-100 text-sm italic">{event.title}</h3>
                   <span className={`text-[8px] px-2 py-0.5 rounded font-black uppercase tracking-widest ${
                     event.type === 'Training' ? 'bg-cyan-900/30 text-cyan-400 border border-cyan-500/20' :
                     event.type === 'Tournament' ? 'bg-rose-900/30 text-rose-400 border border-rose-500/20' :
                     'bg-purple-900/30 text-purple-400 border border-purple-500/20'
                   }`}>{event.type}</span>
                 </div>
                 <p className="text-xs text-slate-400 mt-1">{event.description}</p>
                 <div className="flex items-center mt-2 text-[10px] text-slate-500 font-mono uppercase">
                    <MapPin size={10} className="mr-1 text-rose-500"/> {event.type === 'Tournament' ? 'Lieu Extérieur' : 'Salle Principale'}
                 </div>
               </FuturisticCard>
             </div>
          );
        })}
        {events.length === 0 && <p className="text-center text-slate-500 text-xs italic py-10">Aucun événement prévu.</p>}
      </div>
    </div>
  );
};

export default CalendarPage;
