import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '../../lib/firebase';
import { AppRoute, User } from '../../types';
import FuturisticCard from '../../components/ui/FuturisticCard';
import { ChevronRight, ShieldAlert } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
  onNavigate: (route: AppRoute) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    if (!isFirebaseConfigured) {
      setError('Mode Hors-Ligne: Base de données inaccessible.');
      setIsLoading(false);
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userDocSnap = await getDoc(doc(db, 'members', userCredential.user.uid));
      if (userDocSnap.exists()) {
        const userData = { id: userCredential.user.uid, ...userDocSnap.data() } as User;
        localStorage.setItem('smg_current_user', JSON.stringify(userData));
        onLogin(userData);
      } else {
        setError("Profil introuvable.");
      }
    } catch (err) {
      setError('Identifiants incorrects ou erreur réseau.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 space-y-6">
      <div className="w-20 h-20 bg-slate-900 border border-slate-800 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.3)]"><img src="/logo.png" alt="SMG" className="w-full h-full object-contain p-2" /></div>
      
      {!isFirebaseConfigured && (
        <div className="w-full max-w-sm bg-amber-500/10 border border-amber-500/50 p-3 rounded-xl flex items-start space-x-3 text-left">
           <ShieldAlert className="text-amber-500 shrink-0 mt-0.5" size={16} />
           <div>
             <h4 className="text-amber-500 font-black text-[10px] uppercase tracking-widest mb-1">Clés Vercel Manquantes</h4>
             <p className="text-slate-400 text-[9px] leading-tight">L'API Firebase n'est pas reconnue. Assure-toi que tes variables d'environnement sur Vercel commencent bien par <strong className="text-white">VITE_</strong> (ex: VITE_FIREBASE_API_KEY).</p>
           </div>
        </div>
      )}

      <FuturisticCard className="w-full max-w-sm" borderColor="cyan">
        <form onSubmit={handleLogin} className="space-y-4">
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white text-sm" placeholder="IDENTIFIANT" required />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white text-sm" placeholder="MOT DE PASSE" required />
          {error && <p className="text-rose-500 text-[10px] text-center font-bold">{error}</p>}
          <button type="submit" disabled={isLoading} className="w-full bg-cyan-600 text-white font-black py-3 rounded-lg flex justify-center items-center uppercase text-xs shadow-lg active:scale-95">
            {isLoading? 'ANALYSE...' : 'ACCÉDER'} <ChevronRight size={16} className="ml-2" />
          </button>
        </form>
      </FuturisticCard>
    </div>
  );
};
export default Login;
