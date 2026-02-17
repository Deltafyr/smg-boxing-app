import React, { useState, useEffect } from 'react';
import { User, Announcement } from '../types';
import FuturisticCard from '../components/ui/FuturisticCard';
import { Shield, Megaphone, Users, Trash2, Check, Star } from 'lucide-react';

interface AdminProps {
  currentUser: User;
  announcements: Announcement[];
  onAddAnnouncement: (ann: Announcement) => void;
}

const Admin: React.FC<AdminProps> = ({ currentUser, announcements, onAddAnnouncement }) => {
  const [activeTab, setActiveTab] = useState<'ANNOUNCEMENTS' | 'USERS'>('ANNOUNCEMENTS');
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    // Charger les utilisateurs (mock)
    const stored = localStorage.getItem('smg_users');
    if (stored) setUsers(JSON.parse(stored));
  }, []);

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
    setNewTitle('');
    setNewContent('');
    alert('Annonce publiée !');
  };

  const updateUserRole = (userId: string, newRole: 'Member' | 'Coach' | 'Admin') => {
    const updatedUsers = users.map(u => u.id === userId ? { ...u, role: newRole } : u);
    setUsers(updatedUsers);
    localStorage.setItem('smg_users', JSON.stringify(updatedUsers));
  };

  return (
    <div className="p-4 pb-24 space-y-6">
      <div className="flex items-center space-x-3 mb-4">
        <div className="p-2 bg-rose-500/20 rounded-lg border border-rose-500/50">
           <Shield className="text-rose-500" size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">ZONE ADMIN</h1>
          <p className="text-xs text-rose-400 font-mono">ACCÈS RESTREINT</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-800">
        <button 
          onClick={() => setActiveTab('ANNOUNCEMENTS')}
          className={`flex-1 py-2 text-xs font-bold rounded flex items-center justify-center space-x-2 ${activeTab === 'ANNOUNCEMENTS' ? 'bg-slate-800 text-white' : 'text-slate-500'}`}
        >
          <Megaphone size={14} />
          <span>ANNONCES</span>
        </button>
        <button 
          onClick={() => setActiveTab('USERS')}
          className={`flex-1 py-2 text-xs font-bold rounded flex items-center justify-center space-x-2 ${activeTab === 'USERS' ? 'bg-slate-800 text-white' : 'text-slate-500'}`}
        >
          <Users size={14} />
          <span>MEMBRES</span>
        </button>
      </div>

      {activeTab === 'ANNOUNCEMENTS' && (
        <div className="space-y-6">
          <FuturisticCard title="NOUVELLE ANNONCE" borderColor="cyan">
            <form onSubmit={handlePostAnnouncement} className="space-y-3">
              <input 
                type="text" 
                placeholder="Titre (ex: Fermeture Exceptionnelle)" 
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-sm"
              />
              <textarea 
                placeholder="Message..." 
                value={newContent}
                onChange={e => setNewContent(e.target.value)}
                rows={4}
                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-sm"
              />
              <button className="w-full py-2 bg-cyan-600 rounded text-white font-bold text-sm">
                PUBLIER
              </button>
            </form>
          </FuturisticCard>

          <div className="space-y-3">
             <h3 className="text-slate-400 text-xs font-bold uppercase">Historique</h3>
             {announcements.map(ann => (
               <div key={ann.id} className="bg-slate-900/50 p-3 rounded border border-slate-800">
                 <div className="flex justify-between mb-1">
                   <span className="font-bold text-slate-200 text-sm">{ann.title}</span>
                   <span className="text-[10px] text-slate-500">{ann.date}</span>
                 </div>
                 <p className="text-xs text-slate-400 truncate">{ann.content}</p>
               </div>
             ))}
          </div>
        </div>
      )}

      {activeTab === 'USERS' && (
        <div className="space-y-4">
           {users.length === 0 && <p className="text-slate-500 text-center text-sm">Aucun utilisateur inscrit via l'app.</p>}
           
           {users.map(user => (
             <FuturisticCard key={user.id} className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                   <div>
                     <div className="font-bold text-white">{user.name}</div>
                     <div className="text-xs text-slate-500">{user.email}</div>
                   </div>
                   <div className={`px-2 py-1 rounded text-[10px] border ${
                     user.role === 'Admin' ? 'border-rose-500 text-rose-500' :
                     user.role === 'Coach' ? 'border-cyan-500 text-cyan-500' :
                     'border-slate-500 text-slate-500'
                   }`}>
                     {user.role}
                   </div>
                </div>
                
                <div className="flex gap-2 mt-2 pt-2 border-t border-slate-800">
                   <button 
                     onClick={() => updateUserRole(user.id, 'Coach')}
                     className="flex-1 py-1 bg-slate-800 rounded text-[10px] text-cyan-400 hover:bg-slate-700"
                   >
                     Passer Coach
                   </button>
                   <button 
                     onClick={() => updateUserRole(user.id, 'Member')}
                     className="flex-1 py-1 bg-slate-800 rounded text-[10px] text-slate-400 hover:bg-slate-700"
                   >
                     Rétrograder
                   </button>
                </div>
             </FuturisticCard>
           ))}
        </div>
      )}
    </div>
  );
};

export default Admin;