import React, { useState } from 'react';
import { AppRoute, User } from '../types';
import FuturisticCard from '../components/ui/FuturisticCard';
import { Lock, Mail, ChevronRight } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
  onNavigate: (route: AppRoute) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onNavigate }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Simulation de connexion basique
    // Dans une vraie app, cela appellerait une API
    
    // Admin backdoor pour la démo
    if (email === 'admin@smg.com' && password === 'admin') {
      const adminUser: User = {
        id: 'admin-1',
        name: 'Coach Principal',
        email: email,
        role: 'Admin',
        category: 'Pro'
      };
      onLogin(adminUser);
      return;
    }

    // Récupération des utilisateurs stockés localement (simulation BDD)
    const storedUsers = localStorage.getItem('smg_users');
    const users: User[] = storedUsers ? JSON.parse(storedUsers) : [];
    
    // Check local storage users OR simple demo login
    const foundUser = users.find(u => u.email === email); // Note: on ne vérifie pas le mdp stocké pour la demo simplifiée

    if (foundUser) {
       onLogin(foundUser);
    } else {
       // Allow generic login for demo if not found in registered list
       if (password.length < 3) {
         setError('Mot de passe trop court');
         return;
       }
       // Fallback user
       setError('Utilisateur non trouvé. Inscrivez-vous.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 space-y-8">
      <div className="flex flex-col items-center space-y-4">
         <div className="w-24 h-24 rounded-full bg-slate-900 border border-slate-800 p-2 shadow-[0_0_30px_rgba(6,182,212,0.3)]">
            <img src="/logo.png?v=2" alt="Logo" className="w-full h-full object-contain" />
         </div>
         <div className="text-center">
             <h1 className="text-3xl font-black text-white italic tracking-tighter">S.M.G ACCESS</h1>
             <p className="text-cyan-500 font-mono text-xs tracking-[0.3em]">SYSTEME SECURISE</p>
         </div>
      </div>

      <FuturisticCard className="w-full max-w-sm" borderColor="cyan">
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 font-mono ml-1">IDENTIFIANT</label>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-2.5 text-slate-500" size={16} />
              <input 
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 pl-10 pr-4 text-white focus:border-cyan-500 focus:outline-none transition-colors"
                placeholder="email@exemple.com"
              />
            </div>
          </div>
          
          <div>
            <label className="text-xs text-slate-400 font-mono ml-1">MOT DE PASSE</label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-2.5 text-slate-500" size={16} />
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 pl-10 pr-4 text-white focus:border-cyan-500 focus:outline-none transition-colors"
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && <p className="text-rose-500 text-xs text-center">{error}</p>}

          <button 
            type="submit" 
            className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-3 rounded-lg shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center space-x-2 group"
          >
            <span>CONNEXION</span>
            <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </form>
      </FuturisticCard>

      <div className="text-center space-y-4">
        <p className="text-slate-500 text-sm">Pas encore membre ?</p>
        <button 
          onClick={() => onNavigate(AppRoute.REGISTER)}
          className="text-cyan-400 text-sm font-bold border-b border-cyan-400/30 pb-0.5 hover:text-cyan-300 transition-colors"
        >
          CRÉER UN COMPTE
        </button>
      </div>
    </div>
  );
};

export default Login;