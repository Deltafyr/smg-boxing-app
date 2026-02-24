import React, { useState, useEffect } from 'react';
import { User, Announcement, Poll } from '../../types';
import FuturisticCard from '../../components/ui/FuturisticCard';
import { Shield, Megaphone, Users, CheckSquare } from 'lucide-react';

interface AdminProps {
  currentUser: User;
  announcements: Announcement[];
  onAddAnnouncement: (ann: Announcement) => void;
}

const Admin: React.FC<AdminProps> = ({ currentUser, announcements, onAddAnnouncement }) => {
  const [activeTab, setActiveTab] = useState<'ANNOUNCEMENTS' | 'USERS' | 'POLLS'>('ANNOUNCEMENTS');
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');

  const handlePostAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newContent) return;
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
        <div><h1 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-none">Admin Zone</h1></div>
      </div>
      <div className="flex bg-slate-950/50 rounded-2xl p-1 border border-slate-800 overflow-x-auto">
        <button onClick={() => setActiveTab('ANNOUNCEMENTS')} className={`flex-1 py-2.5 text-[10px] font-black rounded-xl ${activeTab === 'ANNOUNCEMENTS'? 'bg-slate-100 text-slate-950' : 'text-slate-500'}`}>ANNONCES</button>
      </div>
      {activeTab === 'ANNOUNCEMENTS' && (
        <FuturisticCard title="PUBLIER ANNONCE" borderColor="cyan">
          <form onSubmit={handlePostAnnouncement} className="space-y-4">
            <input type="text" placeholder="Titre..." value={newTitle} onChange={e => setNewTitle(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white" required />
            <textarea placeholder="Message..." value={newContent} onChange={e => setNewContent(e.target.value)} rows={4} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white" required />
            <button className="w-full py-3 bg-cyan-600 rounded-xl text-white font-black text-xs uppercase shadow-lg active:scale-95">Diffuser</button>
          </form>
        </FuturisticCard>
      )}
    </div>
  );
};
export default Admin;
