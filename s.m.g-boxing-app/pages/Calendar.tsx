import React from 'react';
import { INITIAL_EVENTS } from '../constants';
import FuturisticCard from '../components/ui/FuturisticCard';
import { Calendar as CalIcon, MapPin } from 'lucide-react';

const CalendarPage: React.FC = () => {
  return (
    <div className="p-4 pb-20">
      <h2 className="text-2xl font-bold text-white mb-6">Calendrier Club</h2>
      
      <div className="space-y-4 relative">
        {/* Timeline Line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-cyan-500/50 to-transparent"></div>

        {INITIAL_EVENTS.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map((event) => {
          const date = new Date(event.date);
          const day = date.getDate();
          const month = date.toLocaleDateString('fr-FR', { month: 'short' }).toUpperCase();
          
          return (
             <div key={event.id} className="relative pl-12">
               {/* Date Bubble */}
               <div className="absolute left-0 top-0 w-9 h-9 bg-slate-900 border border-cyan-500 rounded-lg flex flex-col items-center justify-center z-10">
                 <span className="text-[10px] font-bold text-white leading-none">{day}</span>
                 <span className="text-[8px] text-cyan-400 leading-none">{month}</span>
               </div>

               <FuturisticCard className="mb-2" borderColor={event.type === 'Tournament' ? 'rose' : 'slate'}>
                 <div className="flex justify-between items-start">
                   <h3 className="font-bold text-slate-100">{event.title}</h3>
                   <span className={`text-[10px] px-2 py-0.5 rounded ${
                     event.type === 'Training' ? 'bg-cyan-900/30 text-cyan-400' :
                     event.type === 'Tournament' ? 'bg-rose-900/30 text-rose-400' :
                     'bg-purple-900/30 text-purple-400'
                   }`}>{event.type}</span>
                 </div>
                 <p className="text-xs text-slate-400 mt-1">{event.description}</p>
                 <div className="flex items-center mt-2 text-xs text-slate-500">
                    <MapPin size={12} className="mr-1"/> Salle Principale
                 </div>
               </FuturisticCard>
             </div>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarPage;