import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { User, UserRole } from '../../types';
import FuturisticCard from '../../components/ui/FuturisticCard';
import { Phone, MessageCircle, ChevronDown, ChevronUp, Shield, Settings, Trash2, Mail, FileText, AlertCircle } from 'lucide-react';

export default function Members({ currentUser }: { currentUser: User }) {
  const [memberList, setMemberList] = useState<User[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const isStaff = currentUser?.role === 'Admin' || currentUser?.role === 'Coach';

  useEffect(() => {
    const fetchMembers = async () => {
      setIsLoading(true);
      try {
        const snap = await getDocs(collection(db, 'members')); const users: User[] = [];
        snap.forEach(doc => users.push({ id: doc.id, ...doc.data() } as User));
        const prio: Record<UserRole, number> = { 'Admin': 0, 'Coach': 1, 'Member': 2 };
        setMemberList(users.sort((a, b) => { const pA = prio[a.role] ?? 2; const pB = prio[b.role] ?? 2; return pA !== pB ? pA - pB : a.name.localeCompare(b.name); }));
      } catch (e) {} setIsLoading(false);
    };
    fetchMembers();
  }, []);

  const toggleExpand = (id: string) => { if (isStaff || id === currentUser.id) setExpandedId(expandedId === id ? null : id); };
  const updateU = async (userId: string, fields: Partial<User>) => { try { await updateDoc(doc(db, 'members', userId), fields); setMemberList(prev => prev.map(u => u.id === userId ? { ...u, ...fields } : u)); } catch (e) { alert("Erreur"); } };
  const deleteU = async (userId: string) => { if (confirm('Expulser ce membre ?')) { try { await deleteDoc(doc(db, 'members', userId)); setMemberList(prev => prev.filter(u => u.id !== userId)); } catch (e) { alert("Erreur"); } } };
  const sendWhatsApp = (phone?: string) => { if (phone) window.open(`https://wa.me/${phone.replace(/^0/, '33').replace(/\s/g, '')}`, '_blank'); };

  if (isLoading) return <div className="p-10 text-center text-cyan-400 font-mono animate-pulse">SYNCHRONISATION...</div>;

  return (
    <div className="p-4 pb-24 max-w-lg mx-auto">
      <div className="flex justify-between items-center mb-6"><div><h2 className="text-2xl font-black text-white tracking-tight italic">MEMBRES CLUB</h2><p className="text-[10px] text-cyan-400 font-mono tracking-widest uppercase">Hiérarchie active</p></div></div>
      <div className="space-y-4">
        {memberList.map((user) => {
          const canViewDetails = isStaff || user.id === currentUser.id;
          return (
            <FuturisticCard key={user.id} className={`transition-all duration-300 ${expandedId === user.id ? 'border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.15)]' : ''}`} borderColor={user.role === 'Admin' ? 'rose' : user.role === 'Coach' ? 'cyan' : 'slate'}>
              <div className={`flex justify-between items-center ${canViewDetails ? 'cursor-pointer group' : ''}`} onClick={() => toggleExpand(user.id)}>
                <div className="flex items-center space-x-3">
                   <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg relative ${user.role === 'Admin' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30' : user.role === 'Coach' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' : 'bg-slate-800 text-slate-300 border border-slate-700'}`}>
                      {user.name.charAt(0)}
                      {user.role === 'Admin' && <Shield size={12} className="absolute -top-1 -right-1 text-rose-500 fill-rose-500/20" />}
                      {user.role === 'Coach' && <Shield size={12} className="absolute -top-1 -right-1 text-cyan-500 fill-cyan-500/20" />}
                   </div>
                   <div>
                     <h3 className="font-bold text-slate-100 text-sm tracking-tight">{user.name}</h3>
                     <div className="flex items-center space-x-2 mt-0.5">
                       <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-sm border ${user.role === 'Admin' ? 'border-rose-500/50 text-rose-500' : user.role === 'Coach' ? 'border-cyan-500/50 text-cyan-500' : 'border-slate-700 text-slate-500'}`}>{user.role.toUpperCase()}</span>
                       <span className={`text-[10px] font-medium ${user.category === 'Compétiteur' ? 'text-amber-500' : 'text-slate-500'}`}>{user.category || 'Loisir'}</span>
                     </div>
                   </div>
                </div>
                {canViewDetails && <div className="text-slate-600 group-hover:text-cyan-500 transition-colors">{expandedId === user.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}</div>}
              </div>

              {expandedId === user.id && canViewDetails && (
                <div className="mt-4 pt-4 border-t border-slate-800 animate-fade-in space-y-4">
                  <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-800 space-y-2">
                    <h4 className="text-[10px] font-black text-slate-400 flex items-center uppercase tracking-widest border-b border-slate-800/50 pb-1 mb-2"><FileText size={12} className="mr-2 text-cyan-500"/> Dossier Combattant</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div><span className="block text-[8px] text-slate-500 uppercase">Type</span><span className="text-slate-200">{user.memberType || '-'}</span></div>
                      <div><span className="block text-[8px] text-slate-500 uppercase">Naissance</span><span className="text-slate-200">{user.birthDate ? new Date(user.birthDate).toLocaleDateString('fr-FR') : '-'}</span></div>
                      <div><span className="block text-[8px] text-slate-500 uppercase">Sexe</span><span className="text-slate-200">{user.gender || '-'}</span></div>
                      <div><span className="block text-[8px] text-slate-500 uppercase">Poids</span><span className="text-cyan-400 font-mono font-bold">{user.weight ? `${user.weight} kg` : '-'}</span></div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-slate-800/50 space-y-1"><div className="flex items-center text-xs text-slate-300"><Mail size={12} className="mr-2 text-slate-500"/> {user.email}</div><div className="flex items-center text-xs text-slate-300"><Phone size={12} className="mr-2 text-slate-500"/> {user.phone || 'Non renseigné'}</div></div>
                    {(user.emergencyContact || user.emergencyPhone) && (
                      <div className="mt-2 pt-2 border-t border-slate-800/50 flex items-start space-x-2 text-xs"><AlertCircle size={14} className="text-rose-500 shrink-0 mt-0.5" /><div><span className="block text-[8px] text-rose-500 uppercase font-bold">Urgence</span><span className="text-slate-200">{user.emergencyContact} - {user.emergencyPhone}</span></div></div>
                    )}
                  </div>
                  <div className="flex justify-around bg-slate-900/80 py-3 rounded-xl border border-slate-800 shadow-inner">
                    <button onClick={() => sendWhatsApp(user.phone)} className="flex flex-col items-center group"><MessageCircle size={20} className="text-green-500 mb-1 group-active:scale-90 transition-transform" /><span className="text-[9px] text-slate-500 font-bold">WHATSAPP</span></button>
                    <button onClick={() => user.phone && window.open(`tel:${user.phone}`)} className="flex flex-col items-center group"><Phone size={20} className="text-blue-500 mb-1 group-active:scale-90 transition-transform" /><span className="text-[9px] text-slate-500 font-bold">APPEL</span></button>
                  </div>
                  {isStaff && (
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-3">
                      <div className="flex items-center text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1"><Settings size={12} className="mr-2 text-cyan-500" /> Évaluation Staff</div>
                      <div className="grid grid-cols-2 gap-3">
                        <div><label className="text-[9px] text-slate-600 block mb-1 font-bold">DROITS SYSTEME</label><select disabled={currentUser.role !== 'Admin'} value={user.role} onChange={e => updateU(user.id, { role: e.target.value as UserRole })} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white outline-none focus:border-cyan-500 disabled:opacity-50"><option value="Member">Membre</option><option value="Coach">Coach</option><option value="Admin">Admin</option></select></div>
                        <div><label className="text-[9px] text-slate-600 block mb-1 font-bold">STATUT COMBATTANT</label><select value={user.category || 'Loisir'} onChange={e => updateU(user.id, { category: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white outline-none focus:border-cyan-500"><option value="Loisir">Loisir</option><option value="Compétiteur">Compétiteur</option></select></div>
                      </div>
                      {currentUser.role === 'Admin' && user.id !== currentUser.id && (<div className="flex justify-end pt-2 border-t border-slate-900"><button onClick={() => deleteU(user.id)} className="text-rose-500 hover:text-rose-400 p-1 flex items-center text-[9px] uppercase font-black tracking-widest"><Trash2 size={12} className="mr-1"/> Expulser</button></div>)}
                    </div>
                  )}
                </div>
              )}
            </FuturisticCard>
          );
        })}
      </div>
    </div>
  );
}
