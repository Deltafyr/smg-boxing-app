import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { CalendarEvent, EventType, User } from '../../types';
import FuturisticCard from '../../components/ui/FuturisticCard';
import { Calendar as CalIcon, Plus, Trophy, Flag, Users } from 'lucide-react';

interface CalendarProps {
  currentUser: User;
}

const CalendarPage: React.FC<CalendarProps> = ({ currentUser }) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newType, setNewType] = useState<EventType>('Événement Club');

  const isStaff = currentUser.role === 'Admin' || currentUser.role === 'Coach';

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const snap = await getDocs(collection(db, 'events'));
      const evs: CalendarEvent[] = [];
      snap.forEach(doc => evs.push({ id: doc.id, ...doc.data() } as CalendarEvent));
      evs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setEvents(evs);
    } catch (e) {
      console.error("Erreur chargement agenda", e);
    }
    setIsLoading(false);
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newDate) return;
    setIsLoading(true);
    try {
      const ev = { title: newTitle, date: newDate, type: newType };
      const docRef = await addDoc(collection(db, 'events'), ev);
      setEvents(prev => [...prev, { id: docRef.id, ...ev }].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
      setShowAddForm(false);
      setNewTitle(''); setNewDate('');
    } catch (err) {
      alert("Erreur lors de l'ajout.");
    }
    setIsLoading(false);
  };

  const getIcon = (type: string) => {
    if (type === 'Championnat') return <Trophy className="text-amber-500" size={20} />;
    if (type === 'Coupe') return <Flag className="text-rose-500" size={20} />;
    return <Users className="text-cyan-500" size={20} />;
  };

  return (
    <div className="p-4 pb-24 max-w-lg mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
           <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-none">Agenda Club</h2>
           <p className="text-[10px] text-purple-400 font-mono tracking-widest uppercase mt-1">Planning S.M.G</p>
        </div>
        {isStaff && (
          <button onClick={() => setShowAddForm(!showAddForm)} className="bg-purple-600/20 text-purple-400 p-2 rounded-xl border border-purple-500/50 hover:bg-purple-600/40 transition-colors">
            <Plus size={20} />
          </button>
        )}
      </div>

      {showAddForm && isStaff && (
        <FuturisticCard className="mb-6 animate-fade-in" borderColor="slate" title="Nouvel Événement">
          <form onSubmit={handleAddEvent} className="space-y-3">
            <input type="text" placeholder="Titre de l'événement..." value={newTitle} onChange={e => setNewTitle(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-xs outline-none focus:border-purple-500" required />
            <div className="grid grid-cols-2 gap-3">
              <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-xs outline-none focus:border-purple-500" required />
              <select value={newType} onChange={e => setNewType(e.target.value as EventType)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-xs outline-none focus:border-purple-500">
                <option value="Événement Club">Événement Club</option>
                <option value="Championnat">Championnat</option>
                <option value="Coupe">Coupe</option>
              </select>
            </div>
            <button type="submit" disabled={isLoading} className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-black text-xs uppercase rounded-lg shadow-lg shadow-purple-600/20 transition-all">Ajouter au calendrier</button>
          </form>
        </FuturisticCard>
      )}

      <div className="space-y-4 relative">
        <div className="absolute left-6 top-2 bottom-0 w-0.5 bg-gradient-to-b from-purple-500 via-rose-500/50 to-transparent"></div>
        {isLoading && <p className="text-center text-purple-400 text-xs font-mono animate-pulse py-10">SYNCHRONISATION...</p>}
        {!isLoading && events.length === 0 && <p className="text-center text-slate-500 text-xs font-mono py-10">Aucun événement prévu.</p>}
        
        {!isLoading && events.map(ev => (
          <div key={ev.id} className="flex items-start space-x-4 relative z-10">
            <div className="w-12 h-12 rounded-full bg-slate-900 border-2 border-slate-800 flex items-center justify-center shrink-0 shadow-lg shadow-black">
              {getIcon(ev.type)}
            </div>
            <FuturisticCard className="flex-1" borderColor="slate">
              <div className="flex justify-between items-start">
                 <div>
                   <h4 className="font-bold text-slate-100 text-sm">{ev.title}</h4>
                   <span className="text-[10px] text-slate-500 font-mono uppercase">{ev.type}</span>
                 </div>
                 <span className="bg-slate-900 text-slate-300 text-[10px] font-black font-mono px-2 py-1 rounded border border-slate-700">
                   {new Date(ev.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                 </span>
              </div>
            </FuturisticCard>
          </div>
        ))}
      </div>
    </div>
  );
};
export default CalendarPage;
