
import React, { useState, useEffect } from 'react';
import { User, Announcement, Poll, PollOption } from '../types';
import FuturisticCard from '../components/ui/FuturisticCard';
import { Shield, Megaphone, Users, Trash2, CheckSquare, Plus, Activity, Calendar, UserCog, Smartphone } from 'lucide-react';

// Fonction utilitaire pour envoyer une notification système
const sendPushNotification = (title: string, body: string) => {
  if (!("Notification" in window)) return;
  
  if (Notification.permission === "granted") {
    new Notification(title, { body, icon: '/logo.png' });
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission().then(permission => {
      if (permission === "granted") {
        new Notification(title, { body, icon: '/logo.png' });
      }
    });
  }
};

interface AdminProps {
  currentUser: User;
  announcements: Announcement[];
  onAddAnnouncement: (ann: Announcement) => void;
}

const Admin: React.FC<AdminProps> = ({ currentUser, announcements, onAddAnnouncement }) => {
  const [activeTab, setActiveTab] = useState<'ANNOUNCEMENTS' | 'USERS' | 'POLLS'>('ANNOUNCEMENTS');
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [users, setUsers] = useState<User[]>([]);

  // Sondages State
  const [polls, setPolls] = useState<Poll[]>([]);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [pollExpiryDate, setPollExpiryDate] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('smg_users');
    if (stored) setUsers(JSON.parse(stored));
    
    const storedPolls = localStorage.getItem('smg_polls');
    if (storedPolls) setPolls(JSON.parse(storedPolls));
  }, []);

  // --- GESTION UTILISATEURS ---
  const updateUser = (userId: string, changes: Partial<User>) => {
    const updatedUsers = users.map(u => u.id === userId ? { ...u, ...changes } : u);
    setUsers(updatedUsers);
    localStorage.setItem('smg_users', JSON.stringify(updatedUsers));
  };

  const deleteUser = (userId: string) => {
    if (userId === currentUser.id) {
        alert("Action impossible sur votre propre compte.");
        return;
    }
    if (confirm('Voulez-vous vraiment supprimer cet utilisateur ? Cette action est irréversible.')) {
      const updatedUsers = users.filter(u => u.id !== userId);
      setUsers(updatedUsers);
      localStorage.setItem('smg_users', JSON.stringify(updatedUsers));
    }
  };

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

    // NOTIFICATION PUSH
    sendPushNotification(`SMG : ${newTitle}`, newContent);

    setNewTitle('');
    setNewContent('');
    alert('Annonce publiée et membres notifiés !');
  };

  // --- SONDAGES LOGIC ---
  const handleAddOption = () => setPollOptions([...pollOptions, '']);
  const handleUpdateOption = (index: number, val: string) => {
    const next = [...pollOptions];
    next[index] = val;
    setPollOptions(next);
  };

  const handleCreatePoll = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pollQuestion || pollOptions.some(o => !o)) return;

    const newPoll: Poll = {
      id: Date.now().toString(),
      question: pollQuestion,
      options: pollOptions.map((o, i) => ({ id: `opt-${i}`, text: o })),
      active: true,
      createdAt: new Date().toISOString(),
      expiresAt: pollExpiryDate ? new Date(pollExpiryDate).toISOString() : undefined,
      votes: []
    };

    // Désactiver les anciens sondages
    const updatedPolls = polls.map(p => ({ ...p, active: false })).concat(newPoll);
    setPolls(updatedPolls);
    localStorage.setItem('smg_polls', JSON.stringify(updatedPolls));

    // NOTIFICATION PUSH
    sendPushNotification("Nouveau Sondage !", pollQuestion);

    setPollQuestion('');
    setPollOptions(['', '']);
    setPollExpiryDate('');
    alert('Sondage publié et membres notifiés !');
  };

  const togglePollStatus = (id: string) => {
    const next = polls.map(p => p.id === id ? { ...p, active: !p.active } : p);
    setPolls(next);
    localStorage.setItem('smg_polls', JSON.stringify(next));
  };

  const deletePoll = (id: string) => {
    if (confirm('Supprimer ce sondage ?')) {
      const next = polls.filter(p => p.id !== id);
      setPolls(next);
      localStorage.setItem('smg_polls', JSON.stringify(next));
    }
  };

  return (
    <div className="p-4 pb-24 space-y-6 max-w-lg mx-auto">
      <div className="flex items-center space-x-3 mb-4">
        <div className="p-2 bg-rose-500/20 rounded-lg border border-rose-500/50">
           <Shield className="text-rose-500" size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-none">Admin Zone</h1>
          <p className="text-[10px] text-rose-400 font-mono uppercase mt-1 tracking-widest">Control Panel System</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-950/50 rounded-2xl p-1 border border-slate-800 overflow-x-auto">
        <button 
          onClick={() => setActiveTab('ANNOUNCEMENTS')}
          className={`flex-1 min-w-[100px] py-2.5 text-[10px] font-black rounded-xl flex items-center justify-center space-x-2 transition-all ${activeTab === 'ANNOUNCEMENTS' ? 'bg-slate-100 text-slate-950 shadow-lg' : 'text-slate-500'}`}
        >
          <Megaphone size={14} /> <span>ANNONCES</span>
        </button>
        <button 
          onClick={() => setActiveTab('POLLS')}
          className={`flex-1 min-w-[100px] py-2.5 text-[10px] font-black rounded-xl flex items-center justify-center space-x-2 transition-all ${activeTab === 'POLLS' ? 'bg-rose-600 text-white shadow-lg' : 'text-slate-500'}`}
        >
          <CheckSquare size={14} /> <span>SONDAGES</span>
        </button>
        <button 
          onClick={() => setActiveTab('USERS')}
          className={`flex-1 min-w-[100px] py-2.5 text-[10px] font-black rounded-xl flex items-center justify-center space-x-2 transition-all ${activeTab === 'USERS' ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-500'}`}
        >
          <Users size={14} /> <span>MEMBRES</span>
        </button>
      </div>

      {/* TAB : SONDAGES */}
      {activeTab === 'POLLS' && (
        <div className="space-y-8 animate-fade-in">
           <FuturisticCard title="NOUVEAU SONDAGE" borderColor="rose">
              <form onSubmit={handleCreatePoll} className="space-y-4">
                 <div>
                    <label className="text-[9px] text-slate-500 font-black mb-1 block uppercase">Question</label>
                    <input type="text" value={pollQuestion} onChange={e => setPollQuestion(e.target.value)} placeholder="ex: Qui participe au stage ?" className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white" required />
                 </div>
                 
                 <div className="space-y-2">
                    <label className="text-[9px] text-slate-500 font-black block uppercase">Options</label>
                    {pollOptions.map((opt, i) => (
                      <div key={i} className="flex gap-2">
                        <input type="text" value={opt} onChange={e => handleUpdateOption(i, e.target.value)} placeholder={`Option ${i+1}`} className="flex-1 bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white" required />
                        {i > 1 && <button type="button" onClick={() => setPollOptions(pollOptions.filter((_, idx) => idx !== i))} className="text-rose-500 p-2"><Trash2 size={14}/></button>}
                      </div>
                    ))}
                    <button type="button" onClick={handleAddOption} className="text-[10px] font-black text-cyan-400 flex items-center mt-2 px-1 uppercase tracking-tighter"><Plus size={12} className="mr-1"/> Ajouter une option</button>
                 </div>

                 <div>
                    <label className="text-[9px] text-slate-500 font-black mb-1 block uppercase flex items-center"><Calendar size={10} className="mr-1"/> Date d'expiration (Fin d'affichage)</label>
                    <input type="date" value={pollExpiryDate} onChange={e => setPollExpiryDate(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white" />
                    <p className="text-[8px] text-slate-600 font-mono mt-1 uppercase">Laisse vide pour un sondage permanent</p>
                 </div>

                 <button type="submit" className="w-full bg-rose-600 text-white font-black py-3 rounded-xl shadow-lg shadow-rose-900/20 active:scale-95 transition-all text-xs uppercase italic">Publier & Notifier</button>
              </form>
           </FuturisticCard>

           <div className="space-y-4">
              <h4 className="text-[10px] text-slate-400 font-mono tracking-widest uppercase mb-2 px-1">Historique des Sondages</h4>
              {polls.sort((a,b) => b.id.localeCompare(a.id)).map(poll => {
                const now = new Date();
                const isExpired = poll.expiresAt && new Date(poll.expiresAt) < now;
                
                return (
                  <FuturisticCard key={poll.id} borderColor={poll.active && !isExpired ? 'rose' : 'slate'} className="bg-slate-950/40">
                     <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h5 className="text-xs font-black text-white italic uppercase leading-tight">{poll.question}</h5>
                          <div className="flex items-center space-x-2 mt-2">
                             <p className="text-[9px] text-slate-500 font-mono uppercase">Créé le {new Date(poll.createdAt).toLocaleDateString()}</p>
                             {poll.expiresAt && (
                               <p className={`text-[9px] font-black uppercase ${isExpired ? 'text-rose-500' : 'text-amber-500'}`}>
                                 • {isExpired ? 'EXPIRÉ' : `FIN LE ${new Date(poll.expiresAt).toLocaleDateString()}`}
                               </p>
                             )}
                          </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button onClick={() => togglePollStatus(poll.id)} className={`px-2 py-1 rounded text-[8px] font-black border ${poll.active && !isExpired ? 'bg-green-600/10 border-green-500 text-green-500' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>
                             {isExpired ? 'EXPIRÉ' : poll.active ? 'ACTIF' : 'CLOS'}
                          </button>
                          <button onClick={() => deletePoll(poll.id)} className="text-slate-600 hover:text-rose-500 p-1"><Trash2 size={14}/></button>
                        </div>
                     </div>

                     <div className="space-y-2 mt-4 pt-3 border-t border-slate-900">
                        <div className="flex items-center gap-2 text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1"><Activity size={10}/> Votants ({poll.votes.length})</div>
                        <div className="grid gap-1 max-h-32 overflow-y-auto pr-1">
                          {poll.votes.length === 0 && <p className="text-[10px] text-slate-600 italic">Aucun vote.</p>}
                          {poll.votes.map((v, i) => {
                            const optionText = poll.options.find(o => o.id === v.optionId)?.text || 'Inconnue';
                            return (
                              <div key={i} className="flex justify-between items-center bg-slate-950 border border-slate-900 px-2 py-1.5 rounded-lg">
                                 <span className="text-[9px] font-bold text-white uppercase">{v.userName}</span>
                                 <span className="text-[9px] font-black text-rose-500 uppercase italic tracking-tighter">{optionText}</span>
                              </div>
                            );
                          })}
                        </div>
                     </div>
                  </FuturisticCard>
                );
              })}
           </div>
        </div>
      )}

      {/* ANNOUNCEMENTS */}
      {activeTab === 'ANNOUNCEMENTS' && (
        <div className="space-y-6">
          <FuturisticCard title="PUBLIER ANNONCE" borderColor="cyan">
            <form onSubmit={handlePostAnnouncement} className="space-y-4">
              <input type="text" placeholder="Titre de l'annonce..." value={newTitle} onChange={e => setNewTitle(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-xs font-bold" required />
              <textarea placeholder="Votre message..." value={newContent} onChange={e => setNewContent(e.target.value)} rows={4} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-xs leading-relaxed" required />
              <button className="w-full py-3 bg-cyan-600 rounded-xl text-white font-black text-xs uppercase italic shadow-lg active:scale-95 transition-all">Diffuser aux membres</button>
            </form>
          </FuturisticCard>
          <div className="space-y-3">
             <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-widest px-1">Archives</h3>
             {announcements.map(ann => (
               <div key={ann.id} className="bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                 <div className="flex justify-between mb-1">
                   <span className="font-bold text-slate-200 text-xs italic">{ann.title}</span>
                   <span className="text-[9px] text-slate-600 font-mono uppercase">{ann.date}</span>
                 </div>
                 <p className="text-[10px] text-slate-400 truncate">{ann.content}</p>
               </div>
             ))}
          </div>
        </div>
      )}

      {/* USERS */}
      {activeTab === 'USERS' && (
        <div className="space-y-4 animate-fade-in">
           {users.length === 0 && <p className="text-center text-slate-500 text-xs italic py-10">Aucun membre inscrit dans la base locale.</p>}
           
           {users.map(user => (
             <FuturisticCard key={user.id} borderColor={user.role === 'Admin' ? 'rose' : user.role === 'Coach' ? 'cyan' : 'slate'}>
                <div className="flex flex-col gap-3">
                   {/* Header User */}
                   <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-3">
                         <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                            user.role === 'Admin' ? 'bg-rose-500/20 text-rose-500' : 
                            user.role === 'Coach' ? 'bg-cyan-500/20 text-cyan-500' :
                            'bg-slate-800 text-slate-400'
                         }`}>
                            {user.name.charAt(0)}
                         </div>
                         <div>
                            <div className="font-bold text-white text-sm uppercase italic">{user.name}</div>
                            <div className="text-[10px] text-slate-500 font-mono tracking-tighter">{user.email}</div>
                         </div>
                      </div>
                      <button 
                        onClick={() => deleteUser(user.id)}
                        className="text-slate-600 hover:text-rose-500 transition-colors p-1"
                        title="Supprimer définitivement"
                      >
                        <Trash2 size={16} />
                      </button>
                   </div>

                   {/* Controls */}
                   <div className="grid grid-cols-2 gap-3 bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                      <div>
                         <label className="text-[9px] text-slate-500 font-black uppercase mb-1 block flex items-center"><UserCog size={10} className="mr-1"/> Rôle</label>
                         <select 
                            value={user.role} 
                            onChange={(e) => updateUser(user.id, { role: e.target.value as any })}
                            className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-white outline-none focus:border-cyan-500"
                         >
                            <option value="Member">Membre</option>
                            <option value="Coach">Coach</option>
                            <option value="Admin">Admin</option>
                         </select>
                      </div>
                      <div>
                         <label className="text-[9px] text-slate-500 font-black uppercase mb-1 block">Catégorie</label>
                         <select 
                            value={user.category} 
                            onChange={(e) => updateUser(user.id, { category: e.target.value as any })}
                            className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-white outline-none focus:border-cyan-500"
                         >
                            <option value="Loisir">Loisir</option>
                            <option value="Compétiteur">Compétiteur</option>
                            <option value="Pro">Pro</option>
                            <option value="Parent">Parent</option>
                         </select>
                      </div>
                   </div>
                   
                   {/* Info sup */}
                   <div className="flex justify-between items-center px-1">
                      <span className="text-[9px] text-slate-600 font-mono uppercase">ID: {user.id.slice(-6)}</span>
                      <span className="text-[9px] text-slate-500 font-mono flex items-center"><Smartphone size={10} className="mr-1"/> {user.phone || 'Non renseigné'}</span>
                   </div>
                </div>
             </FuturisticCard>
           ))}
        </div>
      )}
    </div>
  );
};

export default Admin;
