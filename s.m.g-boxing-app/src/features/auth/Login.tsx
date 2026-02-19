import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { AppRoute, User } from '../../types';
import FuturisticCard from '../../components/ui/FuturisticCard';
import { Lock, Mail, ChevronRight, Chrome } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
  onNavigate: (route: AppRoute) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onNavigate }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const = useState(true);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      const userDocRef = doc(db, 'members', firebaseUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = { id: firebaseUser.uid,...userDocSnap.data() } as User;
        if (rememberMe) {
          localStorage.setItem('smg_current_user', JSON.stringify(userData));
        }
        onLogin(userData);
      } else {
        setError("Compte authentifié, mais profil introuvable dans la base du club.");
      }
    } catch (err: any) {
      console.error(err);
      setError('Identifiants incorrects ou accès refusé.');
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = () => {
    alert("Module Google Auth en cours de synchronisation par Albedo.");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 space-y-8">
      <div className="flex flex-col items-center space-y-4">
         <div className="w-24 h-24 rounded-full bg-slate-900 border border-slate-800 p-1 shadow-[0_0_30px_rgba(6,182,212,0.3)] flex items-center justify-center overflow-hidden">
             <img src="/logo.png?v=2" alt="SMG Logo" className="w-full h-full object-contain" />
         </div>
         <div className="text-center">
             <h1 className="text-3xl font-black text-white italic tracking-tighter">S.M.G ACCESS</h1>
             <p className="text-cyan-500 font-mono text-xs tracking-[0.3em]">SYSTÈME SÉCURISÉ</p>
         </div>
      </div>

      <FuturisticCard className="w-full max-w-sm" borderColor="cyan">
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 font-mono ml-1">IDENTIFIANT</label>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-2.5 text-slate-500" size={16} />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 pl-10 pr-4 text-white focus:border-cyan-500 focus:outline-none transition-colors" placeholder="email@exemple.com" required />
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400 font-mono ml-1">MOT DE PASSE</label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-2.5 text-slate-500" size={16} />
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 pl-10 pr-4 text-white focus:border-cyan-500 focus:outline-none transition-colors" placeholder="••••••••" required />
            </div>
          </div>
          <div className="flex items-center space-x-2 px-1">
            <input type="checkbox" id="remember" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-cyan-600 focus:ring-cyan-500" />
            <label htmlFor="remember" className="text-xs text-slate-400 cursor-pointer select-none font-medium">Rester connecté</label>
          </div>
          {error && <p className="text-rose-500 text-[10px] text-center bg-rose-500/10 py-1 rounded border border-rose-500/20">{error}</p>}
          <button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white font-bold py-3 rounded-lg shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center space-x-2 group">
            <span>{isLoading? 'ANALYSE...' : 'CONNEXION'}</span>
            {!isLoading && <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />}
          </button>
        </form>
        <div className="relative flex py-4 items-center">
            <div className="flex-grow border-t border-slate-800"></div>
            <span className="flex-shrink mx-4 text-[10px] text-slate-600 font-mono">OU</span>
            <div className="flex-grow border-t border-slate-800"></div>
        </div>
        <button onClick={loginWithGoogle} className="w-full bg-white text-slate-900 font-bold py-2.5 rounded-lg flex items-center justify-center space-x-3 hover:bg-slate-100 transition-colors shadow-xl">
          <Chrome size={18} className="text-red-500" />
          <span className="text-sm">Continuer avec Google</span>
        </button>
      </FuturisticCard>
      <div className="text-center pt-2">
        <p className="text-slate-500 text-sm">Pas encore membre?</p>
        <button onClick={() => onNavigate(AppRoute.REGISTER)} className="text-cyan-400 text-sm font-bold border-b border-cyan-400/30 pb-0.5 hover:text-cyan-300 transition-colors mt-1">CRÉER UN COMPTE</button>
      </div>
    </div>
  );
};
export default Login;
