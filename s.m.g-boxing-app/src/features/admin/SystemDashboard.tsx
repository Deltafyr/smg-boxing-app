import React, { useState, useEffect } from 'react';
import { collection, getDocs, updateDoc, doc, addDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { User } from '../../types';
import { ShieldAlert, Users, Database, Activity } from 'lucide-react';

export default function SystemDashboard({ currentUser }: { currentUser: User }) {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        const snap = await getDocs(collection(db, 'users'));
        const list: User[] = []; snap.forEach(d => list.push({ id: d.id, ...d.data() } as User));
        setUsers(list);
      } catch (e) { console.error(e); }
      setIsLoading(false);
    };
    if (currentUser?.role === 'Admin') fetchUsers();
  }, [currentUser]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!confirm(`Changer le rôle en ${newRole} ?`)) return;
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole as any } : u));
    } catch(e) { alert("Erreur mise à jour"); }
  };

  // INJECTION DES DONNEES HISTORIQUES FOURNIES
  const seedPalmaresData = async () => {
    if(!confirm("Ceci va injecter l'historique des médailles 2025/2026. Continuer ?")) return;
    setIsSeeding(true);
    const dataToInject = [
      { userName: "Pauline", competitionName: "Championnat Régional AURA 2025", date: "2025-11-22", medal: "Or" },
      { userName: "Méline", competitionName: "Championnat Régional AURA 2025", date: "2025-11-22", medal: "Or" },
      { userName: "Maevan", competitionName: "Championnat Régional AURA 2025", date: "2025-11-22", medal: "Or" },
      { userName: "Armand", competitionName: "Championnat Régional AURA 2025", date: "2025-11-22", medal: "Or" },
      { userName: "Benjamin", competitionName: "Championnat Régional AURA 2025", date: "2025-11-22", medal: "Bronze" },
      { userName: "Lucas", competitionName: "Championnat Régional AURA 2025", date: "2025-11-22", medal: "Bronze" },
      { userName: "Elise", competitionName: "Championnat Régional AURA 2025", date: "2025-11-22", medal: "Bronze" },
      { userName: "Nicolas", competitionName: "Championnat Régional AURA 2025", date: "2025-11-22", medal: "Bronze" },
      { userName: "Axel", competitionName: "Championnat Régional AURA 2025", date: "2025-11-22", medal: "Argent" },
      { userName: "Julien", competitionName: "Championnat Régional AURA 2025", date: "2025-11-22", medal: "Bronze" },
      { userName: "Pauline", competitionName: "Championnat de France 2026", date: "2026-02-21", medal: "Bronze" },
      { userName: "Méline", competitionName: "Championnat de France 2026", date: "2026-02-21", medal: "Or" },
      { userName: "Armand", competitionName: "Championnat de France 2026", date: "2026-02-21", medal: "Bronze" }
    ];

    try {
      for (const item of dataToInject) {
        await addDoc(collection(db, 'palmares'), item);
      }
      alert("Historique injecté avec succès !");
    } catch(e) {
      alert("Erreur lors de l'injection.");
    }
    setIsSeeding(false);
  };

  if (currentUser?.role !== 'Admin') {
    return <div className="p-8 text-center text-rose-500 min-h-screen bg-[#020617] pt-20"><ShieldAlert size={48} className="mx-auto mb-4"/> Accès Restreint</div>;
  }

  return (
    <div className="w-full min-h-screen p-4 pb-32">
      <div className="max-w-lg mx-auto space-y-6">
        <div>
          <h2 className="text-2xl font-black text-white italic uppercase">Cortex Admin</h2>
          <span className="text-[10px] text-rose-500 font-mono uppercase tracking-widest">Gestion Système Complète</span>
        </div>

        {/* OPERATIONS DE BASE DE DONNEES */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg">
          <h3 className="text-xs font-black text-amber-500 uppercase tracking-widest border-b border-slate-800 pb-2 mb-4 flex items-center"><Database size={14} className="mr-2"/> Opérations Serveur</h3>
          <p className="text-[10px] text-slate-400 font-mono mb-3">Exécutez l'injection des données du tableur dans la collection "palmares".</p>
          <button onClick={seedPalmaresData} disabled={isSeeding} className="w-full bg-amber-600 hover:bg-amber-500 text-slate-950 font-black uppercase text-xs py-3 rounded-lg flex items-center justify-center disabled:opacity-50 transition-colors">
            {isSeeding ? <Activity size={16} className="animate-spin mr-2"/> : <Database size={16} className="mr-2"/>}
            Injecter Historique Palmarès (25-26)
          </button>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-2 mb-4 flex items-center"><Users size={14} className="mr-2"/> Membres Inscrits ({users.length})</h3>
          {isLoading ? <p className="text-xs text-amber-500 text-center">Chargement...</p> : (
            <div className="space-y-3">
              {users.map(u => (
                <div key={u.id} className="flex justify-between items-center bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <div>
                    <p className="text-sm font-bold text-white">{u.name}</p>
                    <p className="text-[9px] text-slate-500 font-mono">{u.email}</p>
                  </div>
                  <select value={u.role} onChange={(e) => handleRoleChange(u.id, e.target.value)} disabled={u.id === currentUser.id} className={`text-xs font-bold uppercase rounded p-1.5 outline-none border ${u.role === 'Admin' ? 'bg-rose-900 text-rose-400 border-rose-800' : u.role === 'Coach' ? 'bg-amber-900 text-amber-400 border-amber-800' : 'bg-slate-800 text-slate-300 border-slate-700'}`}>
                    <option value="Admin">Admin</option>
                    <option value="Coach">Coach</option>
                    <option value="Membre">Membre</option>
                  </select>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}