import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { AppRoute, User, News } from '../types';
import FuturisticCard from '../components/ui/FuturisticCard';
import { Timer, Trophy, Calendar, User as UserIcon, Send, Megaphone } from 'lucide-react';

export default function Home({ onNavigate, currentUser }: { onNavigate: (r: AppRoute)=>void, currentUser: User | null }) {
  const [feed, setFeed] = useState<News[]>([]); const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false); const [newsType, setNewsType] = useState<'info'|'poll'>('info');
  const [title, setTitle] = useState(''); const [content, setContent] = useState(''); const [options, setOptions] = useState(['Oui', 'Non']);

  const isStaff = currentUser?.role === 'Admin' || currentUser?.role === 'Coach';

  useEffect(() => { fetchFeed(); }, []);
  const fetchFeed = async () => {
    setIsLoading(true);
    try { const snap = await getDocs(collection(db, 'news')); const items: News[] = []; snap.forEach(d => items.push({ id: d.id, ...d.data() } as News)); setFeed(items.sort((a,b)=>new Date(b.date).getTime()-new Date(a.date).getTime())); }
    catch (e) {} setIsLoading(false);
  };

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault(); if (!title || !currentUser) return; setIsLoading(true);
    try {
      const newItem: any = { type: newsType, title, content, author: currentUser.name, date: new Date().toISOString() };
      if (newsType === 'poll') newItem.options = options.filter(o => o.trim() !== '').map(text => ({ text, votes: [] }));
      const docRef = await addDoc(collection(db, 'news'), newItem);
      setFeed([{ id: docRef.id, ...newItem }, ...feed]); setShowForm(false); setTitle(''); setContent(''); setOptions(['Oui', 'Non']);
    } catch (e) { alert('Erreur'); } setIsLoading(false);
  };

  const handleVote = async (newsId: string, optionIndex: number) => {
    if (!currentUser) return;
    const newsItem = feed.find(n => n.id === newsId); if (!newsItem || !newsItem.options) return;
    if (newsItem.options.some(o => o.votes.includes(currentUser.id))) return;
    const newOptions = [...newsItem.options]; newOptions[optionIndex].votes.push(currentUser.id);
    try { await updateDoc(doc(db, 'news', newsId), { options: newOptions }); setFeed(feed.map(n => n.id === newsId ? { ...n, options: newOptions } : n)); } catch (e) {}
  };

  return (
    <div className="p-4 space-y-6 pb-24 max-w-lg mx-auto">
      <div className="flex flex-col items-center justify-center py-4 space-y-3 relative">
        <button onClick={() => onNavigate(AppRoute.PROFILE)} className="absolute top-2 right-0 flex items-center justify-center bg-slate-900 border border-slate-800 text-slate-400 hover:text-cyan-400 p-3 rounded-full shadow-lg transition-colors"><UserIcon size={18}/></button>
        <div className="w-24 h-24 bg-slate-950 rounded-full border border-slate-800 flex items-center justify-center shadow-lg"><img src="/logo.png?v=2" alt="SMG" className="w-full h-full object-contain p-2"/></div>
        <div className="text-center"><h1 className="text-2xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-white to-rose-500">S.M.G BOXING</h1></div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <button onClick={() => onNavigate(AppRoute.TIMER)} className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex flex-col items-center justify-center hover:border-cyan-500 transition-colors group"><Timer className="text-cyan-500 mb-1 group-hover:scale-110 transition-transform" size={24} /><span className="text-[9px] font-black uppercase text-slate-400">Chrono</span></button>
        <button onClick={() => onNavigate(AppRoute.TOURNAMENT)} className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex flex-col items-center justify-center hover:border-rose-500 transition-colors group"><Trophy className="text-rose-500 mb-1 group-hover:scale-110 transition-transform" size={24} /><span className="text-[9px] font-black uppercase text-slate-400">Arène</span></button>
        <button onClick={() => onNavigate(AppRoute.CALENDAR)} className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex flex-col items-center justify-center hover:border-purple-500 transition-colors group"><Calendar className="text-purple-500 mb-1 group-hover:scale-110 transition-transform" size={24} /><span className="text-[9px] font-black uppercase text-slate-400">Agenda</span></button>
      </div>
      <div className="mt-8 space-y-4">
        <div className="flex justify-between items-end border-b border-slate-800 pb-2"><h3 className="text-sm font-black text-slate-200 uppercase tracking-widest flex items-center"><Megaphone size={14} className="mr-2 text-amber-500"/> Comm Center</h3>{isStaff && (<button onClick={() => setShowForm(!showForm)} className="text-[10px] text-amber-500 font-bold uppercase hover:underline">{showForm ? 'Fermer' : 'Nouveau'}</button>)}</div>
        {isStaff && showForm && (
          <FuturisticCard borderColor="slate" className="animate-fade-in bg-slate-900/80">
            <form onSubmit={handlePost} className="space-y-3">
              <div className="flex space-x-2"><button type="button" onClick={() => setNewsType('info')} className={`flex-1 py-1.5 text-[10px] font-black uppercase rounded ${newsType === 'info' ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-500'}`}>Information</button><button type="button" onClick={() => setNewsType('poll')} className={`flex-1 py-1.5 text-[10px] font-black uppercase rounded ${newsType === 'poll' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-500'}`}>Sondage</button></div>
              <input type="text" placeholder="Titre..." value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-xs outline-none" required />
              {newsType === 'info' && <textarea placeholder="Message..." value={content} onChange={e => setContent(e.target.value)} rows={3} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-xs outline-none" required />}
              {newsType === 'poll' && <div className="space-y-2"><input type="text" value={options[0]} onChange={e => setOptions([e.target.value, options[1]])} placeholder="Option 1" className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-xs outline-none" required /><input type="text" value={options[1]} onChange={e => setOptions([options[0], e.target.value])} placeholder="Option 2" className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-xs outline-none" required /></div>}
              <button type="submit" disabled={isLoading} className="w-full bg-slate-800 hover:bg-slate-700 text-white py-2 rounded text-xs font-bold flex items-center justify-center"><Send size={12} className="mr-2"/> Diffuser</button>
            </form>
          </FuturisticCard>
        )}
        <div className="space-y-4">
          {isLoading && <p className="text-center text-slate-500 text-xs font-mono py-4 animate-pulse">Chargement flux...</p>}
          {!isLoading && feed.length === 0 && <p className="text-center text-slate-600 text-xs italic py-4">Aucune communication.</p>}
          {feed.map(item => {
            const hasVoted = currentUser ? item.options?.some(o => o.votes.includes(currentUser.id)) : false;
            const totalVotes = item.options?.reduce((acc, o) => acc + o.votes.length, 0) || 0;
            return (
              <div key={item.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg">
                <div className="flex justify-between items-start mb-2"><span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${item.type === 'poll' ? 'bg-rose-500/20 text-rose-400' : 'bg-cyan-500/20 text-cyan-400'}`}>{item.type === 'poll' ? 'Sondage' : 'Info'}</span><span className="text-[8px] text-slate-500 font-mono">{new Date(item.date).toLocaleDateString('fr-FR')}</span></div>
                <h4 className="font-bold text-white text-sm mb-1">{item.title}</h4>
                {item.type === 'info' && <p className="text-xs text-slate-400 whitespace-pre-wrap">{item.content}</p>}
                {item.type === 'poll' && item.options && (
                  <div className="mt-3 space-y-2">
                    {item.options.map((opt, idx) => {
                      const pct = totalVotes === 0 ? 0 : Math.round((opt.votes.length / totalVotes) * 100); const myVote = currentUser && opt.votes.includes(currentUser.id);
                      return (
                        <div key={idx} className="relative bg-slate-950 border border-slate-800 rounded overflow-hidden">
                          {hasVoted ? (<div className="w-full flex items-center justify-between p-2 relative z-10 text-xs font-bold"><span className={myVote ? 'text-amber-500' : 'text-slate-300'}>{opt.text} {myVote && '✓'}</span><span className="text-slate-500">{pct}%</span><div className="absolute left-0 top-0 bottom-0 bg-rose-500/20 -z-10 transition-all" style={{width: `${pct}%`}}></div></div>) : (<button onClick={() => handleVote(item.id, idx)} className="w-full text-left p-2 text-xs text-slate-300 hover:bg-slate-800 transition-colors font-medium">{opt.text}</button>)}
                        </div>
                      );
                    })}
                    {hasVoted && <p className="text-[9px] text-slate-500 text-right mt-1">{totalVotes} vote(s)</p>}
                  </div>
                )}
                <div className="mt-3 pt-2 border-t border-slate-800/50 flex items-center justify-end"><span className="text-[8px] text-slate-600 uppercase tracking-widest">Par {item.author}</span></div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
