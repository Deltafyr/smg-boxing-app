import React, { useState } from 'react';
import { AppRoute, User } from '../../types';
import FuturisticCard from '../../components/ui/FuturisticCard';
import { User as UserIcon, Mail, Smartphone } from 'lucide-react';

interface RegisterProps {
  onLogin: (user: User) => void;
  onNavigate: (route: AppRoute) => void;
}

const Register: React.FC<RegisterProps> = ({ onLogin, onNavigate }) => {
  const [name, setName] = useState('');
  const handleRegister = (e: React.FormEvent) => { e.preventDefault(); alert("En cours de connexion à Firebase..."); };

  return (
    <div className="flex flex-col items-center min-h-screen p-4 pb-24 space-y-6">
      <div className="text-center mt-4">
         <h1 className="text-2xl font-black text-white italic">NOUVEAU PROFIL</h1>
      </div>
      <form onSubmit={handleRegister} className="w-full max-w-sm space-y-6">
        <FuturisticCard title="VOTRE IDENTITÉ" borderColor="cyan">
          <div className="space-y-4">
            <div className="relative"><UserIcon className="absolute left-3 top-2.5 text-slate-500" size={16} /><input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 pl-10 pr-4 text-white text-sm" placeholder="Nom & Prénom" /></div>
          </div>
        </FuturisticCard>
        <button type="submit" className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold py-4 rounded-xl shadow-lg transition-all active:scale-95">VALIDER L'INSCRIPTION</button>
      </form>
      <button onClick={() => onNavigate(AppRoute.LOGIN)} className="text-slate-500 text-xs">Retour à la connexion</button>
    </div>
  );
};
export default Register;
