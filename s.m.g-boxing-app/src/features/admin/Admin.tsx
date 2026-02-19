import React, { useState, useEffect } from 'react';
import { User, Announcement, Poll, PollOption } from '../../types';
import FuturisticCard from '../../components/ui/FuturisticCard';
import { Shield, Megaphone, Users, Trash2, CheckSquare, Plus, Activity, Calendar, UserCog, Smartphone } from 'lucide-react';

interface AdminProps {
  currentUser: User;
  announcements: Announcement;
  onAddAnnouncement: (ann: Announcement) => void;
}

const Admin: React.FC<AdminProps> = ({ currentUser, announcements, onAddAnnouncement }) => {
  const = useState<'ANNOUNCEMENTS' | 'USERS' | 'POLLS'>('ANNOUNCEMENTS');
  const = useState('');
  const [newContent, setNewContent] = useState('');
  const [users, setUsers] = useState<User>();
  const [polls, setPolls] = useState<Poll>();
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('smg_users');
    if (stored) setUsers(JSON.parse(stored));
    const storedPolls = localStorage.getItem('smg_polls');
    if (storedPolls) setPolls(JSON.parse(storedPolls));
  },);

  const handlePostAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle ||!newContent) return;
    const newAnn: Announcement = {
      id: Date.now().toString(),
      title: newTitle,
      content: newContent,
      date: new Date().toLocaleDateString(),
      author: currentUser.name,
      priority: 'High'
    };
    onAddAnnouncement(newAnn);
    setNewTitle(''); setNewContent('');
    alert('Annonce publiée!');
  };

  return (
    <div className="p-4 pb-24 space-y-6 max-w-lg mx-auto">
      <div className="flex items-center space-x-3 mb-4">
        <div className="p-2 bg-rose-500/20 rounded-lg border border-rose-500/50"><Shield className="text-rose-500" size={24} /></div>
        <div>
          <h1 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-none">Admin Zone</h1>
          <p className="text-[10px] text-rose-400 font-mono uppercase mt-1 tracking-widest">Control Panel</p>
        </div>
      </div>
      
      <div className="flex bg-slate-950/50 rounded-2xl p-1 border border-slate-800 overflow-x-auto">
        <button onClick={() => setActiveTab('ANNOUNCEMENTS')} className={`flex-1 min-w-[100px] py-2.5 text-[10px] font-black rounded-xl flex items-center justify-center space-x-2 transition-all ${activeTab === 'ANNOUNCEMENTS'? 'bg-slate-100 text-slate-950 shadow-lg' : 'text-slate-500'}`}><Megaphone size={14} /> <span>ANNONCES</span></button>
        <button onClick={() => setActiveTab('POLLS')} className={`flex-1 min-w-[100px] py-2.5 text-[10px] font-black rounded-xl flex items-center justify-center space-x-2 transition-all ${activeTab === 'POLLS'? 'bg-rose-600 text-white shadow-lg' : 'text-slate-500'}`}><CheckSquare size={14} /> <span>SONDAGES</span></button>
        <button onClick={() => setActiveTab('USERS')} className={`flex-1 min-w-[100px] py-2.5 text-[10px] font-black rounded-xl flex items-center justify-center space-x-2 transition-all ${activeTab === 'USERS'? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-500'}`}><Users size={14} /> <span>MEMBRES (Local)</span></button>
      </div>

      {activeTab === 'ANNOUNCEMENTS' && (
        <div className="space-y-6">
          <FuturisticCard title="PUBLIER ANNONCE" borderColor="cyan">
            <form onSubmit={handlePostAnnouncement} className="space-y-4">
              <input type="text" placeholder="Titre de l'annonce..." value={newTitle} onChange={e => setNewTitle(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-xs font-bold" required />
              <textarea placeholder="Votre message..." value={newContent} onChange={e => setNewContent(e.target.value)} rows={4} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-xs leading-relaxed" required />
              <button className="w-full py-3 bg-cyan-600 rounded-xl text-white font-black text-xs uppercase italic shadow-lg active:scale-95 transition-all">Diffuser</button>
            </form>
          </FuturisticCard>
        </div>
      )}
    </div>
  );
};
export default Admin;
