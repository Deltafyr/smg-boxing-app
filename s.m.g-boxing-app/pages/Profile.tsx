import React from 'react';
import { INITIAL_MEMBERS, CURRENT_USER_ID } from '../constants';
import FuturisticCard from '../components/ui/FuturisticCard';
import { CheckCircle, XCircle, FileText, Activity, CreditCard, Shield } from 'lucide-react';

const Profile: React.FC = () => {
  // Simule la récupération de l'utilisateur connecté
  const user = INITIAL_MEMBERS.find(m => m.id === CURRENT_USER_ID);

  if (!user) return <div>Erreur utilisateur</div>;

  return (
    <div className="p-4 pb-24 space-y-6">
      <div className="flex flex-col items-center pt-4">
        <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-slate-700 to-slate-900 border-2 border-cyan-500 p-1 mb-3 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
           <img 
             src={`https://ui-avatars.com/api/?name=${user.name}&background=0f172a&color=22d3ee`} 
             alt="Profile" 
             className="w-full h-full rounded-full object-cover"
           />
        </div>
        <h1 className="text-2xl font-bold text-white">{user.name}</h1>
        <div className="flex items-center space-x-2 mt-1">
          <span className={`px-3 py-0.5 rounded-full text-xs font-bold border ${
            user.category === 'Compétiteur' ? 'bg-rose-500/20 border-rose-500 text-rose-400' : 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
          }`}>
            {user.category}
          </span>
          <span className="text-xs text-slate-500">ID: #SMG-{user.id.padStart(4, '0')}</span>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-2 gap-3">
        <FuturisticCard className="flex flex-col items-center justify-center py-4" borderColor={user.documentsUpToDate ? 'cyan' : 'rose'}>
           {user.documentsUpToDate ? (
             <CheckCircle className="text-cyan-400 mb-2" size={24} />
           ) : (
             <XCircle className="text-rose-500 mb-2" size={24} />
           )}
           <span className="text-xs font-bold text-slate-300">DOCUMENTS</span>
           <span className={`text-[10px] mt-1 ${user.documentsUpToDate ? 'text-cyan-500' : 'text-rose-500'}`}>
             {user.documentsUpToDate ? 'À jour' : 'Manquant'}
           </span>
        </FuturisticCard>

        <FuturisticCard className="flex flex-col items-center justify-center py-4" borderColor={user.subscriptionStatus === 'Paid' ? 'cyan' : 'rose'}>
           <CreditCard className={`${user.subscriptionStatus === 'Paid' ? 'text-cyan-400' : 'text-orange-400'} mb-2`} size={24} />
           <span className="text-xs font-bold text-slate-300">COTISATION</span>
           <span className={`text-[10px] mt-1 ${user.subscriptionStatus === 'Paid' ? 'text-cyan-500' : 'text-orange-500'}`}>
             {user.subscriptionStatus === 'Paid' ? 'Payée' : 'Partielle'}
           </span>
        </FuturisticCard>
      </div>

      {/* Coach Notes */}
      <FuturisticCard title="NOTES DU COACH">
        <div className="flex items-start space-x-3 bg-slate-950/50 p-3 rounded-lg border border-slate-800/50">
          <FileText className="text-indigo-400 shrink-0 mt-1" size={18} />
          <div>
            <p className="text-sm text-slate-300 italic">"{user.notes}"</p>
            <div className="text-[10px] text-slate-500 mt-2 text-right">Mis à jour récemment</div>
          </div>
        </div>
      </FuturisticCard>

      {/* Stats Quick View */}
      {user.category === 'Compétiteur' && (
        <FuturisticCard title="MES STATISTIQUES">
          <div className="flex justify-around items-center py-2">
            <div className="text-center">
              <div className="text-2xl font-black text-green-400">{user.wins}</div>
              <div className="text-[10px] text-slate-500 uppercase">Victoires</div>
            </div>
            <div className="w-px h-8 bg-slate-700"></div>
            <div className="text-center">
              <div className="text-2xl font-black text-rose-400">{user.losses}</div>
              <div className="text-[10px] text-slate-500 uppercase">Défaites</div>
            </div>
            <div className="w-px h-8 bg-slate-700"></div>
            <div className="text-center">
              <div className="text-2xl font-black text-slate-200">{user.draws}</div>
              <div className="text-[10px] text-slate-500 uppercase">Nuls</div>
            </div>
          </div>
          
          {user.titles.length > 0 && (
            <div className="mt-4 border-t border-slate-800 pt-3">
              <div className="flex items-center space-x-2 mb-2 text-yellow-500">
                <Shield size={14} />
                <span className="text-xs font-bold">Meilleur Titre</span>
              </div>
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded p-2 flex justify-between items-center">
                 <span className="text-xs text-yellow-200">{user.titles[0].competition}</span>
                 <span className="text-xs font-bold text-yellow-500">{user.titles[0].rank} {user.titles[0].year}</span>
              </div>
            </div>
          )}
        </FuturisticCard>
      )}
      
      <div className="flex justify-center mt-6">
        <button className="text-xs text-rose-500/70 hover:text-rose-500 underline">Déconnexion</button>
      </div>
    </div>
  );
};

export default Profile;