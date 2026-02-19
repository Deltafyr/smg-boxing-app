import React from 'react';
import { User } from '../../types';
import FuturisticCard from '../../components/ui/FuturisticCard';
import { LogOut } from 'lucide-react';

interface ProfileProps { user: User | null; onLogout: () => void; }

const Profile: React.FC<ProfileProps> = ({ user, onLogout }) => {
  if (!user) return <div>Erreur</div>;
  return (
    <div className="p-4 pb-24 space-y-6">
      <div className="flex flex-col items-center pt-4">
        <h1 className="text-2xl font-bold text-white">{user.name}</h1>
        <span className="text-xs text-slate-500">ID: #{user.id.slice(-4)}</span>
      </div>
      <div className="flex justify-center mt-6">
        <button onClick={onLogout} className="flex items-center text-xs text-rose-500 hover:text-rose-400 border border-rose-500/30 px-4 py-2 rounded-lg bg-rose-500/10"><LogOut size={14} className="mr-2" /> Déconnexion</button>
      </div>
    </div>
  );
};
export default Profile;
