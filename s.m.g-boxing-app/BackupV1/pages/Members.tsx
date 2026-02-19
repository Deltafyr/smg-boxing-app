
import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { INITIAL_MEMBERS } from '../constants';
import FuturisticCard from '../components/ui/FuturisticCard';
import { Phone, MessageCircle, UserPlus, ChevronDown, ChevronUp, Shield, Settings, Edit, Trash2 } from 'lucide-react';

interface MembersProps {
  currentUser: User;
}

const Members: React.FC<MembersProps> = ({ currentUser }) => {
  const [memberList, setMemberList] = useState<User[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const isStaff = currentUser.role === 'Admin' || currentUser.role === 'Coach';

  useEffect(() => {
    refreshMemberList();
  }, []);

  const refreshMemberList = () => {
    // 1. Récupérer les utilisateurs réels inscrits
    const storedUsers = localStorage.getItem('smg_users');
    const localUsers: User[] = storedUsers ? JSON.parse(storedUsers) : [];
    
    // 2. Récupérer les mocks et les transformer en format User
    const mockUsers: User[] = INITIAL_MEMBERS.map(m => ({
      id: m.id,
      name: m.name,
      email: `${m.name.toLowerCase().replace(/\s/g, '.')}@club.com`,
      role: m.role || 'Member',
      category: m.category,
      phone: m.phone,
      age: 25, // âge par défaut pour les mocks
      birthDate: '1999-01-01'
    }));

    // 3. Fusionner et dédoublonner par Email (plus fiable que ID qui peut changer entre mock et session)
    const allUsersCombined = [...localUsers, ...mockUsers];
    const uniqueUsers = allUsersCombined.filter((user, index, self) =>
      index === self.findIndex((u) => u.email.toLowerCase() === user.email.toLowerCase())
    );

    // 4. Tri par droits d'accès : Admin (0) > Coach (1) > Member (2)
    const rolePriority: Record<UserRole, number> = { 'Admin': 0, 'Coach': 1, 'Member': 2 };
    
    uniqueUsers.sort((a, b) => {
      const prioA = rolePriority[a.role];
      const prioB = rolePriority[b.role];
      if (prioA !== prioB) return prioA - prioB;
      return a.name.localeCompare(b.name);
    });

    setMemberList(uniqueUsers);
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const updateUser = (userId: string, fields: Partial<User>) => {
    // Mise à jour de l'état local
    const updatedList = memberList.map(u => u.id === userId ? { ...u, ...fields } : u);
    setMemberList(updatedList);
    
    // Mise à jour du localStorage global des utilisateurs
    const storedUsers = localStorage.getItem('smg_users');
    if (storedUsers) {
      const users: User[] = JSON.parse(storedUsers);
      const index = users.findIndex(u => u.id === userId);
      if (index !== -1) {
        users[index] = { ...users[index], ...fields };
        localStorage.setItem('smg_users', JSON.stringify(users));
      } else {
        // Si c'était un mock non encore persisté, on l'ajoute comme utilisateur "réel"
        const userToSave = updatedList.find(u => u.id === userId);
        if (userToSave) {
          users.push(userToSave);
          localStorage.setItem('smg_users', JSON.stringify(users));
        }
      }
    } else {
       // Premier utilisateur sauvegardé
       const userToSave = updatedList.find(u => u.id === userId);
       if (userToSave) {
         localStorage.setItem('smg_users', JSON.stringify([userToSave]));
       }
    }
  };

  const deleteUser = (userId: string) => {
    if (confirm('Voulez-vous vraiment supprimer ce membre de la base de données ?')) {
      const storedUsers = localStorage.getItem('smg_users');
      if (storedUsers) {
        const users: User[] = JSON.parse(storedUsers);
        const filtered = users.filter(u => u.id !== userId);
        localStorage.setItem('smg_users', JSON.stringify(filtered));
      }
      setMemberList(prev => prev.filter(u => u.id !== userId));
      alert('Membre supprimé.');
    }
  };

  const sendWhatsApp = (phone?: string, name?: string) => {
    if (!phone) return alert('Numéro non renseigné.');
    const formatted = phone.replace(/^0/, '33').replace(/\s/g, '').replace(/\./g, '');
    window.open(`https://wa.me/${formatted}?text=Bonjour ${name}, message du club S.M.G :`, '_blank');
  };

  return (
    <div className="p-4 pb-24 max-w-lg mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
           <h2 className="text-2xl font-black text-white tracking-tight italic">MEMBRES CLUB</h2>
           <p className="text-[10px] text-cyan-400 font-mono tracking-widest uppercase">Hiérarchie active</p>
        </div>
        {isStaff && (
          <button className="bg-cyan-600 p-2 rounded-full shadow-lg shadow-cyan-500/20 active:scale-90 transition-transform">
            <UserPlus className="text-white" size={20} />
          </button>
        )}
      </div>

      <div className="space-y-4">
        {memberList.map((user) => (
          <FuturisticCard 
            key={user.id} 
            className="transition-all duration-300" 
            borderColor={user.role === 'Admin' ? 'rose' : user.role === 'Coach' ? 'cyan' : 'slate'}
          >
            <div className="flex justify-between items-center cursor-pointer" onClick={() => toggleExpand(user.id)}>
              <div className="flex items-center space-x-3">
                 <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg relative ${
                   user.role === 'Admin' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30' : 
                   user.role === 'Coach' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' : 
                   'bg-slate-800 text-slate-300 border border-slate-700'
                 }`}>
                    {user.name.charAt(0)}
                    {user.role === 'Admin' && <Shield size={12} className="absolute -top-1 -right-1 text-rose-500 fill-rose-500/20" />}
                    {user.role === 'Coach' && <Shield size={12} className="absolute -top-1 -right-1 text-cyan-500 fill-cyan-500/20" />}
                 </div>
                 <div>
                   <div className="flex items-center space-x-2">
                     <h3 className="font-bold text-slate-100 text-sm tracking-tight">{user.name}</h3>
                   </div>
                   <div className="flex items-center space-x-2 mt-0.5">
                     <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-sm border ${
                       user.role === 'Admin' ? 'border-rose-500/50 text-rose-500' : 
                       user.role === 'Coach' ? 'border-cyan-500/50 text-cyan-500' : 
                       'border-slate-700 text-slate-500'
                     }`}>
                       {user.role.toUpperCase()}
                     </span>
                     <span className="text-[10px] text-slate-500 font-medium">
                       {user.category} • {user.age} ans
                     </span>
                   </div>
                 </div>
              </div>
              <div className="text-slate-600">
                {expandedId === user.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>
            </div>

            {expandedId === user.id && (
              <div className="mt-4 pt-4 border-t border-slate-800 animate-fade-in space-y-4">
                <div className="flex justify-around bg-slate-900/80 py-3 rounded-xl border border-slate-800 shadow-inner">
                  <button onClick={() => sendWhatsApp(user.phone, user.name)} className="flex flex-col items-center group">
                    <MessageCircle size={20} className="text-green-500 mb-1 group-active:scale-90 transition-transform" />
                    <span className="text-[9px] text-slate-500 font-bold">WHATSAPP</span>
                  </button>
                  <button onClick={() => user.phone && window.open(`tel:${user.phone}`)} className="flex flex-col items-center group">
                    <Phone size={20} className="text-blue-500 mb-1 group-active:scale-90 transition-transform" />
                    <span className="text-[9px] text-slate-500 font-bold">APPEL</span>
                  </button>
                  {isStaff && (
                    <button className="flex flex-col items-center group">
                      <Edit size={20} className="text-amber-400 mb-1 group-active:scale-90 transition-transform" />
                      <span className="text-[9px] text-slate-500 font-bold">DOSSIER</span>
                    </button>
                  )}
                </div>

                {isStaff && (
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-3">
                    <div className="flex items-center text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">
                      <Settings size={12} className="mr-2 text-cyan-500" /> Paramètres d'accès
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[9px] text-slate-600 block mb-1 font-bold">DROITS D'ACCÈS</label>
                        <select 
                          value={user.role}
                          onChange={(e) => updateUser(user.id, { role: e.target.value as UserRole })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white outline-none focus:border-cyan-500 transition-colors"
                        >
                          <option value="Member">Membre</option>
                          <option value="Coach">Coach</option>
                          <option value="Admin">Administrateur</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[9px] text-slate-600 block mb-1 font-bold">CATÉGORIE</label>
                        <select 
                          value={user.category}
                          onChange={(e) => updateUser(user.id, { category: e.target.value as any })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white outline-none focus:border-cyan-500 transition-colors"
                        >
                          <option value="Loisir">Loisir</option>
                          <option value="Compétiteur">Compétiteur</option>
                          <option value="Pro">Professionnel</option>
                          <option value="Parent">Parent</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-900">
                      <span className="text-[10px] text-slate-500 font-mono">{user.email}</span>
                      {currentUser.role === 'Admin' && user.id !== currentUser.id && (
                        <button onClick={() => deleteUser(user.id)} className="text-rose-500 hover:text-rose-400 transition-colors p-1">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </FuturisticCard>
        ))}
        {memberList.length === 0 && (
          <div className="text-center py-10 text-slate-500 text-sm italic">
            Aucun membre trouvé.
          </div>
        )}
      </div>
    </div>
  );
};

export default Members;
