import React, { useState, useEffect } from 'react';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { User } from '../../types';
import FuturisticCard from '../../components/ui/FuturisticCard';
import { Users, Shield, Trophy, ChevronRight, Activity, Star, Medal, ArrowLeft } from 'lucide-react';

export default function Members({ currentUser }: { currentUser: User }) {
  const [members, setMembers] = useState<User[]>([]);
  const [palmares, setPalmares] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<User | null>(null);

  const isAdmin = currentUser?.role === 'Admin';

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // CORRECTION MAJEURE: ON CIBLE LA COLLECTION "members" POUR AVOIR TOUTE LA LISTE
        const mSnap = await getDocs(collection(db, 'members'));
        const mList: User[] = []; mSnap.forEach(d => mList.push({ id: d.id, ...d.data() } as User));
        setMembers(mList);

        const pSnap = await getDocs(collection(db, 'palmares'));
        const pList: any[] = []; pSnap.forEach(d => pList.push({ id: d.id, ...d.data() }));
        setPalmares(pList);
      } catch(e) {}
      setIsLoading(false);
    };
    fetchData();
  }, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!confirm(`Promouvoir ce membre au rang de ${newRole} ?`)) return;
    try {
      // CORRECTION MAJEURE: ON MODIFIE LA COLLECTION "members"
      await updateDoc(doc(db, 'members', userId), { role: newRole });
      setMembers(members.map(u => u.id === userId ? { ...u, role: newRole as any } : u));
      if (selectedMember && selectedMember.id === userId) {
        setSelectedMember({ ...selectedMember, role: newRole as any });
      }
    } catch(e) { alert("Erreur lors de la mise à jour du rôle."); }
  };

  const getHighestTitle = (userPalmares: any[]) => {
    if (userPalmares.length === 0) return null;
    let bestWeight = -1;
    let bestTitle = "";

    userPalmares.forEach(p => {
      let weight = 0; let titleName = "";
      const compName = p.competitionName.toLowerCase();
      const isFrance = compName.includes('france') || compName.includes('national');
      const isAura = compName.includes('aura') || compName.includes('régional') || compName.includes('regional');

      if (isFrance) {
        if (p.medal === 'Or') { weight = 100; titleName = "🥇 Champion de France"; }
        else if (p.medal === 'Argent') { weight = 90; titleName = "🥈 Vice-Champion de France"; }
        else if (p.medal === 'Bronze') { weight = 80; titleName = "🥉 Médaillé de Bronze (France)"; }
      } else if (isAura) {
        if (p.medal === 'Or') { weight = 70; titleName = "🥇 Champion Régional AURA"; }
        else if (p.medal === 'Argent') { weight = 60; titleName = "🥈 Vice-Champion Régional AURA"; }
        else if (p.medal === 'Bronze') { weight = 50; titleName = "🥉 Médaillé de Bronze (AURA)"; }
      } else {
         if (p.medal === 'Or') { weight = 40; titleName = "🥇 Vainqueur"; }
         else if (p.medal === 'Argent') { weight = 30; titleName = "🥈 Finaliste"; }
         else if (p.medal === 'Bronze') { weight = 20; titleName = "🥉 Médaillé"; }
      }

      if (weight > bestWeight) {
        bestWeight = weight;
        const yearMatch = p.competitionName.match(/\d{4}/);
        const year = yearMatch ? yearMatch[0] : new Date(p.date).getFullYear();
        bestTitle = `${titleName} ${year}`;
      }
    });
    return bestTitle;
  };

  // VUE DETAIL : FICHE MEMBRE
  if (selectedMember) {
    const userNames = selectedMember.name.toLowerCase().split(' ');
    const memberPalmares = palmares.filter(p => 
      userNames.some(n => p.userName.toLowerCase().includes(n)) || (p.userId && p.userId === selectedMember.id)
    ).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    const highestTitle = getHighestTitle(memberPalmares);

    return (
      <div style={{ height: '100vh', overflowY: 'auto', paddingBottom: '150px' }} className="w-full px-4 pt-4">
        <div className="max-w-lg mx-auto space-y-6">
          <button onClick={() => setSelectedMember(null)} className="text-slate-500 text-xs font-bold uppercase hover:text-cyan-500 transition-colors flex items-center">
            <ArrowLeft size={14} className="mr-1"/> Retour à la liste
          </button>
          
          {/* CARTE D'IDENTITÉ & TITRE SUPRÊME */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative">
            <div className="h-24 bg-gradient-to-r from-slate-800 via-cyan-900/40 to-slate-800 relative"></div>
            <div className="px-6 pb-6 relative">
              <div className="w-20 h-20 rounded-2xl border-4 border-slate-900 bg-slate-800 shadow-xl absolute -top-10 flex items-center justify-center">
                 <Shield size={36} className={selectedMember.role === 'Admin' ? 'text-rose-500' : selectedMember.role === 'Coach' ? 'text-amber-500' : 'text-cyan-500'} />
              </div>
              <div className="mt-12 text-center sm:text-left sm:pl-24 sm:mt-2">
                <h2 className="text-2xl font-black text-white uppercase tracking-tight leading-none">{selectedMember.name}</h2>
                {highestTitle ? (
                  <div className="inline-block mt-2 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                    <span className="text-xs font-black text-amber-500 uppercase tracking-widest">{highestTitle}</span>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 font-mono mt-1 uppercase tracking-widest">Combattant S.M.G</p>
                )}
              </div>
            </div>
          </div>

          {/* GESTION DES DROITS (ADMIN SEULEMENT) */}
          {isAdmin && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg">
               <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-2 mb-4 flex items-center"><Shield size={14} className="mr-2 text-rose-500"/> Gestion des Accès</h3>
               <label className="text-[10px] text-slate-500 font-bold uppercase mb-2 block">Rôle du Membre</label>
               <select 
                 value={selectedMember.role} 
                 onChange={(e) => handleRoleChange(selectedMember.id, e.target.value)}
                 disabled={selectedMember.id === currentUser.id}
                 className={`w-full text-sm font-bold uppercase rounded-lg p-3 outline-none border ${selectedMember.role === 'Admin' ? 'bg-rose-900/20 text-rose-400 border-rose-800' : selectedMember.role === 'Coach' ? 'bg-amber-900/20 text-amber-400 border-amber-800' : 'bg-slate-950 text-slate-300 border-slate-700'}`}
               >
                 <option value="Admin">Admin (Contrôle Total)</option>
                 <option value="Coach">Coach (Paramétrage Tournois & Agenda)</option>
                 <option value="Membre">Membre (Consultation Simple)</option>
               </select>
            </div>
          )}

          {/* SECTION PALMARÈS */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg">
            <h3 className="text-sm font-black text-white uppercase tracking-widest border-b border-slate-800 pb-2 mb-4 flex items-center">
              <Trophy size={16} className="mr-2 text-amber-500"/> Palmarès Historique
            </h3>
            {memberPalmares.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-slate-800 rounded-xl">
                <Star size={24} className="mx-auto text-slate-600 mb-2"/>
                <p className="text-xs text-slate-500 font-mono">Aucune médaille enregistrée pour le moment.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {memberPalmares.map(p => (
                  <div key={p.id} className="flex items-center justify-between bg-slate-950 p-3 rounded-lg border border-slate-800/50">
                    <div className="flex-1 pr-4">
                      <h4 className="text-sm font-bold text-slate-200">{p.competitionName}</h4>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">{new Date(p.date).toLocaleDateString('fr-FR')}</p>
                    </div>
                    <div className="shrink-0 flex items-center justify-center w-12 h-12 rounded-full bg-slate-900 shadow-inner">
                       {p.medal === 'Or' && <Medal size={24} className="text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]" />}
                       {p.medal === 'Argent' && <Medal size={24} className="text-slate-300 drop-shadow-[0_0_8px_rgba(203,213,225,0.6)]" />}
                       {p.medal === 'Bronze' && <Medal size={24} className="text-amber-700 drop-shadow-[0_0_8px_rgba(180,83,9,0.6)]" />}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // VUE LISTE : ANNUAIRE DES MEMBRES
  return (
    <div style={{ height: '100vh', overflowY: 'auto', paddingBottom: '150px' }} className="w-full px-4 pt-4">
      <div className="max-w-lg mx-auto flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">Membres</h2>
            <span className="text-[10px] text-cyan-500 font-mono uppercase tracking-widest leading-none">Annuaire S.M.G</span>
          </div>
          <div className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg flex items-center shadow-inner">
            <Users size={16} className="text-slate-500 mr-2"/>
            <span className="font-black text-white">{members.length}</span>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-10"><Activity className="text-cyan-500 animate-spin"/></div>
        ) : members.length === 0 ? (
          <div className="text-center p-8 bg-slate-900/50 rounded-2xl border border-slate-800 border-dashed">
            <Users size={32} className="mx-auto text-slate-600 mb-3" />
            <p className="text-xs text-slate-400 font-mono">Aucun membre n'a été trouvé dans la base.</p>
          </div>
        ) : (
          <div className="space-y-3 pb-10">
            {members.map(member => (
              <button key={member.id} onClick={() => setSelectedMember(member)} className="w-full text-left focus:outline-none">
                <FuturisticCard borderColor={member.role === 'Admin' ? 'rose' : member.role === 'Coach' ? 'amber' : 'cyan'} className="hover:bg-slate-800 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg border ${member.role === 'Admin' ? 'bg-rose-950 border-rose-900 text-rose-500' : member.role === 'Coach' ? 'bg-amber-950 border-amber-900 text-amber-500' : 'bg-cyan-950 border-cyan-900 text-cyan-500'}`}>
                        <Shield size={18} />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-100">{member.name}</h4>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5 uppercase tracking-wider">{member.role}</p>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-slate-600" />
                  </div>
                </FuturisticCard>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}