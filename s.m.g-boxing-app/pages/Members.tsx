import React, { useState } from 'react';
import { Member } from '../types';
import { INITIAL_MEMBERS } from '../constants';
import FuturisticCard from '../components/ui/FuturisticCard';
import { Phone, MessageCircle, FileText, UserPlus, ChevronDown, ChevronUp } from 'lucide-react';

const Members: React.FC = () => {
  const [members, setMembers] = useState<Member[]>(INITIAL_MEMBERS);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const sendWhatsApp = (phone: string, name: string) => {
    // Format phone number (remove 0, add 33) assuming French numbers
    const formatted = phone.replace(/^0/, '33').replace(/\s/g, '');
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
          <FuturisticCard key={member.id} className="transition-all duration-300" borderColor={member.category === 'Compétiteur' ? 'rose' : 'slate'}>
            <div className="flex justify-between items-center" onClick={() => toggleExpand(member.id)}>
              <div className="flex items-center space-x-3">
                 <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${member.category === 'Compétiteur' ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-700 text-slate-300'}`}>
                    {member.name.charAt(0)}
                 </div>
                 <div>
                   <h3 className="font-bold text-slate-100">{member.name}</h3>
                   <span className={`text-xs px-2 py-0.5 rounded-full ${member.category === 'Compétiteur' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-slate-700 text-slate-400'}`}>
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
                  <button className="flex flex-col items-center group">
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                       <Phone size={20} className="text-blue-500" />
                    </div>
                    <span className="text-[10px] mt-1 text-slate-400">Appeler</span>
                  </button>
                </div>

                <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800">
                  <div className="flex items-center mb-2">
                    <FileText size={14} className="text-slate-500 mr-2" />
                    <span className="text-xs font-mono uppercase text-slate-500">Notes du Coach</span>
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