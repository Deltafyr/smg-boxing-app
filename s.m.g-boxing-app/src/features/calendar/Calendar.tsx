import React, { useState, useEffect } from 'react';
import { CalendarEvent } from '../../types';
import FuturisticCard from '../../components/ui/FuturisticCard';
import { MapPin } from 'lucide-react';

const CalendarPage: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent>();
  return (
    <div className="p-4 pb-24 max-w-lg mx-auto">
      <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase mb-8">Agenda Club</h2>
      <div className="space-y-4 relative">
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-cyan-500/50 via-rose-500/50 to-transparent"></div>
        {events.length === 0 && <p className="text-center text-slate-500 text-xs italic py-10">Aucun événement prévu.</p>}
      </div>
    </div>
  );
};
export default CalendarPage;
