import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, query } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { User } from '../../types';
import { Calendar, Plus, Trash2, MapPin, Clock } from 'lucide-react';

export default function Agenda({ currentUser }: { currentUser: User }) {
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [type, setType] = useState('Entraînement');
  
  const isStaff = currentUser?.role === 'Admin' || currentUser?.role === 'Coach';
  
  const EVENT_TYPES = ['Entraînement', 'Compétition', 'Stage', 'Réunion', 'Anniversaire'];

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const q = query(collection(db, 'agenda'));
      const snap = await getDocs(q);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset pour comparer uniquement la date pure
      
      const loadedEvents: any[] = [];
      
      for (const d of snap.docs) {
        const data = d.data();
        const eventDate = new Date(data.date);
        eventDate.setHours(0, 0, 0, 0);
        
        // AUTO-NETTOYAGE : Si l'événement est antérieur à aujourd'hui, on l'efface de la base
        if (eventDate < today) {
          await deleteDoc(doc(db, 'agenda', d.id));
        } else {
          loadedEvents.push({ id: d.id, ...data });
        }
      }
      
      setEvents(loadedEvents.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    } catch(e) { console.error(e); }
    setIsLoading(false);
  };

  useEffect(() => { fetchEvents(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const newEvent = { title, date, time, location, type };
      const docRef = await addDoc(collection(db, 'agenda'), newEvent);
      setEvents([...events, { id: docRef.id, ...newEvent }].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
      setShowForm(false);
      setTitle(''); setDate(''); setTime(''); setLocation(''); setType('Entraînement');
    } catch(e) { alert("Erreur lors de l'ajout"); }
    setIsLoading(false);
  };

  const handleDelete = async (id: string) => {
    if(!confirm("Supprimer définitivement cet événement ?")) return;
    try {
      await deleteDoc(doc(db, 'agenda', id));
      setEvents(events.filter(e => e.id !== id));
    } catch(e) { console.error(e); }
  };

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
    <div className="p-4 pb-32 max-w-lg mx-auto">
      {/* Header & Add Button */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase">Agenda</h2>
          <span className="text-[10px] text-cyan-500 font-mono uppercase tracking-widest leading-none">Planning du Club</span>
        </div>
        {isStaff && (
          <button onClick={() => setShowForm(!showForm)} className="bg-cyan-500/20 text-cyan-400 p-2 rounded-xl border border-cyan-500/50 hover:bg-cyan-500/30 transition-colors shadow-[0_0_15px_-5px_rgba(6,182,212,0.4)]">
            <Plus size={20} />
          </button>
        )}
      </div>

      {/* Formulaire d'ajout */}
      {showForm && isStaff && (
        <form onSubmit={handleAdd} className="bg-slate-900 border border-slate-800 p-4 rounded-xl mb-6 space-y-3 shadow-lg animate-fade-in">
          <input required type="text" placeholder="Titre de l'événement..." value={title} onChange={e=>setTitle(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-white outline-none focus:border-cyan-500" />
          <div className="grid grid-cols-2 gap-2">
            <input required type="date" value={date} onChange={e=>setDate(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-white outline-none focus:border-cyan-500" />
            <input type="time" value={time} onChange={e=>setTime(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-white outline-none focus:border-cyan-500" />
          </div>
          <input type="text" placeholder="Lieu (optionnel)" value={location} onChange={e=>setLocation(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-white outline-none focus:border-cyan-500" />
          <select value={type} onChange={e=>setType(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-white outline-none focus:border-cyan-500">
            {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <button disabled={isLoading} type="submit" className="w-full bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-black uppercase text-xs py-3 rounded-lg transition-colors">Enregistrer</button>
        </form>
      )}

      {/* Liste des Événements */}
      <div className="space-y-4">
        {events.length === 0 && !isLoading && (
          <div className="text-center p-8 bg-slate-900/50 rounded-2xl border border-slate-800 border-dashed">
            <Calendar size={32} className="mx-auto text-slate-600 mb-3" />
            <p className="text-xs text-slate-400 font-mono">Aucun événement à venir.</p>
          </div>
        )}
        
        {events.map(ev => (
          <div key={ev.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 relative overflow-hidden group hover:border-slate-700 transition-colors">
            {isStaff && (
              <button onClick={() => handleDelete(ev.id)} className="absolute top-3 right-3 text-slate-600 hover:text-rose-500 transition-colors">
                <Trash2 size={16} />
              </button>
            )}
            <div className="pr-8 mb-2">
              <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border mb-2 ${getTypeColor(ev.type)}`}>
                {ev.type}
              </span>
              <h3 className="text-white font-bold text-lg leading-tight">{ev.title}</h3>
            </div>
            
            <div className="space-y-1.5 mt-3 pt-3 border-t border-slate-800/50">
              <p className="text-xs text-slate-400 flex items-center font-mono">
                <Calendar size={12} className="mr-2 text-cyan-500/70" />
                {new Date(ev.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
              {ev.time && (
                <p className="text-xs text-slate-400 flex items-center font-mono">
                  <Clock size={12} className="mr-2 text-cyan-500/70" /> {ev.time}
                </p>
              )}
              {ev.location && (
                <p className="text-xs text-slate-400 flex items-center font-mono">
                  <MapPin size={12} className="mr-2 text-cyan-500/70" /> {ev.location}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}