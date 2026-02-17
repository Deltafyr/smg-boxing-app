import React, { useState, useEffect } from 'react';
import { Member, User, ChildProfile } from '../types';
import { INITIAL_MEMBERS } from '../constants';
import FuturisticCard from '../components/ui/FuturisticCard';
import { Phone, MessageCircle, FileText, UserPlus, ChevronDown, ChevronUp, Baby, Users } from 'lucide-react';

// Extension de l'interface Member locale pour inclure les enfants pour l'affichage
interface MemberWithChildren extends Member {
  childrenDetails?: ChildProfile[];
}

const Members: React.FC = () => {
  const [members, setMembers] = useState<MemberWithChildren[]>(INITIAL_MEMBERS);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const storedUsers = localStorage.getItem('smg_users');
    if (storedUsers) {
      const users: User[] = JSON.parse(storedUsers);
      
      const convertedMembers: MemberWithChildren[] = users.map(u => {
        let noteContent = u.category === 'Parent' ? 'Parent référent.' : 'Nouvel inscrit.';
        
        return {
          id: u.id,
          name: u.name,
          phone: u.phone || '',
          category: u.category,
          notes: noteContent, // On garde une note générique
          wins: 0,
          losses: 0,
          draws: 0,
          titles: [],
          documentsUpToDate: (u.documents?.length || 0) > 0,
          subscriptionStatus: 'Unpaid',
          lastMedicalUpdate: 'En attente',
          childrenDetails: u.children // On passe les enfants directement
        };
      });

      // Fusionner avec les membres initiaux
      setMembers([...INITIAL_MEMBERS, ...convertedMembers]);
    }
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const sendWhatsApp = (phone: string, name: string) => {
    if (!phone) return alert('Pas de numéro renseigné');
    const formatted = phone.replace(/^0/, '33').replace(/\s/g, '').replace(/\./g, '');
    const url = `https://wa.me/${formatted}?text=Bonjour ${name}, message du club S.M.G :`;
    window.open(url, '_blank');
  };

  return (
    <div className="p-4 pb-24">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Adhérents</h2>
        <button className="bg-gradient-to-r from-cyan-600 to-blue-600 p-2 rounded-full shadow-lg shadow-cyan-500/30">
          <UserPlus className="text-white" size={24} />
        </button>
      </div>

      <div className="space-y-4">
        {members.map((member) => (
          <FuturisticCard 
            key={member.id} 
            className="transition-all duration-300" 
            borderColor={member.category === 'Compétiteur' ? 'rose' : member.category === 'Parent' ? 'cyan' : 'slate'}
          >
            <div className="flex justify-between items-center" onClick={() => toggleExpand(member.id)}>
              <div className="flex items-center space-x-3">
                 <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold relative ${
                   member.category === 'Compétiteur' ? 'bg-rose-500/20 text-rose-400' : 
                   member.category === 'Parent' ? 'bg-cyan-500/20 text-cyan-400' : 
                   'bg-slate-700 text-slate-300'
                 }`}>
                    {member.name.charAt(0)}
                    {member.category === 'Parent' && (
                      <div className="absolute -bottom-1 -right-1 bg-slate-900 rounded-full p-0.5 border border-cyan-500">
                        <Baby size={10} className="text-cyan-400"/>
                      </div>
                    )}
                 </div>
                 <div>
                   <h3 className="font-bold text-slate-100">{member.name}</h3>
                   <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                     member.category === 'Compétiteur' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 
                     member.category === 'Parent' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' : 
                     'bg-slate-700 text-slate-400 border-slate-600'
                   }`}>
                     {member.category}
                   </span>
                 </div>
              </div>
              <button>
                {expandedId === member.id ? <ChevronUp className="text-slate-500" /> : <ChevronDown className="text-slate-500" />}
              </button>
            </div>

            {/* Expanded Details */}
            {expandedId === member.id && (
              <div className="mt-4 pt-4 border-t border-slate-700/50 animate-fade-in space-y-4">
                <div className="flex justify-around">
                  <button onClick={() => sendWhatsApp(member.phone, member.name)} className="flex flex-col items-center group">
                    <div className="w-10 h-10 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center group-hover:bg-green-500/20 transition-colors">
                       <MessageCircle size={20} className="text-green-500" />
                    </div>
                    <span className="text-[10px] mt-1 text-slate-400">WhatsApp</span>
                  </button>
                  <button className="flex flex-col items-center group" onClick={() => member.phone && window.open(`tel:${member.phone}`)}>
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                       <Phone size={20} className="text-blue-500" />
                    </div>
                    <span className="text-[10px] mt-1 text-slate-400">Appeler</span>
                  </button>
                </div>

                {/* Section Enfants pour les Parents */}
                {member.category === 'Parent' && member.childrenDetails && member.childrenDetails.length > 0 && (
                  <div className="bg-slate-900/80 p-3 rounded-lg border border-cyan-900/50">
                     <div className="flex items-center mb-2 text-cyan-400">
                        <Users size={14} className="mr-2" />
                        <span className="text-xs font-bold uppercase">Enfants à charge</span>
                     </div>
                     <div className="space-y-2">
                       {member.childrenDetails.map((child, idx) => (
                         <div key={idx} className="flex justify-between items-center bg-slate-950 p-2 rounded border border-slate-800">
                            <div className="flex items-center space-x-2">
                              <span className={`text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full ${child.gender === 'H' ? 'bg-cyan-900 text-cyan-400' : 'bg-rose-900 text-rose-400'}`}>
                                {child.gender}
                              </span>
                              <span className="text-sm text-slate-200">{child.name}</span>
                            </div>
                            <span className="text-xs text-slate-500">{child.age} ans</span>
                         </div>
                       ))}
                     </div>
                  </div>
                )}

                <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800">
                  <div className="flex items-center mb-2">
                    <FileText size={14} className="text-slate-500 mr-2" />
                    <span className="text-xs font-mono uppercase text-slate-500">Note</span>
                  </div>
                  <p className="text-sm text-slate-300 italic">"{member.notes}"</p>
                </div>

                {member.category === 'Compétiteur' && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Palmarès & Stats</h4>
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <div className="bg-green-900/20 border border-green-800 rounded p-2 text-center">
                        <div className="text-lg font-bold text-green-400">{member.wins}</div>
                        <div className="text-[10px] text-green-600">VICTOIRES</div>
                      </div>
                      <div className="bg-red-900/20 border border-red-800 rounded p-2 text-center">
                        <div className="text-lg font-bold text-red-400">{member.losses}</div>
                        <div className="text-[10px] text-red-600">DÉFAITES</div>
                      </div>
                       <div className="bg-slate-800 rounded p-2 text-center">
                        <div className="text-lg font-bold text-slate-400">{member.draws}</div>
                        <div className="text-[10px] text-slate-500">NULS</div>
                      </div>
                    </div>
                    {member.titles.length > 0 && (
                      <div className="space-y-1">
                        {member.titles.map((title, idx) => (
                          <div key={idx} className="flex justify-between text-xs text-slate-300 border-b border-slate-800 pb-1">
                             <span>{title.competition} ({title.year})</span>
                             <span className={title.rank === 'Or' ? 'text-yellow-400 font-bold' : title.rank === 'Argent' ? 'text-gray-300 font-bold' : 'text-orange-400'}>{title.rank}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </FuturisticCard>
        ))}
      </div>
    </div>
  );
};

export default Members;