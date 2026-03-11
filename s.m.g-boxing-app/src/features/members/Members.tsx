import React, { useState, useEffect } from 'react';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { User } from '../../types';
import FuturisticCard from '../../components/ui/FuturisticCard';
import { Users, Shield, Trophy, ChevronRight, Activity, Star, Medal, ArrowLeft, Mail, Phone, Calendar, Dumbbell, Search } from 'lucide-react';

const HISTORICAL_PALMARES = [
  { id: 'h1', competitionName: 'Championnat de France 2026', date: '2026-02-21', userName: 'Méline', medal: 'Or' },
  { id: 'h2', competitionName: 'Championnat de France 2026', date: '2026-02-21', userName: 'Pauline', medal: 'Bronze' },
  { id: 'h3', competitionName: 'Championnat de France 2026', date: '2026-02-21', userName: 'Armand', medal: 'Bronze' },
  { id: 'h4', competitionName: 'Championnat Régional AURA 2025', date: '2025-11-22', userName: 'Pauline', medal: 'Or' },
  { id: 'h5', competitionName: 'Championnat Régional AURA 2025', date: '2025-11-22', userName: 'Méline', medal: 'Or' },
  { id: 'h6', competitionName: 'Championnat Régional AURA 2025', date: '2025-11-22', userName: 'Maevan', medal: 'Or' },
  { id: 'h7', competitionName: 'Championnat Régional AURA 2025', date: '2025-11-22', userName: 'Armand', medal: 'Or' },
  { id: 'h8', competitionName: 'Championnat Régional AURA 2025', date: '2025-11-22', userName: 'Axel', medal: 'Argent' },
  { id: 'h9', competitionName: 'Championnat Régional AURA 2025', date: '2025-11-22', userName: 'Benjamin', medal: 'Bronze' },
  { id: 'h10', competitionName: 'Championnat Régional AURA 2025', date: '2025-11-22', userName: 'Lucas', medal: 'Bronze' },
  { id: 'h11', competitionName: 'Championnat Régional AURA 2025', date: '2025-11-22', userName: 'Elise', medal: 'Bronze' },
  { id: 'h12', competitionName: 'Championnat Régional AURA 2025', date: '2025-11-22', userName: 'Nicolas', medal: 'Bronze' },
  { id: 'h13', competitionName: 'Championnat Régional AURA 2025', date: '2025-11-22', userName: 'Julien', medal: 'Bronze' }
];

const normalizeName = (str: string) => str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim() : "";

const matchPalmares = (member: User, p: any) => {
   if (p.userId && p.userId === member.id) return true;
   const mName = normalizeName(member.name);
   const pName = normalizeName(p.userName);
   if (!mName || !pName) return false;
   
   const mWords = mName.split(/\s+/).filter(w => w.length > 2);
   const pWords = pName.split(/\s+/).filter(w => w.length > 2);
   
   return mWords.some(mw => pWords.some(pw => mw === pw || pw.includes(mw) || mw.includes(pw)));
};

const calculateCategoryFFKMDA = (birthYear: number, gender: 'M'|'F' = 'M') => {
  const age = new Date().getFullYear() - birthYear;
  if (age <= 9) return `Poussin (${gender})`;
  if (age <= 11) return `Benjamin (${gender})`;
  if (age <= 13) return `Minime (${gender})`;
  if (age <= 15) return `Cadet (${gender})`;
  if (age <= 17) return `Junior (${gender})`;
  if (age <= 34) return `Senior (${gender})`;
  return `Vétéran (${gender})`;
};

export default function Members({ currentUser }: { currentUser: User }) {
  const [members, setMembers] = useState<User[]>([]);
  const [palmares, setPalmares] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const isAdmin = currentUser?.role === 'Admin';
  const isStaff = currentUser?.role === 'Admin' || currentUser?.role === 'Coach';

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const mSnap = await getDocs(collection(db, 'members'));
        const mList: User[] = []; mSnap.forEach(d => mList.push({ id: d.id, ...d.data() } as User));
        setMembers(mList.sort((a, b) => a.name.localeCompare(b.name)));

        const pSnap = await getDocs(collection(db, 'palmares'));
        const dbPalmares: any[] = []; pSnap.forEach(d => dbPalmares.push({ id: d.id, ...d.data() }));
        
        const merged = [...HISTORICAL_PALMARES];
        dbPalmares.forEach(dbp => {
          const exists = merged.find(m => m.userName === dbp.userName && m.competitionName === dbp.competitionName);
          if (!exists) merged.push(dbp);
        });
        
        setPalmares(merged);
      } catch(e) { console.error(e); }
      setIsLoading(false);
    };
    fetchData();
  }, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (userId === currentUser.id) {
      alert("Erreur: Vous ne pouvez pas modifier votre propre niveau d'accès.");
      return;
    }
    try {
      await updateDoc(doc(db, 'members', userId), { role: newRole });
      setMembers(members.map(u => u.id === userId ? { ...u, role: newRole as any } : u));
      if (selectedMember && selectedMember.id === userId) {
        setSelectedMember({ ...selectedMember, role: newRole as any });
      }
    } catch(e) { alert("Erreur lors de la mise à jour du rôle."); }
  };

  const getHighestTitle = (userPalmares: any[]) => {
    if (userPalmares.length === 0) return null;
    let bestWeight = -1; let bestTitle = "";
    userPalmares.forEach(p => {
      let weight = 0; let titleName = "";
      const compName = p.competitionName.toLowerCase();
      const isFrance = compName.includes('france') || compName.includes('national');
      const isAura = compName.includes('aura') || compName.includes('régional') || compName.includes('regional');

      if (isFrance) {
        if (p.medal === 'Or') { weight = 100; titleName = "🥇 Champion de France"; }
        else if (p.medal === 'Argent') { weight = 90; titleName = "🥈 Vice-Champion de France"; }
        else if (p.medal === 'Bronze') { weight = 80; titleName = "🥉 Médaillé (France)"; }
      } else if (isAura) {
        if (p.medal === 'Or') { weight = 70; titleName = "🥇 Champion AURA"; }
        else if (p.medal === 'Argent') { weight = 60; titleName = "🥈 Vice-Champion AURA"; }
        else if (p.medal === 'Bronze') { weight = 50; titleName = "🥉 Médaillé (AURA)"; }
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

  const getAge = (dateString: string) => {
    if (!dateString) return null;
    const ageDifMs = Date.now() - new Date(dateString).getTime();
    const ageDate = new Date(ageDifMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  const filteredMembers = members.filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()));

  if (selectedMember) {
    const memberPalmares = palmares.filter(p => matchPalmares(selectedMember, p))
                                   .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    const highestTitle = getHighestTitle(memberPalmares);
    const age = getAge(selectedMember.birthDate);
    const category = selectedMember.birthDate ? calculateCategoryFFKMDA(new Date(selectedMember.birthDate).getFullYear(), selectedMember.gender === 'Femme' ? 'F' : 'M') : 'N/C';

    return (
      <div style={{ height: '100vh', overflowY: 'auto', paddingBottom: '150px' }} className="w-full px-4 pt-4">
        <div className="max-w-lg mx-auto space-y-6">
          <button onClick={() => setSelectedMember(null)} className="text-slate-500 text-xs font-bold uppercase hover:text-cyan-500 transition-colors flex items-center bg-slate-900 px-3 py-2 rounded-lg border border-slate-800 w-max shadow-lg">
            <ArrowLeft size={14} className="mr-2"/> Retour à l'Annuaire
          </button>
          
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative mt-12">
            <div className="h-16 bg-gradient-to-r from-slate-800 via-cyan-900/30 to-slate-800 relative"></div>
            <div className="px-6 pb-6 relative">
              <div className="w-24 h-24 rounded-2xl border-4 border-slate-900 bg-slate-800 shadow-xl absolute -top-12 flex items-center justify-center left-6 overflow-hidden">
                 <span className={`text-5xl font-black ${selectedMember.role === 'Admin' ? 'text-rose-500' : selectedMember.role === 'Coach' ? 'text-amber-500' : 'text-cyan-500'}`}>
                   {selectedMember.name.charAt(0).toUpperCase()}
                 </span>
              </div>
              <div className="mt-14 sm:mt-16">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tight leading-none mb-1">{selectedMember.name}</h2>
                    <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${selectedMember.role === 'Admin' ? 'bg-rose-950 border-rose-900 text-rose-500' : selectedMember.role === 'Coach' ? 'bg-amber-950 border-amber-900 text-amber-500' : 'bg-cyan-950 border-cyan-900 text-cyan-500'}`}>
                      Badge : {selectedMember.role}
                    </span>
                  </div>
                </div>
                
                {highestTitle && (
                  <div className="mt-4 bg-gradient-to-r from-amber-500/20 to-transparent border-l-2 border-amber-500 pl-3 py-2 rounded-r-lg">
                    <p className="text-[9px] text-amber-500/70 font-bold uppercase tracking-widest mb-0.5">Titre Suprême</p>
                    <p className="text-sm font-black text-amber-400 uppercase tracking-wide">{highestTitle}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {isStaff && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg animate-fade-in relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
               <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-2 mb-4 flex items-center"><Shield size={14} className="mr-2 text-rose-500"/> Autorisations Système</h3>
               
               <div className="flex space-x-2 bg-slate-950 p-1.5 rounded-lg border border-slate-800">
                 <button 
                   onClick={() => handleRoleChange(selectedMember.id, 'Membre')}
                   className={`flex-1 py-2.5 rounded shadow-sm text-xs font-black uppercase tracking-widest transition-all ${selectedMember.role === 'Membre' ? 'bg-cyan-600 text-white' : 'bg-transparent text-slate-500 hover:text-white hover:bg-slate-800'}`}
                 >Membre</button>
                 <button 
                   onClick={() => handleRoleChange(selectedMember.id, 'Coach')}
                   className={`flex-1 py-2.5 rounded shadow-sm text-xs font-black uppercase tracking-widest transition-all ${selectedMember.role === 'Coach' ? 'bg-amber-600 text-white' : 'bg-transparent text-slate-500 hover:text-white hover:bg-slate-800'}`}
                 >Coach</button>
                 <button 
                   onClick={() => handleRoleChange(selectedMember.id, 'Admin')}
                   disabled={!isAdmin}
                   className={`flex-1 py-2.5 rounded shadow-sm text-xs font-black uppercase tracking-widest transition-all ${selectedMember.role === 'Admin' ? 'bg-rose-600 text-white' : 'bg-transparent text-slate-500 hover:text-white hover:bg-slate-800'} ${!isAdmin ? 'opacity-30 cursor-not-allowed' : ''}`}
                 >Admin</button>
               </div>
               {!isAdmin && <p className="text-[9px] text-amber-500 mt-2 text-center font-mono">Seul un Admin peut accorder le grade Admin.</p>}
            </div>
          )}

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-2 mb-4 flex items-center">
              <Activity size={14} className="mr-2 text-cyan-500"/> Fiche Biométrique & Contact
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/50">
                <span className="flex items-center text-[9px] text-slate-500 font-bold uppercase mb-1"><Calendar size={10} className="mr-1"/> Naissance</span>
                <span className="text-sm font-bold text-white">{selectedMember.birthDate ? new Date(selectedMember.birthDate).toLocaleDateString('fr-FR') : 'N/C'}</span>
                {age && <span className="text-[10px] text-cyan-500 ml-2 font-mono">({age} ans)</span>}
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/50">
                <span className="flex items-center text-[9px] text-slate-500 font-bold uppercase mb-1"><Dumbbell size={10} className="mr-1"/> Physique</span>
                <span className="text-sm font-bold text-white">{selectedMember.weight ? `${selectedMember.weight} kg` : 'N/C'}</span>
                <span className="text-[10px] text-slate-500 ml-2 font-mono">({selectedMember.gender || 'N/C'})</span>
              </div>
            </div>

            <div className="mt-4 bg-slate-950 p-3 rounded-lg border border-slate-800/50">
                <span className="flex items-center text-[9px] text-slate-500 font-bold uppercase mb-1"><Trophy size={10} className="mr-1"/> Catégorie Estimée (FFKMDA)</span>
                <span className="text-sm font-black text-amber-500 uppercase tracking-wide">{category}</span>
            </div>

            <div className="mt-4 bg-slate-950 p-3 rounded-lg border border-slate-800/50">
              <span className="flex items-center text-[9px] text-slate-500 font-bold uppercase mb-1"><Mail size={10} className="mr-1"/> Canal de Communication</span>
              <span className="text-xs font-mono text-slate-300 break-all">{selectedMember.email || 'Non renseigné'}</span>
              {selectedMember.phone && <span className="block mt-1 text-xs font-mono text-slate-300 flex items-center"><Phone size={10} className="mr-1"/> {selectedMember.phone}</span>}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg">
            <h3 className="text-sm font-black text-white uppercase tracking-widest border-b border-slate-800 pb-2 mb-4 flex items-center">
              <Trophy size={16} className="mr-2 text-amber-500"/> Registre des Médailles
            </h3>
            {memberPalmares.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-slate-800 rounded-xl bg-slate-950">
                <Star size={24} className="mx-auto text-slate-700 mb-2"/>
                <p className="text-xs text-slate-500 font-mono">Le palmarès de ce combattant est vierge.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {memberPalmares.map((p, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-slate-950 p-3 rounded-lg border border-slate-800/50 hover:border-slate-700 transition-colors">
                    <div className="flex-1 pr-4">
                      <h4 className="text-sm font-bold text-slate-200 leading-tight">{p.competitionName}</h4>
                      <p className="text-[10px] text-slate-500 font-mono mt-1 flex items-center"><Calendar size={10} className="mr-1"/> {new Date(p.date).toLocaleDateString('fr-FR')}</p>
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

  return (
    <div style={{ height: '100vh', overflowY: 'auto', paddingBottom: '150px' }} className="w-full px-4 pt-4">
      <div className="max-w-lg mx-auto flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">Membres</h2>
            <span className="text-[10px] text-cyan-500 font-mono uppercase tracking-widest leading-none">Annuaire du Club</span>
          </div>
          <div className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg flex items-center shadow-inner">
            <Users size={16} className="text-slate-500 mr-2"/>
            <span className="font-black text-white">{members.length}</span>
          </div>
        </div>

        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" />
          <input 
            type="text" 
            placeholder="Rechercher un combattant..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm text-white outline-none focus:border-cyan-500 transition-colors shadow-lg"
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-10"><Activity className="text-cyan-500 animate-spin"/></div>
        ) : filteredMembers.length === 0 ? (
          <div className="text-center p-8 bg-slate-900/50 rounded-2xl border border-slate-800 border-dashed mt-4">
            <Users size={32} className="mx-auto text-slate-600 mb-3" />
            <p className="text-xs text-slate-400 font-mono">Aucun membre trouvé.</p>
          </div>
        ) : (
          <div className="space-y-3 pb-10">
            {filteredMembers.map(member => (
              <button key={member.id} onClick={() => setSelectedMember(member)} className="w-full text-left focus:outline-none group">
                <FuturisticCard borderColor={member.role === 'Admin' ? 'rose' : member.role === 'Coach' ? 'amber' : 'cyan'} className="hover:bg-slate-800 transition-colors shadow-lg group-hover:shadow-[0_0_15px_rgba(6,182,212,0.1)]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2.5 rounded-lg border shadow-inner flex items-center justify-center w-10 h-10 ${member.role === 'Admin' ? 'bg-rose-950 border-rose-900 text-rose-500' : member.role === 'Coach' ? 'bg-amber-950 border-amber-900 text-amber-500' : 'bg-cyan-950 border-cyan-900 text-cyan-500'}`}>
                        <span className="font-black text-sm">{member.name.charAt(0).toUpperCase()}</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-100 group-hover:text-white transition-colors">{member.name}</h4>
                        <div className="flex items-center space-x-2 mt-0.5">
                           <span className={`text-[9px] font-black uppercase tracking-widest ${member.role === 'Admin' ? 'text-rose-500' : member.role === 'Coach' ? 'text-amber-500' : 'text-cyan-500'}`}>{member.role}</span>
                           <span className="text-[9px] text-slate-600 font-mono">• {member.weight ? `${member.weight}kg` : 'Poids N/C'}</span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-slate-600 group-hover:text-cyan-500 transition-colors" />
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